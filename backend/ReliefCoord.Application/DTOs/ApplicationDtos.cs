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
    string SmsSenderId,
    int SmsIdempotencyWindowMinutes,
    bool SimulateExternalNotificationFailure,
    string EmailSmtpProvider,
    string EmailSenderAddress,
    bool EmailAlertsEnabled,
    string MappingProviderName,
    string GeocodingProviderName,
    bool SimulateExternalMappingFailure
);

public record AdminCreateUserDto(
    string FullName,
    string Email,
    string PhoneNumber,
    string Password,
    UserRole Role,
    Guid? OrganisationId,
    string PreferredLanguage
);

public record AdminUpdateUserDto(
    string FullName,
    string Email,
    string PhoneNumber,
    UserRole Role,
    Guid? OrganisationId,
    bool IsActive,
    string? NewPassword
);

public record UpdateCrisisEventDto(
    string Title,
    CrisisType CrisisType,
    CrisisSeverity Severity,
    string Region,
    string Description,
    double CenterLatitude,
    double CenterLongitude,
    double RadiusKm,
    bool IsActive
);

public record UpdateShelterDto(
    string Name,
    string Address,
    int TotalCapacity,
    int CurrentOccupancy,
    bool IsWheelchairAccessible,
    bool HasMedicalFacility,
    bool HasPowerBackup,
    string Status,
    double Latitude,
    double Longitude
);

public record UpdateResourceItemDto(
    string Name,
    RequestCategory Category,
    string WarehouseName,
    string Unit,
    int TotalQuantity,
    int AvailableQuantity,
    int ReorderThreshold,
    double WarehouseLatitude,
    double WarehouseLongitude
);

public record CreateCrisisEventDto(
    [Required, StringLength(250, MinimumLength = 3)] string Title,
    CrisisType CrisisType,
    CrisisSeverity Severity,
    [Required, StringLength(100)] string Country,
    [Required, StringLength(200)] string Region,
    [Required, StringLength(2000)] string Description,
    double CenterLatitude,
    double CenterLongitude,
    [Range(1, 2000)] double RadiusKm = 25.0,
    bool IsActive = true
);

public record CreatePublicAlertDto(
    Guid CrisisEventId,
    [Required, StringLength(250, MinimumLength = 3)] string Title,
    [Required, StringLength(2000, MinimumLength = 5)] string Message,
    [Required, StringLength(50)] string SeverityLevel,
    [StringLength(2000)] string SafetyGuidance = "",
    string? TranslationsJson = null
);

public record CreateResourceItemDto(
    [Required, StringLength(200, MinimumLength = 2)] string Name,
    RequestCategory Category,
    [Required, StringLength(50)] string Unit,
    [Range(1, 10000000)] int TotalQuantity,
    int? AvailableQuantity = null,
    [Range(0, 10000000)] int ReorderThreshold = 20,
    [Required, StringLength(200, MinimumLength = 2)] string WarehouseName = "Central Depot",
    double WarehouseLatitude = 6.9271,
    double WarehouseLongitude = 79.8612,
    bool SupportsColdChain = false,
    DateTime? ExpiryDateUtc = null,
    Guid? OwningOrganisationId = null
);

public record CreateShelterDto(
    [Required, StringLength(200, MinimumLength = 2)] string Name,
    Guid? CrisisEventId = null,
    [Required, StringLength(300, MinimumLength = 3)] string Address = "",
    double Latitude = 6.9271,
    double Longitude = 79.8612,
    [Range(1, 100000)] int TotalCapacity = 100,
    [Range(0, 100000)] int CurrentOccupancy = 0,
    bool IsWheelchairAccessible = false,
    bool HasMedicalFacility = false,
    bool HasCleanWater = true,
    bool HasPowerBackup = false,
    bool HasChildSafeSpace = false,
    string? AvailableServices = null,
    string? Status = null,
    Guid? ManagedByOrganisationId = null
);

public record UpdateVolunteerAvailabilityDto(
    bool IsAvailable,
    [Required, StringLength(200)] string AvailabilitySchedule,
    double? CurrentLatitude = null,
    double? CurrentLongitude = null
);

public record RespondVolunteerAssignmentDto(
    [Required] string Decision,
    string? Notes = null
);

public record CompleteVolunteerAssignmentDto(
    [Required, StringLength(1000)] string CompletionNotes
);

public record CreateCampaignExpenditureDto(
    [Range(0.01, 100000000)] decimal AmountUsd,
    [Required, StringLength(100)] string Category,
    [Required, StringLength(500)] string Description
);

