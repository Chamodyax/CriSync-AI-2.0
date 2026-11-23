using System.ComponentModel.DataAnnotations;
using ReliefCoord.Domain.Enums;

namespace ReliefCoord.Application.DTOs;

public record LoginRequestDto(string Email, string Password);

public record RegisterUserRequestDto(
    string FullName,
    string Email,
    string PhoneNumber,
    string Password,
    UserRole Role,
    string PreferredLanguage,
    Guid? OrganisationId,
    string? OrganisationName = null,
    string? OrganisationType = null,
    string? Country = null,
    string? PartnershipProposal = null,
    string? SkillsCsv = null,
    string? LanguagesCsv = null,
    string? AvailabilitySchedule = null
);

public record AuthResponseDto(
    string Token,
    Guid UserId,
    string FullName,
    string Email,
    string Role,
    string PreferredLanguage,
    Guid? OrganisationId,
    string OrganisationName,
    string AccountStatus = "Active",
    string PhoneNumber = "",
    string ProfilePhotoUrl = ""
);

public record UpdateMyProfileDto(
    string FullName,
    string PhoneNumber,
    string PreferredLanguage,
    string? ProfilePhotoUrl,
    string? CurrentPassword,
    string? NewPassword
);

public record UpsertHouseholdDto(
    string HouseholdHeadName,
    int TotalMembers,
    int ChildrenCount,
    int ElderlyCount,
    bool HasMobilityNeeds,
    bool HasChronicMedicalNeeds,
    string MedicalNotes,
    string PrimaryAddress,
    double Latitude,
    double Longitude
);

public record CreateAssistanceRequestDto(
    Guid CrisisEventId,
    RequestCategory Category,
    UrgencyLevel SelfReportedUrgency,
    string Title,
    string Description,
    int AffectedPeopleCount,
    int RequestedQuantity,
    bool RequiresAccessibilitySupport,
    string LocationAddress,
    double Latitude,
    double Longitude,
    string SupportingEvidenceFileName,
    string SupportingEvidenceMimeType,
    string PreferredLanguage,
    string IdempotencyKey
);

public record UpdateRequestStatusDto(
    RequestStatus NewStatus,
    UrgencyLevel? UpdatedUrgency,
    Guid? AssignedCaseManagerId,
    Guid? AssignedOrganisationId,
    string ActionNote
);

public record MergeDuplicateRequestDto(
    Guid PrimaryRequestId,
    Guid DuplicateRequestId,
    string MergeJustification
);

public record SubmitFeedbackDto(
    Guid AssistanceRequestId,
    int Rating,
    string Comments,
    bool WasAidTimely,
    bool WasQuantitySufficient
);

public record AiRequestEvaluationResult(
    RequestCategory SuggestedCategory,
    UrgencyLevel SuggestedUrgency,
    double PriorityScore,
    double ConfidenceScore,
    string Rationale,
    Dictionary<string, double> FeatureWeights,
    bool IsPotentialDuplicate,
    Guid? DuplicateOfRequestId,
    double DuplicateSimilarityScore,
    bool IsSuspicious,
    string SuspiciousReason,
    string ProviderUsed
);

public record ReviewAiRecommendationDto(
    Guid RecommendationId,
    GovernanceDecisionStatus DecisionStatus,
    UrgencyLevel? OverriddenUrgency,
    RequestCategory? OverriddenCategory,
    string Justification
);

public record AiResourceCandidateDto(
    Guid ResourceItemId,
    string ResourceName,
    string WarehouseName,
    int AvailableQuantity,
    double DistanceKm,
    double MultiConstraintScore,
    string ScoreBreakdown,
    bool SupportsColdChain,
    int DaysUntilExpiry
);

public record AiShelterCandidateDto(
    Guid ShelterId,
    string ShelterName,
    string Address,
    int AvailableSpots,
    double DistanceKm,
    double SuitabilityScore,
    bool IsWheelchairAccessible,
    bool HasMedicalFacility,
    string RecommendationReason
);

public record AiVolunteerCandidateDto(
    Guid VolunteerProfileId,
    string FullName,
    string SkillsCsv,
    double DistanceKm,
    double MatchScore,
    string MatchExplanation
);

public record DemandForecastItemDto(
    string CategoryName,
    int HistoricalRequestsCount,
    int CurrentRequestedUnits,
    int PredictedNext48HoursDemand,
    int CurrentAvailableStock,
    int ProjectedDeficit,
    string RiskStatus,
    double Confidence
);

public record MultilingualBriefingDto(
    Guid CrisisEventId,
    string LanguageCode,
    string LanguageName,
    string Headline,
    string OperationalSummary,
    string CitizenSafetyAdvisory,
    string GeneratedByProvider
);

public record AllocateResourceRequestDto(
    Guid AssistanceRequestId,
    Guid? PreferredResourceItemId,
    string StrategyName
);

public record CompetingShortageScenarioRequestDto(
    Guid ResourceItemId,
    List<Guid> CompetingRequestIds,
    string StrategyName
);

