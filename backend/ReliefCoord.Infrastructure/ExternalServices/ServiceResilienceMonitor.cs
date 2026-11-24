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
            NotificationCircuitTripCount,
            aiMode,
            mappingMode,
            notificationMode
        );
    }
}

public class GovernanceConfigProvider : IGovernanceConfigProvider
{
    private readonly object _configLock = new();
    private SystemGovernanceConfigDto _config = new(
        MinGlobalAdmins: 2,
        MaxGlobalAdmins: 3,
        MaxOrganizationAdmins: 3,
        RequireVolunteerCoordinatorVerification: true,
        RequirePartnerAdminApproval: true,
        HighValueDonationThresholdUsd: 50000m
    );

    public SystemGovernanceConfigDto GetConfig()
    {
        lock (_configLock)
        {
            return _config;
        }
    }

    public void UpdateConfig(SystemGovernanceConfigDto config)
    {
        lock (_configLock)
        {
            _config = config;
        }
    }
}
