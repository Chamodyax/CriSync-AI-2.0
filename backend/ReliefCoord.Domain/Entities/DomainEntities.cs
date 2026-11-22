using System.ComponentModel.DataAnnotations;
using ReliefCoord.Domain.Enums;

namespace ReliefCoord.Domain.Entities;

public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}

public class Organisation : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string OrganisationType { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public bool IsVerified { get; set; } = true;
    public string PartnershipStatus { get; set; } = "Approved";
    public string PartnershipProposal { get; set; } = string.Empty;
}

public class AppUser : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string PasswordSalt { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Citizen;
    public string PreferredLanguage { get; set; } = "en";
    public Guid? OrganisationId { get; set; }
    public Organisation? Organisation { get; set; }
    public bool IsActive { get; set; } = true;
    public string AccountStatus { get; set; } = "Active";
    public string InvitedByUserName { get; set; } = string.Empty;
    public string InvitationCode { get; set; } = string.Empty;
    public string ProfilePhotoUrl { get; set; } = string.Empty;
    public bool QuickUnlockEnabled { get; set; }
    public string QuickUnlockMode { get; set; } = string.Empty;
    public string QuickUnlockSecretHash { get; set; } = string.Empty;
    public string QuickUnlockSecretSalt { get; set; } = string.Empty;
    public string QuickUnlockDeviceTokenHash { get; set; } = string.Empty;
    public string QuickUnlockDeviceTokenSalt { get; set; } = string.Empty;
    public string QuickUnlockBiometricCredentialId { get; set; } = string.Empty;
    public int QuickUnlockFailedAttempts { get; set; }
    public string QuickUnlockTrustedDevicesJson { get; set; } = "[]";
}

