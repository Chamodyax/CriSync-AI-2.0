using Microsoft.EntityFrameworkCore;
using ReliefCoord.Application.DTOs;
using ReliefCoord.Application.Interfaces;
using ReliefCoord.Application.Services;
using ReliefCoord.Application.Strategies;
using ReliefCoord.Domain.Entities;
using ReliefCoord.Domain.Enums;
using ReliefCoord.Infrastructure.ExternalServices;
using ReliefCoord.Infrastructure.Messaging;
using ReliefCoord.Infrastructure.Persistence;
using Xunit;

namespace ReliefCoord.Tests;

public class ArchitectureAndWorkflowTests
{
    private static (HumanitarianOperationsService Ops, ReliefCoordDbContext Db, IServiceResilienceMonitor Resilience, IMappingProviderService Mapping) CreateTestHarness()
    {
        var options = new DbContextOptionsBuilder<ReliefCoordDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        var db = new ReliefCoordDbContext(options);
        var uow = new EfUnitOfWork(db);
        var resilience = new ServiceResilienceMonitor();
        var mapping = new ResilientMappingProviderService(resilience);
        var aiFactory = new AiProviderFactory(resilience, mapping);
        var notifFactory = new NotificationChannelFactory(resilience);
        var eventBus = new InMemoryDomainEventQueue();
        var strategies = new IResourceAllocationStrategy[]
        {
            new MultiConstraintOptimalStrategy(),
            new ShortageProportionalContentionStrategy(),
            new ProximityFirstStrategy()
        };
        var resolver = new ResourceAllocationStrategyResolver(strategies);

        var ops = new HumanitarianOperationsService(uow, aiFactory, mapping, notifFactory, eventBus, resolver);
        return (ops, db, resilience, mapping);
    }

    [Fact]
    public async Task HumanInTheLoop_GovernanceOverride_CreatesAuditRecord_AndBlocksUnauthorizedRoles()
    {
        var (ops, db, _, _) = CreateTestHarness();
        await DatabaseSeeder.SeedAsync(db);

        var crisis = await db.CrisisEvents.FirstAsync();
        var citizen = await db.Users.FirstAsync(u => u.Role == UserRole.Citizen);
        var coordinator = await db.Users.FirstAsync(u => u.Role == UserRole.EmergencyCoordinator);

        var submitted = await ops.SubmitAssistanceRequestAsync(
            citizen.Id,
            citizen.FullName,
            new CreateAssistanceRequestDto(
                crisis.Id,
                RequestCategory.Medicine,
                UrgencyLevel.High,
                "Emergency Insulin & Oxygen Needed",
                "Elderly patients trapped by floodwaters need urgent insulin and oxygen cylinders.",
                12,
                15,
                true,
                "Ratnapura District Hospital Road",
                6.6830,
                80.3990,
                "evidence.jpg",
                "image/jpeg",
                "en",
                "IDEMP-TEST-GOV-1"
            ));

        var rec = submitted.AiRecommendations.First();
        Assert.Equal(GovernanceDecisionStatus.PendingReview, rec.GovernanceStatus);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            ops.ReviewAiRecommendationAsync(
                citizen.Id,
                citizen.FullName,
                UserRole.Citizen,
                new ReviewAiRecommendationDto(
                    rec.Id,
                    GovernanceDecisionStatus.Approved,
                    null,
                    null,
                    "Citizen attempting self-approval"
                )));

        var decision = await ops.ReviewAiRecommendationAsync(
            coordinator.Id,
            coordinator.FullName,
            UserRole.EmergencyCoordinator,
            new ReviewAiRecommendationDto(
                rec.Id,
                GovernanceDecisionStatus.Modified,
                UrgencyLevel.LifeThreatening,
                RequestCategory.Medicine,
                "Verified via field medical officer: life-threatening hypoxia risk."
            ));

        Assert.Equal(GovernanceDecisionStatus.Modified, decision.ActionTaken);
        Assert.Equal(coordinator.Id, decision.ResponsibleUserId);
        Assert.Contains("LifeThreatening", decision.FinalHumanDecisionSummary);

        var auditLogs = await db.AuditEvents.Where(a => a.EntityId == rec.Id.ToString()).ToListAsync();
        Assert.Single(auditLogs);
    }

    [Fact]
    public async Task DuplicateDetection_FlagsNearDuplicate_WithoutDeletingValidRequests()
    {
        var (ops, db, _, _) = CreateTestHarness();
        await DatabaseSeeder.SeedAsync(db);

        var crisis = await db.CrisisEvents.FirstAsync();
        var citizen = await db.Users.FirstAsync(u => u.Role == UserRole.Citizen);

        int countBefore = await db.AssistanceRequests.CountAsync();

        var firstReq = await ops.SubmitAssistanceRequestAsync(
            citizen.Id,
            citizen.FullName,
            new CreateAssistanceRequestDto(
                crisis.Id,
                RequestCategory.WaterAndSanitation,
                UrgencyLevel.High,
                "Clean Drinking Water & Purification Tablets for Temple Camp",
                "Displaced families at Ratnapura Temple Camp urgently need drinking water purification tablets and jerrycans.",
                45,
                50,
                false,
                "Ratnapura Temple Road",
                6.6840,
                80.4000,
                "water1.jpg",
                "image/jpeg",
                "en",
                "IDEMP-DUP-A"
            ));

        var nearDuplicateReq = await ops.SubmitAssistanceRequestAsync(
            citizen.Id,
            citizen.FullName,
            new CreateAssistanceRequestDto(
                crisis.Id,
                RequestCategory.WaterAndSanitation,
                UrgencyLevel.High,
                "Clean Drinking Water & Purification Tablets for Temple Camp",
                "Displaced families at Ratnapura Temple Camp urgently need drinking water purification tablets and jerrycans.",
                45,
                50,
                false,
                "Ratnapura Temple Road",
                6.6841,
                80.4001,
                "water2.jpg",
                "image/jpeg",
                "en",
                "IDEMP-DUP-B"
            ));

        int countAfter = await db.AssistanceRequests.CountAsync();
        Assert.Equal(countBefore + 2, countAfter);
        Assert.True(nearDuplicateReq.IsFlaggedPotentialDuplicate);
        Assert.Equal(firstReq.Id, nearDuplicateReq.PotentialDuplicateOfRequestId);
        Assert.True(nearDuplicateReq.DuplicateSimilarityScore >= 0.68);
    }

    [Fact]
    public async Task MultiConstraintAndShortageContention_RationsScarceInventory_AndEscalatesShortfall()
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
