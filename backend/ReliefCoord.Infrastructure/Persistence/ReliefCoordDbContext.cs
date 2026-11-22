using Microsoft.EntityFrameworkCore;
using ReliefCoord.Domain.Entities;

namespace ReliefCoord.Infrastructure.Persistence;

public class ReliefCoordDbContext : DbContext
{
    public ReliefCoordDbContext(DbContextOptions<ReliefCoordDbContext> options) : base(options)
    {
    }

    public DbSet<Organisation> Organisations => Set<Organisation>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<HouseholdProfile> Households => Set<HouseholdProfile>();
    public DbSet<CrisisEvent> CrisisEvents => Set<CrisisEvent>();
    public DbSet<OperationalArea> OperationalAreas => Set<OperationalArea>();
    public DbSet<PublicAlert> PublicAlerts => Set<PublicAlert>();
    public DbSet<AssistanceRequest> AssistanceRequests => Set<AssistanceRequest>();
    public DbSet<RequestHistory> RequestHistories => Set<RequestHistory>();
    public DbSet<RequestFeedback> RequestFeedbacks => Set<RequestFeedback>();
    public DbSet<AiRecommendation> AiRecommendations => Set<AiRecommendation>();
    public DbSet<HumanGovernanceDecision> GovernanceDecisions => Set<HumanGovernanceDecision>();
    public DbSet<Shelter> Shelters => Set<Shelter>();
    public DbSet<ShelterAllocation> ShelterAllocations => Set<ShelterAllocation>();
    public DbSet<ResourceItem> Resources => Set<ResourceItem>();
    public DbSet<ResourceAllocation> ResourceAllocations => Set<ResourceAllocation>();
    public DbSet<DispatchRecord> DispatchRecords => Set<DispatchRecord>();
    public DbSet<PartnerAidRequest> PartnerAidRequests => Set<PartnerAidRequest>();
    public DbSet<VolunteerProfile> Volunteers => Set<VolunteerProfile>();
    public DbSet<VolunteerTaskAssignment> VolunteerAssignments => Set<VolunteerTaskAssignment>();
    public DbSet<DonationCampaign> DonationCampaigns => Set<DonationCampaign>();
    public DbSet<DonationRecord> Donations => Set<DonationRecord>();
    public DbSet<NotificationRecord> Notifications => Set<NotificationRecord>();
    public DbSet<MappingReference> MappingReferences => Set<MappingReference>();
    public DbSet<AuditEventRecord> AuditEvents => Set<AuditEventRecord>();
    public DbSet<CampaignExpenditure> CampaignExpenditures => Set<CampaignExpenditure>();
    public DbSet<OperationalKpiSnapshot> OperationalKpiSnapshots => Set<OperationalKpiSnapshot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AppUser>()
            .HasIndex(u => u.Email)
    }
}
