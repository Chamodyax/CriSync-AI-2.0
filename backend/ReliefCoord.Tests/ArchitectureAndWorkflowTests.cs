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
    {
        var (ops, db, _, _) = CreateTestHarness();
        await DatabaseSeeder.SeedAsync(db);

        var logisticsUser = await db.Users.FirstAsync(u => u.Role == UserRole.LogisticsManager);
        var req1 = Guid.Parse("66666666-6666-6666-6666-666666666601");
        var req2 = Guid.Parse("66666666-6666-6666-6666-666666666602");

        var plan = await ops.ExecuteResourceAllocationAsync(
            logisticsUser.Id,
            logisticsUser.FullName,
            UserRole.LogisticsManager,
            new List<Guid> { req1, req2 },
            "ShortageProportionalContention");

        Assert.True(plan.ShortageEncountered);
        Assert.Equal(38, plan.TotalRequestedAcrossCases);
        Assert.True(plan.TotalAllocatedAcrossCases > 0);
        Assert.Equal(2, plan.Allocations.Count);

        var higherUrgencyAlloc = plan.Allocations.First(a => a.AssistanceRequestId == req1);
        var lowerUrgencyAlloc = plan.Allocations.First(a => a.AssistanceRequestId == req2);
        Assert.True(higherUrgencyAlloc.AllocatedQuantity >= lowerUrgencyAlloc.AllocatedQuantity);
    }

    [Fact]
    public async Task IdempotentNotificationWorkflow_AvoidsDuplicateUserNotifications()
    {
        var (ops, db, _, _) = CreateTestHarness();
        await DatabaseSeeder.SeedAsync(db);

        var citizen = await db.Users.FirstAsync(u => u.Role == UserRole.Citizen);
        var dto = new SendNotificationRequestDto(
            citizen.Id,
            citizen.PhoneNumber,
            NotificationChannel.Sms,
            "si",
            "Evacuation Alert",
            "Proceed to Ratnapura Relief Complex.",
            "IDEMP-NOTIF-UNIQUE-999");

        var firstDelivery = await ops.SendIdempotentNotificationAsync(dto);
        var secondDelivery = await ops.SendIdempotentNotificationAsync(dto);

        Assert.Equal(NotificationDeliveryStatus.Sent, firstDelivery.DeliveryStatus);
        Assert.Equal(NotificationDeliveryStatus.SkippedDuplicate, secondDelivery.DeliveryStatus);
    }

    [Fact]
    public async Task ExternalServiceFailureResilience_GracefullyActivatesFallbacks()
    {
        var (ops, db, resilience, mapping) = CreateTestHarness();
        await DatabaseSeeder.SeedAsync(db);

        resilience.SimulateExternalAiFailure = true;
        resilience.SimulateExternalMappingFailure = true;
        resilience.SimulateExternalNotificationFailure = true;

        var crisis = await db.CrisisEvents.FirstAsync();
        var citizen = await db.Users.FirstAsync(u => u.Role == UserRole.Citizen);

        var req = await ops.SubmitAssistanceRequestAsync(
            citizen.Id,
            citizen.FullName,
            new CreateAssistanceRequestDto(
                crisis.Id,
                RequestCategory.SearchAndRescue,
                UrgencyLevel.Critical,
                "Family Trapped on Rooftop",
                "Rising floodwaters trapped 5 people on roof in Kalutara.",
                5,
                1,
                false,
                "Kalutara North",
                6.5854,
                79.9607,
                "roof.jpg",
                "image/jpeg",
                "en",
                "IDEMP-RESILIENCE-1"
            ));

        var aiRec = req.AiRecommendations.First();
        Assert.Contains("ResilientLocalHeuristicFallback", aiRec.ModelIdentifier);

        var route = await mapping.CalculateRouteAsync(6.6890, 80.4020, 6.6828, 80.3992);
        Assert.Equal("LocalHaversineFallbackEngine", route.ProviderUsed);

        var notif = await ops.SendIdempotentNotificationAsync(new SendNotificationRequestDto(
            citizen.Id,
            citizen.Email,
            NotificationChannel.Email,
            "en",
            "Status Update",
            "Rescue boat assigned.",
            "IDEMP-RESILIENCE-NOTIF-1"));

        Assert.Equal(NotificationDeliveryStatus.FailedPendingRetry, notif.DeliveryStatus);
        Assert.True(resilience.AiCircuitTripCount > 0);
        Assert.True(resilience.MappingCircuitTripCount > 0);
        Assert.True(resilience.NotificationCircuitTripCount > 0);
    }

    [Fact]
    public async Task ShelterAllocation_PreventsOverAllocation_AndEnforcesAccessibility()
    {
        var (ops, db, _, _) = CreateTestHarness();
        await DatabaseSeeder.SeedAsync(db);

        var shelterAdmin = await db.Users.FirstAsync(u => u.Role == UserRole.ShelterAdmin);
        var citizen = await db.Users.FirstAsync(u => u.Role == UserRole.Citizen);
        var nearFullShelter = await db.Shelters.FirstAsync(s => !s.IsWheelchairAccessible);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            ops.AllocateShelterAsync(
                shelterAdmin.Id,
                shelterAdmin.FullName,
                UserRole.ShelterAdmin,
                new AllocateShelterRequestDto(
                    nearFullShelter.Id,
                    null,
                    citizen.Id,
                    "Perera Family",
                    25,
                    false)));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            ops.AllocateShelterAsync(
                shelterAdmin.Id,
                shelterAdmin.FullName,
                UserRole.ShelterAdmin,
                new AllocateShelterRequestDto(
                    nearFullShelter.Id,
                    null,
                    citizen.Id,
                    "Wheelchair Household",
                    2,
                    true)));
    }
}