public record RequestShelterSuppliesDto(
    RequestCategory Category,
    [Required, StringLength(200)] string ResourceName,
    [Range(1, 1000000)] int QuantityNeeded,
    [Required, StringLength(1000)] string Justification
);

public record ReplenishResourceDto(
    [Range(1, 1000000)] int AddedQuantity,
    string? SourceNote = null
);

public record CreatePartnerAidRequestDto(
    RequestCategory NeededCategory,
    [Required, StringLength(200)] string ResourceName,
    [Range(1, 1000000)] int QuantityNeeded,
    [Required, StringLength(1000)] string Justification,
    Guid? TargetPartnerOrganisationId = null
);

public record FulfillPartnerAidRequestDto(
    string? FulfillmentNotes = null
);

public record CreateOperationalAreaDto(
    [Required, StringLength(200)] string ZoneName,
    [Required, StringLength(100)] string District,
    double Latitude,
    double Longitude,
    [Range(1, 500)] double CoverageRadiusKm,
    [Range(0, 10000000)] int EstimatedAffectedPopulation,
    [Required, StringLength(50)] string RiskLevel,
    Guid? AssignedOrganisationId = null
);

public record QuickUnlockSetupRequestDto(
    [Required] string CurrentPassword,
    [Required, StringLength(20)] string Mode,
    [Required, StringLength(64)] string Secret,
    string? BiometricCredentialId = null,
    string? DeviceName = null,
    string? OriginHost = null
);

public record QuickUnlockSetupResponseDto(
    Guid UserId,
    string FullName,
    string Email,
    string Role,
    string Mode,
    bool HasBiometricCredential,
    string DeviceToken,
    string DeviceId,
    string DeviceName
);

public record TrustedDeviceSummaryDto(
    string DeviceId,
    string DeviceName,
    string OriginHost,
    bool HasBiometrics,
    DateTime CreatedAtUtc
);

public record QuickUnlockVerifyRequestDto(
    Guid UserId,
    [Required] string DeviceToken,
    [Required] string Secret
);

public record QuickUnlockChallengeRequestDto(
    Guid UserId,
    [Required] string DeviceToken
);

public record QuickUnlockChallengeResponseDto(
    string ChallengeId,
    string ChallengeBase64Url,
    string CredentialId
);

public record QuickUnlockBiometricVerifyRequestDto(
    Guid UserId,
    [Required] string DeviceToken,
    [Required] string ChallengeId,
    [Required] string CredentialId,
    [Required] string ClientDataJsonBase64Url
);

public record QuickUnlockStatusDto(
    bool QuickUnlockEnabled,
    string Mode,
    bool HasBiometricCredential,
    int FailedAttempts,
    List<TrustedDeviceSummaryDto> TrustedDevices
);

public record CheckoutShelterAllocationDto(
    string? DischargeNotes = null
);

public record FeedbackAnalyticsSummaryDto(
    int TotalReviewsCount,
    double AverageRating,
    double TimelyDeliveryPercentage,
    double SufficientQuantityPercentage,
    List<RequestFeedbackItemDto> RecentFeedbacks
);

public record RequestFeedbackItemDto(
    Guid Id,
    Guid AssistanceRequestId,
    string RequestReferenceCode,
    string RequestTitle,
    Guid CitizenUserId,
    int Rating,
    string Comments,
    bool WasAidTimely,
    bool WasQuantitySufficient,
    DateTime CreatedAtUtc
);

public record SitRepLowStockAlertDto(
    Guid ResourceItemId,
    string ResourceName,
    string Category,
    string WarehouseName,
    int AvailableQuantity,
    int ReorderThreshold,
    DateTime? ExpiryDateUtc,
    int? DaysUntilExpiry,
    string AlertReason
);

public record SitRepReportDto(
    DateTime GeneratedAtUtc,
    string GeneratedByUser,
    string ActiveCrisisTitle,
    string ActiveCrisisRegion,
    string ActiveCrisisSeverity,
    int TotalAssistanceRequests,
    int UnresolvedRequestsCount,
    int CriticalOpenRequestsCount,
    int TotalShelterCapacity,
    int TotalShelterOccupied,
    int ActiveShelterCheckInsCount,
    decimal TotalDonationsCollectedUsd,
    decimal TotalDonationsDisbursedUsd,
    double AverageCitizenRating,
    int TotalCitizenReviews,
    List<SitRepLowStockAlertDto> WarehouseAlerts
);
