using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using ReliefCoord.Application.Interfaces;
using ReliefCoord.Domain.Entities;

namespace ReliefCoord.Infrastructure.Persistence;

public class EfRepository<T> : IRepository<T> where T : BaseEntity
{
    private readonly ReliefCoordDbContext _dbContext;
    private readonly DbSet<T> _dbSet;

    public EfRepository(ReliefCoordDbContext dbContext)
    {
        _dbContext = dbContext;
        _dbSet = dbContext.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet.OrderByDescending(e => e.CreatedAtUtc).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _dbSet.Where(predicate).OrderByDescending(e => e.CreatedAtUtc).ToListAsync(cancellationToken);
    }

    public async Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        await _dbSet.AddAsync(entity, cancellationToken);
        return entity;
    }

    public Task UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        entity.UpdatedAtUtc = DateTime.UtcNow;
        _dbSet.Update(entity);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(T entity, CancellationToken cancellationToken = default)
    {
        _dbSet.Remove(entity);
        return Task.CompletedTask;
    }
}

public class EfUnitOfWork : IUnitOfWork
{
    private readonly ReliefCoordDbContext _dbContext;

    public EfUnitOfWork(ReliefCoordDbContext dbContext)
    {
        _dbContext = dbContext;
        Organisations = new EfRepository<Organisation>(dbContext);
        Users = new EfRepository<AppUser>(dbContext);
        RolePermissions = new EfRepository<RolePermission>(dbContext);
        Households = new EfRepository<HouseholdProfile>(dbContext);
        CrisisEvents = new EfRepository<CrisisEvent>(dbContext);
        OperationalAreas = new EfRepository<OperationalArea>(dbContext);
        PublicAlerts = new EfRepository<PublicAlert>(dbContext);
        AssistanceRequests = new EfRepository<AssistanceRequest>(dbContext);
        RequestHistories = new EfRepository<RequestHistory>(dbContext);
        RequestFeedbacks = new EfRepository<RequestFeedback>(dbContext);
        AiRecommendations = new EfRepository<AiRecommendation>(dbContext);
        GovernanceDecisions = new EfRepository<HumanGovernanceDecision>(dbContext);
        Shelters = new EfRepository<Shelter>(dbContext);
        ShelterAllocations = new EfRepository<ShelterAllocation>(dbContext);
        Resources = new EfRepository<ResourceItem>(dbContext);
        ResourceAllocations = new EfRepository<ResourceAllocation>(dbContext);
        DispatchRecords = new EfRepository<DispatchRecord>(dbContext);
        PartnerAidRequests = new EfRepository<PartnerAidRequest>(dbContext);
        Volunteers = new EfRepository<VolunteerProfile>(dbContext);
        VolunteerAssignments = new EfRepository<VolunteerTaskAssignment>(dbContext);
        DonationCampaigns = new EfRepository<DonationCampaign>(dbContext);
        Donations = new EfRepository<DonationRecord>(dbContext);
        Notifications = new EfRepository<NotificationRecord>(dbContext);
        MappingReferences = new EfRepository<MappingReference>(dbContext);
        AuditEvents = new EfRepository<AuditEventRecord>(dbContext);
        CampaignExpenditures = new EfRepository<CampaignExpenditure>(dbContext);
        OperationalKpiSnapshots = new EfRepository<OperationalKpiSnapshot>(dbContext);
    }

    public IRepository<Organisation> Organisations { get; }
    public IRepository<AppUser> Users { get; }
    public IRepository<RolePermission> RolePermissions { get; }
    public IRepository<HouseholdProfile> Households { get; }
    public IRepository<CrisisEvent> CrisisEvents { get; }
    public IRepository<OperationalArea> OperationalAreas { get; }
    public IRepository<PublicAlert> PublicAlerts { get; }
    public IRepository<AssistanceRequest> AssistanceRequests { get; }
    public IRepository<RequestHistory> RequestHistories { get; }
    public IRepository<RequestFeedback> RequestFeedbacks { get; }
    public IRepository<AiRecommendation> AiRecommendations { get; }
    public IRepository<HumanGovernanceDecision> GovernanceDecisions { get; }
    public IRepository<Shelter> Shelters { get; }
    public IRepository<ShelterAllocation> ShelterAllocations { get; }
    public IRepository<ResourceItem> Resources { get; }
    public IRepository<ResourceAllocation> ResourceAllocations { get; }
    public IRepository<DispatchRecord> DispatchRecords { get; }
    public IRepository<PartnerAidRequest> PartnerAidRequests { get; }
    public IRepository<VolunteerProfile> Volunteers { get; }
    public IRepository<VolunteerTaskAssignment> VolunteerAssignments { get; }
    public IRepository<DonationCampaign> DonationCampaigns { get; }
    public IRepository<DonationRecord> Donations { get; }
    public IRepository<NotificationRecord> Notifications { get; }
    public IRepository<MappingReference> MappingReferences { get; }
    public IRepository<AuditEventRecord> AuditEvents { get; }
    public IRepository<CampaignExpenditure> CampaignExpenditures { get; }
    public IRepository<OperationalKpiSnapshot> OperationalKpiSnapshots { get; }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task ExecuteInTransactionAsync(Func<Task> operation, CancellationToken cancellationToken = default)
    {
        var providerName = _dbContext.Database.ProviderName ?? string.Empty;
        if (providerName.Contains("InMemory", StringComparison.OrdinalIgnoreCase))
        {
            await operation();
            return;
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            await operation();
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
