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

public interface IUnusedGovernanceStub
{
    SystemGovernanceConfigDto GetConfig();
    void UpdateConfig(SystemGovernanceConfigDto config);
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
