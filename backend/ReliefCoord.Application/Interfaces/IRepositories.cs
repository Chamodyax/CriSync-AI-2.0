using System.Linq.Expressions;
using ReliefCoord.Domain.Entities;

namespace ReliefCoord.Application.Interfaces;

public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<T> AddAsync(T entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(T entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(T entity, CancellationToken cancellationToken = default);
}

public interface IUnitOfWork
{
    IRepository<Organisation> Organisations { get; }
    IRepository<AppUser> Users { get; }
    IRepository<RolePermission> RolePermissions { get; }
    IRepository<HouseholdProfile> Households { get; }
    IRepository<CrisisEvent> CrisisEvents { get; }
    IRepository<OperationalArea> OperationalAreas { get; }
    IRepository<PublicAlert> PublicAlerts { get; }
    IRepository<AssistanceRequest> AssistanceRequests { get; }
    IRepository<RequestHistory> RequestHistories { get; }
    IRepository<RequestFeedback> RequestFeedbacks { get; }
    IRepository<AiRecommendation> AiRecommendations { get; }
    IRepository<HumanGovernanceDecision> GovernanceDecisions { get; }
    IRepository<Shelter> Shelters { get; }
    IRepository<ShelterAllocation> ShelterAllocations { get; }
    IRepository<ResourceItem> Resources { get; }
    IRepository<ResourceAllocation> ResourceAllocations { get; }
    IRepository<DispatchRecord> DispatchRecords { get; }
    IRepository<PartnerAidRequest> PartnerAidRequests { get; }
    IRepository<VolunteerProfile> Volunteers { get; }
    IRepository<VolunteerTaskAssignment> VolunteerAssignments { get; }
    IRepository<DonationCampaign> DonationCampaigns { get; }
    IRepository<DonationRecord> Donations { get; }
    IRepository<NotificationRecord> Notifications { get; }
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