public class RolePermission : BaseEntity
{
    public UserRole Role { get; set; }
    public string PermissionCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class HouseholdProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public AppUser? User { get; set; }
    public string HouseholdHeadName { get; set; } = string.Empty;
    public int TotalMembers { get; set; } = 1;
    public int ChildrenCount { get; set; }
    public int ElderlyCount { get; set; }
    public bool HasMobilityNeeds { get; set; }
    public bool HasChronicMedicalNeeds { get; set; }
    public string MedicalNotes { get; set; } = string.Empty;
    public string PrimaryAddress { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class CrisisEvent : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public CrisisType CrisisType { get; set; }
    public CrisisSeverity Severity { get; set; }
    public string Country { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double CenterLatitude { get; set; }
    public double CenterLongitude { get; set; }
    public double RadiusKm { get; set; } = 25.0;
    public bool IsActive { get; set; } = true;
    public Guid? LeadCoordinatorId { get; set; }
    public List<OperationalArea> OperationalAreas { get; set; } = new();
}

public class OperationalArea : BaseEntity
{
    public Guid CrisisEventId { get; set; }
    public string ZoneName { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double CoverageRadiusKm { get; set; } = 10.0;
    public int EstimatedAffectedPopulation { get; set; }
    public string RiskLevel { get; set; } = "High";
    public Guid? AssignedOrganisationId { get; set; }
}

public class PublicAlert : BaseEntity
{
    public Guid CrisisEventId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string SeverityLevel { get; set; } = "Warning";
    public string SafetyGuidance { get; set; } = string.Empty;
    public string TranslationsJson { get; set; } = "{}";
    public bool IsVerified { get; set; } = true;
    public Guid IssuedByUserId { get; set; }
}

public class AssistanceRequest : BaseEntity
{
    public string ReferenceCode { get; set; } = string.Empty;
    public Guid CitizenUserId { get; set; }
    public Guid CrisisEventId { get; set; }
    public RequestCategory Category { get; set; }
    public UrgencyLevel SelfReportedUrgency { get; set; }
    public UrgencyLevel FinalApprovedUrgency { get; set; }
    public double PriorityScore { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int AffectedPeopleCount { get; set; } = 1;
    public int RequestedQuantity { get; set; } = 10;
    public bool RequiresAccessibilitySupport { get; set; }
    public string LocationAddress { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string SupportingEvidenceFileName { get; set; } = string.Empty;
    public string SupportingEvidenceMimeType { get; set; } = string.Empty;
    public RequestStatus Status { get; set; } = RequestStatus.Submitted;
    public bool IsFlaggedPotentialDuplicate { get; set; }
    public Guid? PotentialDuplicateOfRequestId { get; set; }
    public double DuplicateSimilarityScore { get; set; }
    public bool IsFlaggedSuspicious { get; set; }
    public string SuspiciousReason { get; set; } = string.Empty;
    public Guid? AssignedCaseManagerId { get; set; }
    public Guid? AssignedOrganisationId { get; set; }
    public string PreferredLanguage { get; set; } = "en";
    public string IdempotencyKey { get; set; } = string.Empty;
    public List<RequestHistory> Timeline { get; set; } = new();
    public List<AiRecommendation> AiRecommendations { get; set; } = new();
}

public class RequestHistory : BaseEntity
{
    public Guid AssistanceRequestId { get; set; }
    public RequestStatus PreviousStatus { get; set; }
    public RequestStatus NewStatus { get; set; }
    public string ActionDescription { get; set; } = string.Empty;
    public Guid ChangedByUserId { get; set; }
    public string ChangedByUserName { get; set; } = string.Empty;
    public string ChangedByRole { get; set; } = string.Empty;
}

public class RequestFeedback : BaseEntity
{
    public Guid AssistanceRequestId { get; set; }
    public Guid CitizenUserId { get; set; }
    public int Rating { get; set; } = 5;
    public string Comments { get; set; } = string.Empty;
    public bool WasAidTimely { get; set; } = true;
    public bool WasQuantitySufficient { get; set; } = true;
}

public class AiRecommendation : BaseEntity
{
    public Guid? AssistanceRequestId { get; set; }
    public Guid? CrisisEventId { get; set; }
    public AiRecommendationType RecommendationType { get; set; }
    public string ModelIdentifier { get; set; } = "AI-Priority-Classifier";
    public string RecommendedCategory { get; set; } = string.Empty;
    public UrgencyLevel RecommendedUrgency { get; set; }
    public double RecommendedPriorityScore { get; set; }
    public double ConfidenceScore { get; set; }
    public string Rationale { get; set; } = string.Empty;
    public string ExplainableFactorsJson { get; set; } = "{}";
    public string SuggestedPayloadJson { get; set; } = "{}";
    public GovernanceDecisionStatus GovernanceStatus { get; set; } = GovernanceDecisionStatus.PendingReview;
    public HumanGovernanceDecision? HumanDecision { get; set; }
}

public class HumanGovernanceDecision : BaseEntity
{
    public Guid AiRecommendationId { get; set; }
    public GovernanceDecisionStatus ActionTaken { get; set; }
    public string OriginalAiRecommendationSummary { get; set; } = string.Empty;
    public double OriginalConfidence { get; set; }
    public string FinalHumanDecisionSummary { get; set; } = string.Empty;
    public string OverrideJustification { get; set; } = string.Empty;
    public Guid ResponsibleUserId { get; set; }
    public string ResponsibleUserName { get; set; } = string.Empty;
    public string ResponsibleUserRole { get; set; } = string.Empty;
    public DateTime DecisionTimestampUtc { get; set; } = DateTime.UtcNow;
}

public class Shelter : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public Guid CrisisEventId { get; set; }
    public string Address { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int TotalCapacity { get; set; }
    [ConcurrencyCheck]
    public int CurrentOccupancy { get; set; }
    public bool IsWheelchairAccessible { get; set; }
    public bool HasMedicalFacility { get; set; }
    public bool HasCleanWater { get; set; } = true;
    public bool HasPowerBackup { get; set; }
    public bool HasChildSafeSpace { get; set; }
    public string AvailableServices { get; set; } = string.Empty;
    public string Status { get; set; } = "Operational";
    public Guid? ManagedByOrganisationId { get; set; }
}

public class ShelterAllocation : BaseEntity
{
    public Guid ShelterId { get; set; }
    public Guid? AssistanceRequestId { get; set; }
    public Guid CitizenUserId { get; set; }
    public string HouseholdName { get; set; } = string.Empty;
    public int AllocatedMembersCount { get; set; }
    public bool RequiresAccessibility { get; set; }
    public string AllocationStatus { get; set; } = "Active";
    public Guid ApprovedByUserId { get; set; }
}

public class ResourceItem : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public RequestCategory Category { get; set; }
    public string Unit { get; set; } = "Units";
    public int TotalQuantity { get; set; }
    public int AvailableQuantity { get; set; }
    public int AllocatedQuantity { get; set; }
    public int ReorderThreshold { get; set; } = 50;
    public string WarehouseName { get; set; } = string.Empty;
    public double WarehouseLatitude { get; set; }
    public double WarehouseLongitude { get; set; }
    public bool SupportsColdChain { get; set; }
    public DateTime? ExpiryDateUtc { get; set; }
    public Guid? OwningOrganisationId { get; set; }
}

public class ResourceAllocation : BaseEntity
{
    public Guid ResourceItemId { get; set; }
    public Guid AssistanceRequestId { get; set; }
    public int RequestedQuantity { get; set; }
    public int AllocatedQuantity { get; set; }
    public bool IsPartialShortageAllocation { get; set; }
    public string AllocationStrategyUsed { get; set; } = string.Empty;
    public double ConstraintMatchScore { get; set; }
    public double EstimatedDistanceKm { get; set; }
    public string AlternativeRecommendation { get; set; } = string.Empty;
    public string Status { get; set; } = "Allocated";
    public Guid ApprovedByUserId { get; set; }
}

public class DispatchRecord : BaseEntity
{
    public Guid ResourceAllocationId { get; set; }
    public string VehicleRegistration { get; set; } = string.Empty;
    public string DriverName { get; set; } = string.Empty;
    public string RouteSummary { get; set; } = string.Empty;
    public double DistanceKm { get; set; }
    public int EstimatedTravelMinutes { get; set; }
    public string DispatchStatus { get; set; } = "Dispatched";
    public DateTime DispatchedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? DeliveredAtUtc { get; set; }
}

public class PartnerAidRequest : BaseEntity
{
    public Guid RequestingOrganisationId { get; set; }
    public Guid? TargetPartnerOrganisationId { get; set; }
    public RequestCategory NeededCategory { get; set; }
    public string ResourceName { get; set; } = string.Empty;
    public int QuantityNeeded { get; set; }
    public string Justification { get; set; } = string.Empty;
    public string Status { get; set; } = "Open";
}

public class VolunteerProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string SkillsCsv { get; set; } = string.Empty;
    public string LanguagesCsv { get; set; } = "en";
    public bool IsVerified { get; set; } = true;
    public bool IsAvailable { get; set; } = true;
    public string AvailabilitySchedule { get; set; } = "Weekdays & Emergency On-Call";
    public double CurrentLatitude { get; set; }
    public double CurrentLongitude { get; set; }
    public int CompletedTasksCount { get; set; }
}

public class VolunteerTaskAssignment : BaseEntity
{
    public Guid VolunteerProfileId { get; set; }
    public Guid? AssistanceRequestId { get; set; }
    public string TaskTitle { get; set; } = string.Empty;
    public string RequiredSkill { get; set; } = string.Empty;
    public double AiMatchScore { get; set; }
    public double DistanceKm { get; set; }
    public string Status { get; set; } = "Assigned";
    public string CompletionNotes { get; set; } = string.Empty;
    public DateTime? CompletedAtUtc { get; set; }
}

public class DonationCampaign : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public Guid CrisisEventId { get; set; }
    public decimal TargetAmountUsd { get; set; }
    public decimal CollectedAmountUsd { get; set; }
    public decimal DisbursedAmountUsd { get; set; }
    public bool IsActive { get; set; } = true;
}

public class DonationRecord : BaseEntity
{
    public Guid CampaignId { get; set; }
    public Guid? DonorUserId { get; set; }
    public string DonorName { get; set; } = string.Empty;
    public string DonationType { get; set; } = "Monetary";
    public decimal MonetaryAmountUsd { get; set; }
    public string MaterialDescription { get; set; } = string.Empty;
    public int MaterialQuantity { get; set; }
    public string PaymentGatewayReference { get; set; } = string.Empty;
    public string AllocationPurpose { get; set; } = string.Empty;
    public bool IsFlaggedSuspicious { get; set; }
    public string SuspiciousReason { get; set; } = string.Empty;
    public bool IsReviewedByHuman { get; set; }
    public string VerificationStatus { get; set; } = "Verified";
}

public class NotificationRecord : BaseEntity
{
    public Guid RecipientUserId { get; set; }
    public string RecipientContact { get; set; } = string.Empty;
    public NotificationChannel Channel { get; set; }
    public string LanguageCode { get; set; } = "en";
    public string Subject { get; set; } = string.Empty;
    public string MessageBody { get; set; } = string.Empty;
    public string IdempotencyKey { get; set; } = string.Empty;
    public NotificationDeliveryStatus DeliveryStatus { get; set; } = NotificationDeliveryStatus.Queued;
    public int RetryAttempts { get; set; }
    public string ProviderResponse { get; set; } = string.Empty;
}

public class MappingReference : BaseEntity
{
    public string Label { get; set; } = string.Empty;
    public string ReferenceType { get; set; } = "ServiceCentre";
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string GeoJsonPolygon { get; set; } = string.Empty;
    public Guid CrisisEventId { get; set; }
}

public class AuditEventRecord : BaseEntity
{
    public string EventCategory { get; set; } = string.Empty;
    public string ActionName { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public Guid? ActorUserId { get; set; }
    public string ActorUserName { get; set; } = string.Empty;
    public string ActorRole { get; set; } = string.Empty;
    public string DetailsJson { get; set; } = "{}";
    public string IpAddress { get; set; } = "127.0.0.1";
}

public class CampaignExpenditure : BaseEntity
{
    public Guid CampaignId { get; set; }
    public decimal AmountUsd { get; set; }
    public string Category { get; set; } = "ReliefOperations";
    public string Description { get; set; } = string.Empty;
    public Guid RecordedByUserId { get; set; }
    public string RecordedByUserName { get; set; } = string.Empty;
    public DateTime ApprovedAtUtc { get; set; } = DateTime.UtcNow;
}

public class OperationalKpiSnapshot : BaseEntity
{
    public int TotalRequests { get; set; }
    public int UnresolvedCasesCount { get; set; }
    public int CriticalOpenCasesCount { get; set; }
    public double AverageResponseTimeMinutes { get; set; }
    public double ResourceUtilisationPercentage { get; set; }
    public double ShelterOccupancyPercentage { get; set; }
    public decimal TotalDonationsCollectedUsd { get; set; }
    public DateTime CapturedAtUtc { get; set; } = DateTime.UtcNow;
}
