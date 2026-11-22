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
            .IsUnique();

        modelBuilder.Entity<AssistanceRequest>()
            .HasIndex(r => r.ReferenceCode);

        modelBuilder.Entity<AssistanceRequest>()
            .HasMany(r => r.Timeline)
            .WithOne()
            .HasForeignKey(h => h.AssistanceRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AssistanceRequest>()
            .HasMany(r => r.AiRecommendations)
            .WithOne()
            .HasForeignKey(a => a.AssistanceRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AiRecommendation>()
            .HasOne(a => a.HumanDecision)
            .WithOne()
            .HasForeignKey<HumanGovernanceDecision>(d => d.AiRecommendationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CrisisEvent>()
            .HasMany(c => c.OperationalAreas)
            .WithOne()
            .HasForeignKey(o => o.CrisisEventId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DonationCampaign>()
            .Property(c => c.TargetAmountUsd)
            .HasPrecision(18, 2);

        modelBuilder.Entity<DonationCampaign>()
            .Property(c => c.CollectedAmountUsd)
            .HasPrecision(18, 2);

        modelBuilder.Entity<DonationCampaign>()
            .Property(c => c.DisbursedAmountUsd)
            .HasPrecision(18, 2);

        modelBuilder.Entity<DonationRecord>()
            .Property(d => d.MonetaryAmountUsd)
            .HasPrecision(18, 2);

        modelBuilder.Entity<CampaignExpenditure>()
            .Property(e => e.AmountUsd)
            .HasPrecision(18, 2);

        modelBuilder.Entity<OperationalKpiSnapshot>()
            .Property(s => s.TotalDonationsCollectedUsd)
            .HasPrecision(18, 2);

        modelBuilder.Entity<NotificationRecord>()
            .HasIndex(n => n.IdempotencyKey);
    }
}
