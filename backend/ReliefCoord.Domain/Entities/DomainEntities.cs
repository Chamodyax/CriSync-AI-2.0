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