public record PlannedAllocationItemDto(
    Guid AssistanceRequestId,
    string RequestReferenceCode,
    string RequestTitle,
    UrgencyLevel Urgency,
    double PriorityScore,
    Guid SelectedResourceItemId,
    string SelectedResourceName,
    string WarehouseName,
    int RequestedQuantity,
    int AllocatedQuantity,
    bool IsPartialShortage,
    double ConstraintScore,
    double DistanceKm,
    string AlternativeRecommendation
);

public record ResourceAllocationPlanResult(
    string StrategyUsed,
    bool ShortageEncountered,
    int TotalRequestedAcrossCases,
    int TotalAllocatedAcrossCases,
    int TotalUnmetShortfall,
    List<PlannedAllocationItemDto> Allocations,
    string ArchitecturalExplanation
);

public record AllocateShelterRequestDto(
    Guid ShelterId,
    Guid? AssistanceRequestId,
    Guid CitizenUserId,
    string HouseholdName,
    int MembersCount,
    bool RequiresAccessibility
);

public record AssignVolunteerTaskDto(
    Guid VolunteerProfileId,
    Guid? AssistanceRequestId,
    string TaskTitle,
    string RequiredSkill
);

public record CreateDonationDto(
    Guid CampaignId,
    string DonorName,
    string DonationType,
    decimal MonetaryAmountUsd,
    string MaterialDescription,
    int MaterialQuantity,
    string AllocationPurpose,
    string SandboxCardLastFour
);

public record CreateVolunteerProfileDto(
    string FullName,
    string SkillsCsv,
    string LanguagesCsv,
    string AvailabilitySchedule,
    double CurrentLatitude,
    double CurrentLongitude
);

public record CreateDonationCampaignDto(
    string Title,
    Guid? CrisisEventId,
    decimal TargetAmountUsd
);

public record SendNotificationRequestDto(
    Guid RecipientUserId,
    string RecipientContact,
    NotificationChannel Channel,
    string LanguageCode,
    string Subject,
    string MessageBody,
    string IdempotencyKey
);

public record RouteCalculationDto(
    double DistanceKm,
    int EstimatedMinutes,
    string RouteSummary,
    string ProviderUsed
);

public record GeocodingResultDto(
    string FormattedAddress,
    double Latitude,
    double Longitude,
    string ProviderUsed
);

public record ResilienceStatusDto(
    bool SimulateExternalAiFailure,
    bool SimulateExternalMappingFailure,
    bool SimulateExternalNotificationFailure,
    int AiCircuitTripCount,
    int MappingCircuitTripCount,
    int NotificationCircuitTripCount,
    string ActiveAiMode,
    string ActiveMappingMode,
    string ActiveNotificationMode
);

public record OperationalKpiMetricsDto(
    int TotalRequests,
    int UnresolvedCasesCount,
    int CriticalOpenCasesCount,
    int PotentialDuplicatesFlaggedCount,
    int SuspiciousItemsFlaggedCount,
    double AverageResponseTimeMinutes,
    double ResourceUtilisationPercentage,
    double ShelterOccupancyPercentage,
    int TotalShelterCapacity,
    int TotalShelterOccupied,
    int TotalAiRecommendations,
    int ReviewedAiRecommendations,
    double AiOverrideFrequencyPercentage,
    int TotalNotificationsSent,
    int DuplicateNotificationsPreventedCount,
    decimal TotalDonationsCollectedUsd,
    Dictionary<string, int> RequestsByCategory,
    Dictionary<string, int> RequestsByStatus
);

public record AdminUserSummaryDto(
    Guid Id,
    string FullName,
    string Email,
    string PhoneNumber,
    string Role,
    string PreferredLanguage,
    Guid? OrganisationId,
    string OrganisationName,
    bool IsActive,
    DateTime CreatedAtUtc,
    string AccountStatus = "Active",
    string InvitedByUserName = "",
    string InvitationCode = ""
);

public record RegisterCitizenOnBehalfDto(
    string FullName,
    string Email,
    string PhoneNumber,
    string Password,
    string PrimaryAddress,
    int TotalMembers,
    int ChildrenCount,
    int ElderlyCount,
    bool HasMobilityNeeds,
    bool HasChronicMedicalNeeds,
    string MedicalNotes,
    string PreferredLanguage
);

public record InviteStaffRequestDto(
    string FullName,
    string Email,
    string PhoneNumber,
    string TemporaryPassword,
    UserRole Role,
    Guid? OrganisationId,
    string PreferredLanguage
);

public record RolePermissionDto(
    UserRole Role,
    string PermissionCode,
    string Description
);

public record SystemGovernanceConfigDto(
    int MinGlobalAdmins,
    int MaxGlobalAdmins,
    int MaxOrganizationAdmins,
    bool RequireVolunteerCoordinatorVerification,
    bool RequirePartnerAdminApproval,
    decimal HighValueDonationThresholdUsd
);

public record ServiceIntegrationSettingsDto(
    string AiProviderName,
    string AiModelName,
    double AiConfidenceThreshold,
    bool SimulateExternalAiFailure,
    string SmsProviderName,
