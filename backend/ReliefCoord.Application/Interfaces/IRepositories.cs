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
    IRepository<MappingReference> MappingReferences { get; }
    IRepository<AuditEventRecord> AuditEvents { get; }
    IRepository<CampaignExpenditure> CampaignExpenditures { get; }
    IRepository<OperationalKpiSnapshot> OperationalKpiSnapshots { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task ExecuteInTransactionAsync(Func<Task> operation, CancellationToken cancellationToken = default);
}
