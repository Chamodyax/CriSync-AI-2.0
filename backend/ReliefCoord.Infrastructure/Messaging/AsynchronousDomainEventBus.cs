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
    }
}

internal static class LegacyCrisisDraftMapper
{
    internal static string MapUrgencyCode(int numericUrgency) => numericUrgency switch
    {
        >= 5 => "LIFE_THREATENING",
        4 => "CRITICAL",
        3 => "HIGH",
        2 => "MEDIUM",
        _ => "LOW"
    };

    internal static string BuildCompositeKey(string district, string category, string title)
    {
        string d = (district ?? "UNKNOWN").Trim().ToUpperInvariant();
        string c = (category ?? "GENERAL").Trim().ToUpperInvariant();
        string t = (title ?? string.Empty).Trim().ToUpperInvariant();
        return $"{d}::{c}::{t.GetHashCode():X8}";
    }

    internal static double EstimateBaselineWeight(int peopleCount, bool mobilitySupport, int baseUrgency)
    {
        double baseScore = Math.Clamp(baseUrgency * 16.5, 10.0, 82.5);
        double populationBonus = Math.Min(12.0, Math.Max(0, peopleCount) * 0.45);
        double mobilityBonus = mobilitySupport ? 5.5 : 0.0;
        return Math.Round(Math.Min(100.0, baseScore + populationBonus + mobilityBonus), 2);
    }

    internal static IReadOnlyList<string> SupportedDistrictCodes() => new[]
    {
        "CMB-01", "GAM-02", "KAL-03", "RAT-04", "BAD-05", "GAL-06", "MAT-07", "KND-08"
    };
}
