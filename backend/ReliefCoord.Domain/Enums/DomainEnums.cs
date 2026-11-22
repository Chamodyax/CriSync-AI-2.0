namespace ReliefCoord.Domain.Enums;

public enum UserRole
{
    Citizen,
    Donor,
    Volunteer,
    EmergencyCoordinator,
    CaseManager,
    LogisticsManager,
    ShelterAdmin,
    VolunteerCoordinator,
    DonorOfficer,
    PartnerOfficer,
    OrganizationAdmin,
    SystemAdmin
}

public enum CrisisSeverity
{
    Low,
    Moderate,
    High,
    Critical,
    Catastrophic
}

public enum CrisisType
{
    Flood,
    Landslide,
    Earthquake,
    SevereStorm,
    DiseaseOutbreak,
    MassDisplacement,
    Other
}

public enum RequestCategory
{
    Food,
    Medicine,
    TemporaryShelter,
    Transportation,
    AccessibilityAssistance,
    WaterAndSanitation,
    SearchAndRescue,
    MedicalEvacuation
}

public enum UrgencyLevel
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4,
    LifeThreatening = 5
}

public enum RequestStatus
{
    Submitted,
    PendingAiReview,
    Verified,
    Prioritised,
    Escalated,
    Assigned,
    InProgress,
    Fulfilled,
    MergedAsDuplicate,
    Closed,
    Rejected
}

public enum AiRecommendationType
{
    RequestClassification,
    UrgencyScoring,
    DuplicateDetection,
    ResourceMatching,
    ShelterMatching,
    VolunteerMatching,
    DemandForecast,
    AnomalyDetection,
    CrisisBriefing
}

public enum GovernanceDecisionStatus
{
    PendingReview,
    Approved,
    Modified,
    Rejected,
    Deferred
}

public enum NotificationChannel
{
    Email,
    Sms,
    Push,
    InApp
}

public enum NotificationDeliveryStatus
{
    Queued,
    Sent,
    FailedPendingRetry,
    PermanentlyFailed,
    SkippedDuplicate
}
