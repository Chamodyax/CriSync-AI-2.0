using ReliefCoord.Application.DTOs;
using ReliefCoord.Domain.Entities;
using ReliefCoord.Domain.Enums;
using ReliefCoord.Domain.Events;

namespace ReliefCoord.Application.Interfaces;

public interface IAiDecisionSupportService
{
    string ProviderName { get; }
    Task<AiRequestEvaluationResult> EvaluateAssistanceRequestAsync(
        AssistanceRequest request,
        IReadOnlyList<AssistanceRequest> existingOpenRequests,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AiResourceCandidateDto>> RecommendResourcesForRequestAsync(
        AssistanceRequest request,
        IReadOnlyList<ResourceItem> availableResources,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AiShelterCandidateDto>> RecommendSheltersForRequestAsync(
        AssistanceRequest request,
        IReadOnlyList<Shelter> shelters,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AiVolunteerCandidateDto>> RecommendVolunteersForTaskAsync(
        string requiredSkill,
        double targetLat,
        double targetLon,
        IReadOnlyList<VolunteerProfile> volunteers,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DemandForecastItemDto>> ForecastResourceDemandAsync(
        Guid crisisEventId,
        IReadOnlyList<AssistanceRequest> recentRequests,
        IReadOnlyList<ResourceItem> currentInventory,
        CancellationToken cancellationToken = default);

    Task<MultilingualBriefingDto> GenerateMultilingualBriefingAsync(
        CrisisEvent crisis,
        int openRequestsCount,
        int criticalCount,
        string languageCode,
        CancellationToken cancellationToken = default);
}

public interface IAiProviderFactory
{
    IAiDecisionSupportService CreateProvider(bool forceFallback = false);
}

public interface INotificationChannelSender
{
    NotificationChannel Channel { get; }
    Task<(bool Success, string ProviderResponse)> SendAsync(
        string recipientContact,
        string subject,
        string body,
        string languageCode,
        CancellationToken cancellationToken = default);
}

public interface INotificationChannelFactory
{
    INotificationChannelSender CreateSender(NotificationChannel channel);
}

public interface IMappingProviderService
{
    double CalculateDistanceKm(double lat1, double lon1, double lat2, double lon2);
    Task<RouteCalculationDto> CalculateRouteAsync(double originLat, double originLon, double destLat, double destLon, CancellationToken cancellationToken = default);
    Task<GeocodingResultDto> GeocodeAddressAsync(string address, CancellationToken cancellationToken = default);
    Task<GeocodingResultDto> ReverseGeocodeAsync(double latitude, double longitude, CancellationToken cancellationToken = default);
}

public interface IDomainEventPublisher
{
    ValueTask PublishAsync(IDomainEvent domainEvent, CancellationToken cancellationToken = default);
}

public interface IDomainEventHandler<in TEvent> where TEvent : IDomainEvent
{
    Task HandleAsync(TEvent domainEvent, CancellationToken cancellationToken = default);
}

public interface IResourceAllocationStrategy
{
    string StrategyName { get; }
    ResourceAllocationPlanResult ComputeAllocationPlan(
        IReadOnlyList<AssistanceRequest> competingRequests,
        IReadOnlyList<ResourceItem> candidateResources,
        IMappingProviderService mappingService);
}

public interface IServiceResilienceMonitor
{
    bool SimulateExternalAiFailure { get; set; }
    bool SimulateExternalMappingFailure { get; set; }
    bool SimulateExternalNotificationFailure { get; set; }
    int AiCircuitTripCount { get; }
    int MappingCircuitTripCount { get; }
    int NotificationCircuitTripCount { get; }
    void RecordTrip(string serviceName);
    ResilienceStatusDto GetStatus();
}

public interface IGovernanceConfigProvider
{
    SystemGovernanceConfigDto GetConfig();
    void UpdateConfig(SystemGovernanceConfigDto config);
}
