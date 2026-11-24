using ReliefCoord.Application.DTOs;
using ReliefCoord.Application.Interfaces;

namespace ReliefCoord.Infrastructure.ExternalServices;

public class ServiceResilienceMonitor : IServiceResilienceMonitor
{
    public bool SimulateExternalAiFailure { get; set; }
    public bool SimulateExternalMappingFailure { get; set; }
    public bool SimulateExternalNotificationFailure { get; set; }

    public int AiCircuitTripCount { get; private set; }
    public int MappingCircuitTripCount { get; private set; }
    public int NotificationCircuitTripCount { get; private set; }

    public void RecordTrip(string serviceName)
    {
        if (serviceName == "AI")
        {
            AiCircuitTripCount = AiCircuitTripCount + 1;
        }
        else if (serviceName == "Mapping")
        {
            MappingCircuitTripCount = MappingCircuitTripCount + 1;
        }
        else if (serviceName == "Notification")
        {
            NotificationCircuitTripCount = NotificationCircuitTripCount + 1;
        }
    }

    public ResilienceStatusDto GetStatus()
    {
        string aiMode = SimulateExternalAiFailure ? "CircuitOpen_LocalHeuristicFallback" : "Healthy_PrimaryCloudEnsemble";
        string mappingMode = SimulateExternalMappingFailure ? "CircuitOpen_HaversineOfflineFallback" : "Healthy_OpenStreetMapRouting";
        string notificationMode = SimulateExternalNotificationFailure ? "CircuitOpen_AsyncRetryQueue" : "Healthy_MultiChannelGateway";

        return new ResilienceStatusDto(
            SimulateExternalAiFailure,
            SimulateExternalMappingFailure,
            SimulateExternalNotificationFailure,
            AiCircuitTripCount,
            MappingCircuitTripCount,

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
