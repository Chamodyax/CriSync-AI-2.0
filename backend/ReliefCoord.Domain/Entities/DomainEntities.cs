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
    public DateTime? LastPasswordResetUtc { get; set; }
    public string LegacySecurityStamp { get; set; } = string.Empty;
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
