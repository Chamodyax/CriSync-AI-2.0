using System.Threading.Channels;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ReliefCoord.Application.DTOs;
using ReliefCoord.Application.Interfaces;
using ReliefCoord.Application.Services;
using ReliefCoord.Domain.Enums;
using ReliefCoord.Domain.Events;

namespace ReliefCoord.Infrastructure.Messaging;

public class InMemoryDomainEventQueue : IDomainEventPublisher
{
    private readonly Channel<IDomainEvent> _channel = Channel.CreateUnbounded<IDomainEvent>();

    public ChannelReader<IDomainEvent> Reader => _channel.Reader;

    public async ValueTask PublishAsync(IDomainEvent domainEvent, CancellationToken cancellationToken = default)
    {
        await _channel.Writer.WriteAsync(domainEvent, cancellationToken);
    }
}

public class AsynchronousDomainEventWorker : BackgroundService
{
    private readonly InMemoryDomainEventQueue _eventQueue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AsynchronousDomainEventWorker> _logger;

    public AsynchronousDomainEventWorker(
        InMemoryDomainEventQueue eventQueue,
        IServiceScopeFactory scopeFactory,
        ILogger<AsynchronousDomainEventWorker> logger)
    {
        _eventQueue = eventQueue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    private static async Task<(string Contact, string LanguageCode)> ResolveRecipientAsync(
        IUnitOfWork uow,
        Guid userId,
        string fallbackLanguage,
        CancellationToken cancellationToken)
    {
        if (userId != Guid.Empty)
        {
            var user = await uow.Users.GetByIdAsync(userId, cancellationToken);
            if (user != null)
            {
                string contact = !string.IsNullOrWhiteSpace(user.PhoneNumber)
                    ? user.PhoneNumber
                    : (!string.IsNullOrWhiteSpace(user.Email) ? user.Email : $"user:{user.Id}");
                string lang = string.IsNullOrWhiteSpace(user.PreferredLanguage) ? fallbackLanguage : user.PreferredLanguage;
                return (contact, lang);
            }
        }

        return ("unassigned-recipient@crisync.org", string.IsNullOrWhiteSpace(fallbackLanguage) ? "en" : fallbackLanguage);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var retryLoopTask = RunPeriodicNotificationRetryLoopAsync(stoppingToken);

        try
        {
            await foreach (var domainEvent in _eventQueue.Reader.ReadAllAsync(stoppingToken))
            {
                await ProcessDomainEventAsync(domainEvent, stoppingToken);
            }
        }
        finally
        {
            await retryLoopTask;
        }
    }

    private async Task ProcessDomainEventAsync(IDomainEvent domainEvent, CancellationToken stoppingToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var opsService = scope.ServiceProvider.GetRequiredService<HumanitarianOperationsService>();
            var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

            if (domainEvent is AssistanceRequestSubmittedEvent submitted)
            {
                var (contact, lang) = await ResolveRecipientAsync(uow, submitted.CitizenUserId, submitted.PreferredLanguage, stoppingToken);
                await opsService.SendIdempotentNotificationAsync(new SendNotificationRequestDto(
                    submitted.CitizenUserId,
                    contact,
                    NotificationChannel.Sms,
                    lang,
                    $"Assistance Request {submitted.ReferenceCode} Received",
                    $"Your emergency request ({submitted.ReferenceCode}) has been received and prioritised for human coordinator review.",
                    $"EVT-SUBMIT-{submitted.RequestId}"
                ), stoppingToken);
            }
            else if (domainEvent is ResourceAllocatedEvent allocated)
            {
                var (contact, lang) = await ResolveRecipientAsync(uow, allocated.CitizenUserId, "en", stoppingToken);
                await opsService.SendIdempotentNotificationAsync(new SendNotificationRequestDto(
                    allocated.CitizenUserId,
                    contact,
                    NotificationChannel.Sms,
                    lang,
                    $"Aid Dispatched: {allocated.ResourceName}",
                    $"Allocated {allocated.AllocatedQuantity} units of {allocated.ResourceName} to your request.",
                    $"EVT-ALLOC-{allocated.AllocationId}"
                ), stoppingToken);
            }
            else if (domainEvent is ShelterAllocatedEvent shelterEvt)
            {
                var (contact, lang) = await ResolveRecipientAsync(uow, shelterEvt.CitizenUserId, "en", stoppingToken);
                await opsService.SendIdempotentNotificationAsync(new SendNotificationRequestDto(
                    shelterEvt.CitizenUserId,
                    contact,
                    NotificationChannel.Sms,
                    lang,
                    $"Shelter Confirmed: {shelterEvt.ShelterName}",
                    $"Your household ({shelterEvt.AllocatedMembersCount} members) has been allocated space at {shelterEvt.ShelterName}.",
                    $"EVT-SHELTER-{shelterEvt.ShelterId}-{shelterEvt.CitizenUserId}"
                ), stoppingToken);
            }
            else if (domainEvent is RequestStatusChangedEvent statusEvt)
            {
                var (contact, lang) = await ResolveRecipientAsync(uow, statusEvt.CitizenUserId, statusEvt.PreferredLanguage, stoppingToken);
                await opsService.SendIdempotentNotificationAsync(new SendNotificationRequestDto(
                    statusEvt.CitizenUserId,
                    contact,
                    NotificationChannel.InApp,
                    lang,
                    $"Request {statusEvt.ReferenceCode} Status: {statusEvt.NewStatus}",
                    $"Your case {statusEvt.ReferenceCode} moved to '{statusEvt.NewStatus}'. {statusEvt.Note}",
                    $"EVT-REQSTATUS-{statusEvt.RequestId}-{statusEvt.NewStatus}-{statusEvt.EventId:N}"
                ), stoppingToken);
            }
            else if (domainEvent is VolunteerAssignedEvent volEvt)
            {
                var (contact, lang) = await ResolveRecipientAsync(uow, volEvt.VolunteerUserId, "en", stoppingToken);
                await opsService.SendIdempotentNotificationAsync(new SendNotificationRequestDto(
                    volEvt.VolunteerUserId,
                    contact,
                    NotificationChannel.Push,
                    lang,
                    $"New Volunteer Mission Assigned: {volEvt.TaskTitle}",
                    $"Hello {volEvt.VolunteerName}, you have been assigned to '{volEvt.TaskTitle}'. Please review and accept or decline in Volunteers.",
                    $"EVT-VOLASSIGN-{volEvt.AssignmentId}"
                ), stoppingToken);
            }
            else if (domainEvent is PublicAlertBroadcastEvent alertEvt)
            {
                var citizens = await uow.Users.FindAsync(u => u.Role == UserRole.Citizen && u.IsActive, stoppingToken);
                foreach (var citizen in citizens)
                {
                    string contact = !string.IsNullOrWhiteSpace(citizen.PhoneNumber) ? citizen.PhoneNumber : citizen.Email;
                    string lang = string.IsNullOrWhiteSpace(citizen.PreferredLanguage) ? "en" : citizen.PreferredLanguage;
                    await opsService.SendIdempotentNotificationAsync(new SendNotificationRequestDto(
                        citizen.Id,
                        contact,
                        NotificationChannel.InApp,
                        lang,
                        $"[{alertEvt.SeverityLevel}] {alertEvt.Title}",
                        alertEvt.Message,
                        $"EVT-ALERT-{alertEvt.AlertId}-{citizen.Id}"
                    ), stoppingToken);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing domain event {EventType}", domainEvent.EventType);
        }
    }

    private async Task RunPeriodicNotificationRetryLoopAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(15));
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var opsService = scope.ServiceProvider.GetRequiredService<HumanitarianOperationsService>();
                    await opsService.RetryFailedNotificationsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during scheduled notification retry sweep");
                }
            }
        }
        catch (OperationCanceledException)
        {
        }
    }
}
