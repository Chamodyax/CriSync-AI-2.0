using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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

public sealed class CriSyncWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"crisync_it_{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DatabaseProvider"] = "Sqlite",
                ["ConnectionStrings:SqliteConnection"] = $"Data Source={_dbPath}",
                ["ExternalServices:EnableLiveOsmCalls"] = "false",
                ["Jwt:Key"] = "CriSyncIntegrationTestingSigningKey_2026_SE2053!"
            });
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        SqliteConnection.ClearAllPools();
        try
        {
            if (File.Exists(_dbPath))
            {
                File.Delete(_dbPath);
            }
        }
        catch
        {
        }
    }
}

public class ApiIntegrationAndSecurityTests : IClassFixture<CriSyncWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly CriSyncWebApplicationFactory _factory;

    public ApiIntegrationAndSecurityTests(CriSyncWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<AuthResponseDto> LoginAsAsync(HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto(email, password));
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        Assert.NotNull(auth);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return auth;
    }

    [Fact]
    public void PasswordHashing_UsesPbkdf2_AndVerifiesSecurely()
    {
        var (hash1, salt1) = HumanitarianOperationsService.HashPassword("Crisync@2026");
        var (hash2, salt2) = HumanitarianOperationsService.HashPassword("Crisync@2026");

        Assert.StartsWith("PBKDF2$100000$", hash1);
        Assert.NotEqual(hash1, hash2);
        Assert.NotEqual(salt1, salt2);
        Assert.True(HumanitarianOperationsService.VerifyPassword("Crisync@2026", hash1, salt1));
        Assert.False(HumanitarianOperationsService.VerifyPassword("WrongPassword", hash1, salt1));
    }

    [Fact]
    public async Task AuthLogin_ValidAndInvalidCredentials_Returns200And401_AndAuditsAttempts()
    {
        using var client = _factory.CreateClient();

        var badResp = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("citizen@crisync.org", "WrongPass!"));
        Assert.Equal(HttpStatusCode.Unauthorized, badResp.StatusCode);

        var okResp = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("coordinator@crisync.org", "Crisync@2026"));
        Assert.Equal(HttpStatusCode.OK, okResp.StatusCode);
        var auth = await okResp.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        Assert.NotNull(auth);
        Assert.False(string.IsNullOrWhiteSpace(auth!.Token));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
        var logs = await client.GetFromJsonAsync<List<AuditEventRecord>>("/api/admin/audit-logs", JsonOptions);
        Assert.NotNull(logs);
        Assert.Contains(logs!, l => l.ActionName == "Login_Failed");
        Assert.Contains(logs!, l => l.ActionName == "Login_Succeeded");
    }

    [Theory]
    [InlineData(UserRole.DonorOfficer)]
    [InlineData(UserRole.SystemAdmin)]
    [InlineData(UserRole.CaseManager)]
    public async Task SelfRegistration_BlocksPrivilegedRoles_With403Forbidden(UserRole restrictedRole)
    {
        using var client = _factory.CreateClient();
        var payload = new RegisterUserRequestDto(
            "Test Privileged User",
            $"priv_{restrictedRole}_{Guid.NewGuid():N}@crisync.org",
            "+94-77-0001122",
            "StrongPass@2026",
            restrictedRole,
            "en",
            null
        );

        var response = await client.PostAsJsonAsync("/api/auth/register", payload);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Theory]
    [InlineData("/api/admin/audit-logs")]
    [InlineData("/api/requests")]
    [InlineData("/api/notifications")]
    [InlineData("/api/donations/transparency-report")]
    public async Task ProtectedEndpoints_RejectUnauthenticatedRequests_With401Unauthorized(string url)
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync(url);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AuditLogsEndpoint_BlocksCitizenRole_With403Forbidden_AndAllowsCoordinator()
    {
        using var citizenClient = _factory.CreateClient();
        await LoginAsAsync(citizenClient, "citizen@crisync.org", "Crisync@2026");
        var forbiddenResp = await citizenClient.GetAsync("/api/admin/audit-logs");
        Assert.Equal(HttpStatusCode.Forbidden, forbiddenResp.StatusCode);

        using var coordClient = _factory.CreateClient();
        await LoginAsAsync(coordClient, "coordinator@crisync.org", "Crisync@2026");
        var okResp = await coordClient.GetAsync("/api/admin/audit-logs");
        Assert.Equal(HttpStatusCode.OK, okResp.StatusCode);
    }

    [Fact]
    public async Task EvidenceUpload_RejectsForgedExtensionMagicBytes_AndPersistsValidPngWithAuthorizedDownload()
    {
        using var client = _factory.CreateClient();
        await LoginAsAsync(client, "citizen@crisync.org", "Crisync@2026");

        using var forgedContent = new MultipartFormDataContent();
        var fakePngBytes = new ByteArrayContent(System.Text.Encoding.UTF8.GetBytes("THIS_IS_NOT_A_PNG_SCRIPT"));
        fakePngBytes.Headers.ContentType = MediaTypeHeaderValue.Parse("image/png");
        forgedContent.Add(fakePngBytes, "file", "forged.png");

        var forgedResp = await client.PostAsync("/api/requests/upload-evidence", forgedContent);
        Assert.Equal(HttpStatusCode.BadRequest, forgedResp.StatusCode);

        byte[] realPngHeader = { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D };
        using var validContent = new MultipartFormDataContent();
        var validBytes = new ByteArrayContent(realPngHeader);
        validBytes.Headers.ContentType = MediaTypeHeaderValue.Parse("image/png");
        validContent.Add(validBytes, "file", "flood_photo.png");

        var uploadResp = await client.PostAsync("/api/requests/upload-evidence", validContent);
        Assert.Equal(HttpStatusCode.OK, uploadResp.StatusCode);
        using var uploadJson = await JsonDocument.ParseAsync(await uploadResp.Content.ReadAsStreamAsync());
        string safeName = uploadJson.RootElement.GetProperty("safeFileName").GetString()!;

        var dlResp = await client.GetAsync($"/api/requests/evidence/{safeName}");
        Assert.Equal(HttpStatusCode.OK, dlResp.StatusCode);
        byte[] downloaded = await dlResp.Content.ReadAsByteArrayAsync();
        Assert.Equal(realPngHeader, downloaded);
    }

    [Fact]
    public async Task ProfilePhotoUrl_RejectsUnsafeJavascriptUri_With400BadRequest()
    {
        using var client = _factory.CreateClient();
        await LoginAsAsync(client, "citizen@crisync.org", "Crisync@2026");

        var badResp = await client.PutAsJsonAsync("/api/users/me", new UpdateMyProfileDto(
            "Nimali Perera",
            "+94-77-1112233",
            "si",
            "javascript:alert(1)",
            null,
            null
        ));

        Assert.Equal(HttpStatusCode.BadRequest, badResp.StatusCode);
    }

    [Fact]
    public async Task VolunteerWorkflow_AvailabilityAcceptAndComplete_IncrementsCompletedCount()
    {
        using var coordClient = _factory.CreateClient();
        await LoginAsAsync(coordClient, "volunteer@crisync.org", "Crisync@2026");

        using var volClient = _factory.CreateClient();
        await LoginAsAsync(volClient, "fieldvolunteer@crisync.org", "Crisync@2026");

        var availResp = await volClient.PutAsJsonAsync("/api/volunteers/me/availability", new UpdateVolunteerAvailabilityDto(
            true,
            "Mon-Sun 07:00-23:00 Rapid Response"
        ));
        Assert.Equal(HttpStatusCode.OK, availResp.StatusCode);
        var updatedProfile = await availResp.Content.ReadFromJsonAsync<VolunteerProfile>(JsonOptions);
        Assert.NotNull(updatedProfile);
        int initialCompleted = updatedProfile!.CompletedTasksCount;

        var assignResp = await coordClient.PostAsJsonAsync("/api/volunteers/assign", new AssignVolunteerTaskDto(
            updatedProfile.Id,
            Guid.Parse("66666666-6666-6666-6666-666666666611"),
            "Deliver Cold-Chain Insulin Pack",
            "Field Medical Aid"
        ));
        assignResp.EnsureSuccessStatusCode();
        var assignment = await assignResp.Content.ReadFromJsonAsync<VolunteerTaskAssignment>(JsonOptions);
        Assert.NotNull(assignment);
        Assert.NotEqual(92.4, assignment!.AiMatchScore);

        var respondResp = await volClient.PostAsJsonAsync($"/api/volunteers/assignments/{assignment.Id}/respond",
            new RespondVolunteerAssignmentDto("Accepted", "En route now"));
        Assert.Equal(HttpStatusCode.OK, respondResp.StatusCode);

        var completeResp = await volClient.PostAsJsonAsync($"/api/volunteers/assignments/{assignment.Id}/complete",
            new CompleteVolunteerAssignmentDto("Delivered safely to Kalu Ganga Clinic nurse"));
        Assert.Equal(HttpStatusCode.OK, completeResp.StatusCode);
        var completedAssign = await completeResp.Content.ReadFromJsonAsync<VolunteerTaskAssignment>(JsonOptions);
        Assert.Equal("Completed", completedAssign!.Status);

        var volData = await volClient.GetFromJsonAsync<JsonElement>("/api/volunteers", JsonOptions);
        var tharushi = volData.GetProperty("volunteers").EnumerateArray()
            .First(v => v.GetProperty("id").GetGuid() == updatedProfile.Id);
        Assert.Equal(initialCompleted + 1, tharushi.GetProperty("completedTasksCount").GetInt32());
    }

    [Fact]
    public async Task DonationWorkflow_ExpenditureTracking_UpdatesDisbursedAndTransparencyReport_AndBlocksOverdraft()
    {
        using var donorClient = _factory.CreateClient();
        await LoginAsAsync(donorClient, "donor@crisync.org", "Crisync@2026");

        var campaignId = Guid.Parse("99999999-9999-9999-9999-999999999911");

        var overdraftResp = await donorClient.PostAsJsonAsync($"/api/donations/campaigns/{campaignId}/expenditures",
            new CreateCampaignExpenditureDto(9999999m, "MedicalSupplies", "Overdraft test"));
        Assert.Equal(HttpStatusCode.Conflict, overdraftResp.StatusCode);

        var okResp = await donorClient.PostAsJsonAsync($"/api/donations/campaigns/{campaignId}/expenditures",
            new CreateCampaignExpenditureDto(3500m, "WaterLogistics", "Purification tablet batch purchase"));
        Assert.Equal(HttpStatusCode.OK, okResp.StatusCode);

        var report = await donorClient.GetFromJsonAsync<JsonElement>("/api/donations/transparency-report", JsonOptions);
        Assert.True(report.GetProperty("totalDisbursedUsd").GetDecimal() >= 115500m);
        Assert.True(report.GetProperty("expenditureByCategory").TryGetProperty("WaterLogistics", out _));
    }

    [Fact]
    public async Task DonationWorkflow_DynamicHighValueThreshold_AndRejectAction()
    {
        using var adminFactory = new CriSyncWebApplicationFactory();
        using var adminClient = adminFactory.CreateClient();
        await LoginAsAsync(adminClient, "admin@crisync.org", "Admin@Crisync2026");

        var cfgResp = await adminClient.PutAsJsonAsync("/api/admin/system-config", new SystemGovernanceConfigDto(
            2, 3, 3, true, true, 15000m
        ));
        Assert.Equal(HttpStatusCode.OK, cfgResp.StatusCode);

        var campaignId = Guid.Parse("99999999-9999-9999-9999-999999999911");
        var donateResp = await adminClient.PostAsJsonAsync("/api/donations", new CreateDonationDto(
            campaignId,
            "Dynamic Threshold Donor",
            "Monetary",
            20000m,
            string.Empty,
            0,
            "Emergency Shelter Fuel",
            "4242"
        ));
        donateResp.EnsureSuccessStatusCode();
        var record = await donateResp.Content.ReadFromJsonAsync<DonationRecord>(JsonOptions);
        Assert.NotNull(record);
        Assert.True(record!.IsFlaggedSuspicious);
        Assert.Contains("$15,000", record.SuspiciousReason);

        var rejectResp = await adminClient.PostAsync($"/api/donations/{record.Id}/reject", null);
        Assert.Equal(HttpStatusCode.OK, rejectResp.StatusCode);
        var rejected = await rejectResp.Content.ReadFromJsonAsync<DonationRecord>(JsonOptions);
        Assert.Equal("ComplianceRejected", rejected!.VerificationStatus);
    }

    [Fact]
    public async Task ShelterSupplyRequest_AndConcurrentAllocation_PreventOverAllocation()
    {
        using var client1 = _factory.CreateClient();
        await LoginAsAsync(client1, "shelter@crisync.org", "Crisync@2026");

        var shelterId = Guid.Parse("44444444-4444-4444-4444-444444444413");
        var supplyResp = await client1.PostAsJsonAsync($"/api/shelters/{shelterId}/request-supplies",
            new RequestShelterSuppliesDto(RequestCategory.Food, "Hot Meal Ration Kits", 120, "High influx of evacuees"));
        Assert.Equal(HttpStatusCode.OK, supplyResp.StatusCode);

        using var createClient = _factory.CreateClient();
        await LoginAsAsync(createClient, "admin@crisync.org", "Admin@Crisync2026");
        var createShelterResp = await createClient.PostAsJsonAsync("/api/shelters", new CreateShelterDto(
            "Concurrency Verification Hall",
            Guid.Parse("33333333-3333-3333-3333-333333333311"),
            "10 Safe Ground Lane, Kalutara",
            6.5900,
            79.9600,
            10,
            0,
            true,
            true,
            true,
            true,
            true,
            "Testing Concurrency",
            "Operational",
            null
        ));
        createShelterResp.EnsureSuccessStatusCode();
        var createdShelter = await createShelterResp.Content.ReadFromJsonAsync<Shelter>(JsonOptions);
        Assert.NotNull(createdShelter);

        var req1 = client1.PostAsJsonAsync("/api/shelters/allocate", new AllocateShelterRequestDto(
            createdShelter!.Id, null, Guid.NewGuid(), "Household Alpha", 6, true));
        var req2 = createClient.PostAsJsonAsync("/api/shelters/allocate", new AllocateShelterRequestDto(
            createdShelter.Id, null, Guid.NewGuid(), "Household Beta", 6, true));

        var responses = await Task.WhenAll(req1, req2);
        int okCount = responses.Count(r => r.StatusCode == HttpStatusCode.OK);
        int conflictCount = responses.Count(r => r.StatusCode == HttpStatusCode.Conflict);
        Assert.Equal(1, okCount);
        Assert.Equal(1, conflictCount);
    }

    [Fact]
    public async Task LogisticsWorkflow_ReplenishDeliverAndPartnerAidFulfillment()
    {
        using var client = _factory.CreateClient();
        await LoginAsAsync(client, "logistics@crisync.org", "Crisync@2026");

        var resourceId = Guid.Parse("55555555-5555-5555-5555-555555555515");
        var beforeResources = await client.GetFromJsonAsync<List<ResourceItem>>("/api/logistics/resources", JsonOptions);
        int beforeAvail = beforeResources!.First(r => r.Id == resourceId).AvailableQuantity;

        var repResp = await client.PostAsJsonAsync($"/api/logistics/resources/{resourceId}/replenish",
            new ReplenishResourceDto(15, "Red Cross emergency container"));
        Assert.Equal(HttpStatusCode.OK, repResp.StatusCode);
        var updatedRes = await repResp.Content.ReadFromJsonAsync<ResourceItem>(JsonOptions);
        Assert.Equal(beforeAvail + 15, updatedRes!.AvailableQuantity);

        var partnerPost = await client.PostAsJsonAsync("/api/logistics/partner-aid-requests",
            new CreatePartnerAidRequestDto(RequestCategory.WaterAndSanitation, "Solar Water Filters", 30, "Sector Alpha urgent shortage"));
        partnerPost.EnsureSuccessStatusCode();
        var partnerReq = await partnerPost.Content.ReadFromJsonAsync<PartnerAidRequest>(JsonOptions);

        var fulfillResp = await client.PostAsJsonAsync($"/api/logistics/partner-aid-requests/{partnerReq!.Id}/fulfill",
            new FulfillPartnerAidRequestDto("Dispatched by MSF vehicle"));
        Assert.Equal(HttpStatusCode.OK, fulfillResp.StatusCode);
        var fulfilled = await fulfillResp.Content.ReadFromJsonAsync<PartnerAidRequest>(JsonOptions);
        Assert.Equal("FulfilledByPartner", fulfilled!.Status);

        var execResp = await client.PostAsJsonAsync("/api/logistics/execute-allocation",
            new CompetingShortageScenarioRequestDto(Guid.Empty, new List<Guid> { Guid.Parse("66666666-6666-6666-6666-666666666614") }, "ProximityFirst"));
        execResp.EnsureSuccessStatusCode();

        var allocData = await client.GetFromJsonAsync<JsonElement>("/api/logistics/allocations", JsonOptions);
        var firstDispatchId = allocData.GetProperty("dispatches").EnumerateArray().First().GetProperty("id").GetGuid();

        var deliverResp = await client.PostAsync($"/api/logistics/dispatches/{firstDispatchId}/deliver", null);
        Assert.Equal(HttpStatusCode.OK, deliverResp.StatusCode);
        var delivered = await deliverResp.Content.ReadFromJsonAsync<DispatchRecord>(JsonOptions);
        Assert.Equal("Delivered", delivered!.DispatchStatus);
        Assert.NotNull(delivered.DeliveredAtUtc);
    }

    [Fact]
    public void AllocationStrategies_MultiConstraintOptimal_AndProximityFirst_SelectExpectedWarehouses()
    {
        var mapping = new ResilientMappingProviderService(new ServiceResilienceMonitor());
        var nearWarehouseId = Guid.NewGuid();
        var coldOptimalWarehouseId = Guid.NewGuid();

        var req = new AssistanceRequest
        {
            Id = Guid.NewGuid(),
            ReferenceCode = "REQ-STRAT-01",
            Title = "Insulin Cold Chain",
            Category = RequestCategory.Medicine,
            FinalApprovedUrgency = UrgencyLevel.LifeThreatening,
            PriorityScore = 95,
            RequestedQuantity = 10,
            Latitude = 6.6828,
            Longitude = 80.3992
        };

        var resources = new List<ResourceItem>
        {
            new()
            {
                Id = nearWarehouseId,
                Name = "Non-Cold Partial Kit",
                WarehouseName = "Nearby Non-Cold Depot",
                Category = RequestCategory.Medicine,
                AvailableQuantity = 6,
                SupportsColdChain = false,
                ExpiryDateUtc = DateTime.UtcNow.AddDays(120),
                WarehouseLatitude = 6.6830,
                WarehouseLongitude = 80.3993
            },
            new()
            {
                Id = coldOptimalWarehouseId,
                Name = "Cold Chain Insulin Kit",
                WarehouseName = "Regional Cold Hub",
                Category = RequestCategory.Medicine,
                AvailableQuantity = 50,
                SupportsColdChain = true,
                ExpiryDateUtc = DateTime.UtcNow.AddDays(20),
                WarehouseLatitude = 6.7000,
                WarehouseLongitude = 80.4100
            }
        };

        var proxPlan = new ProximityFirstStrategy().ComputeAllocationPlan(new[] { req }, resources, mapping);
        Assert.Equal(nearWarehouseId, proxPlan.Allocations.First().SelectedResourceItemId);

        var multiPlan = new MultiConstraintOptimalStrategy().ComputeAllocationPlan(new[] { req }, resources, mapping);
        Assert.Equal(coldOptimalWarehouseId, multiPlan.Allocations.First().SelectedResourceItemId);
    }

    [Fact]
    public async Task RealSqliteTransaction_RollsBackAtomically_OnFailure()
    {
        using var conn = new SqliteConnection("Data Source=:memory:");
        await conn.OpenAsync();
        var options = new DbContextOptionsBuilder<ReliefCoordDbContext>()
            .UseSqlite(conn)
            .Options;

        await using var db = new ReliefCoordDbContext(options);
        await db.Database.EnsureCreatedAsync();
        var uow = new EfUnitOfWork(db);

        int beforeOrgs = await db.Organisations.CountAsync();
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await uow.ExecuteInTransactionAsync(async () =>
            {
                await uow.Organisations.AddAsync(new Organisation
                {
                    Name = "Transient Rollback Org",
                    OrganisationType = "NGO",
                    Country = "Sri Lanka"
                });
                await uow.SaveChangesAsync();
                throw new InvalidOperationException("Simulated mid-transaction failure");
            });
        });

        db.ChangeTracker.Clear();
        int afterOrgs = await db.Organisations.CountAsync();
        Assert.Equal(beforeOrgs, afterOrgs);
    }

    [Fact]
    public async Task MappingCoverageReport_AndServiceCentreReferences_ReturnGapAnalysis()
    {
        using var client = _factory.CreateClient();
        await LoginAsAsync(client, "coordinator@crisync.org", "Crisync@2026");

        var refs = await client.GetFromJsonAsync<List<MappingReference>>("/api/mapping/references", JsonOptions);
        Assert.NotNull(refs);
        Assert.True(refs!.Count >= 3);

        var coverage = await client.GetFromJsonAsync<JsonElement>("/api/mapping/coverage-report", JsonOptions);
        Assert.True(coverage.GetProperty("totalOperationalZones").GetInt32() >= 3);
        Assert.True(coverage.GetProperty("zones").GetArrayLength() >= 3);
    }

    [Fact]
    public async Task FailedNotificationRetrySweep_RecoversQueuedAlerts_WhenOutageClears()
    {
        var options = new DbContextOptionsBuilder<ReliefCoordDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        await using var db = new ReliefCoordDbContext(options);
        var uow = new EfUnitOfWork(db);
        var resilience = new ServiceResilienceMonitor();
        var mapping = new ResilientMappingProviderService(resilience);
        var aiFactory = new AiProviderFactory(resilience, mapping);
        var notifFactory = new NotificationChannelFactory(resilience);
        var eventBus = new InMemoryDomainEventQueue();
        var resolver = new ResourceAllocationStrategyResolver(Array.Empty<IResourceAllocationStrategy>());
        var ops = new HumanitarianOperationsService(uow, aiFactory, mapping, notifFactory, eventBus, resolver);

        resilience.SimulateExternalNotificationFailure = true;
        var failed = await ops.SendIdempotentNotificationAsync(new SendNotificationRequestDto(
            Guid.NewGuid(),
            "+94-77-1112233",
            NotificationChannel.Sms,
            "en",
            "Flood Warning",
            "Evacuate immediately",
            "RETRY-TEST-001"
        ));
        Assert.Equal(NotificationDeliveryStatus.FailedPendingRetry, failed.DeliveryStatus);

        resilience.SimulateExternalNotificationFailure = false;
        int recovered = await ops.RetryFailedNotificationsAsync();
        Assert.Equal(1, recovered);

        var persisted = await db.Notifications.FirstAsync(n => n.Id == failed.Id);
        Assert.Equal(NotificationDeliveryStatus.Sent, persisted.DeliveryStatus);
        Assert.Equal(2, persisted.RetryAttempts);
    }

    [Fact]
    public async Task MappingEndpoints_ReverseGeocode_ResolvesNearestZone()
    {
        using var client = _factory.CreateClient();
        await LoginAsAsync(client, "coordinator@crisync.org", "Crisync@2026");

        var rev = await client.GetFromJsonAsync<GeocodingResultDto>(
            "/api/mapping/reverse-geocode?latitude=6.6828&longitude=80.3992",
            JsonOptions);

        Assert.NotNull(rev);
        Assert.Contains("Ratnapura", rev!.FormattedAddress);
        Assert.False(string.IsNullOrWhiteSpace(rev.ProviderUsed));
    }

    [Fact]
    public async Task QuickUnlock_SetupVerify_AndThreeStrikeLockout_EnforcedWithAuditLogs()
    {
        using var adminClient = _factory.CreateClient();
        await LoginAsAsync(adminClient, "admin@crisync.org", "Admin@Crisync2026");

        var initialStatus = await adminClient.GetFromJsonAsync<QuickUnlockStatusDto>("/api/auth/quick-unlock/status", JsonOptions);
        Assert.NotNull(initialStatus);
        Assert.False(initialStatus!.QuickUnlockEnabled);

        var badPassResp = await adminClient.PostAsJsonAsync("/api/auth/quick-unlock/setup",
            new QuickUnlockSetupRequestDto("WrongPass!", "Pin", "482910"));
        Assert.Equal(HttpStatusCode.Unauthorized, badPassResp.StatusCode);

        var setupResp = await adminClient.PostAsJsonAsync("/api/auth/quick-unlock/setup",
            new QuickUnlockSetupRequestDto("Admin@Crisync2026", "Pin", "482910"));
        Assert.Equal(HttpStatusCode.OK, setupResp.StatusCode);
        var setup = await setupResp.Content.ReadFromJsonAsync<QuickUnlockSetupResponseDto>(JsonOptions);
        Assert.NotNull(setup);
        Assert.Equal("Pin", setup!.Mode);
        Assert.False(string.IsNullOrWhiteSpace(setup.DeviceToken));

        using var anonClient = _factory.CreateClient();
        var verifyOk = await anonClient.PostAsJsonAsync("/api/auth/quick-unlock/verify",
            new QuickUnlockVerifyRequestDto(setup.UserId, setup.DeviceToken, "482910"));
        Assert.Equal(HttpStatusCode.OK, verifyOk.StatusCode);
        var unlockedAuth = await verifyOk.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        Assert.False(string.IsNullOrWhiteSpace(unlockedAuth!.Token));

        for (int attempt = 1; attempt <= 3; attempt++)
        {
            var wrongResp = await anonClient.PostAsJsonAsync("/api/auth/quick-unlock/verify",
                new QuickUnlockVerifyRequestDto(setup.UserId, setup.DeviceToken, "000000"));
            Assert.Equal(HttpStatusCode.Unauthorized, wrongResp.StatusCode);
        }

        var lockedResp = await anonClient.PostAsJsonAsync("/api/auth/quick-unlock/verify",
            new QuickUnlockVerifyRequestDto(setup.UserId, setup.DeviceToken, "482910"));
        Assert.Equal(HttpStatusCode.Unauthorized, lockedResp.StatusCode);

        var auditLogs = await adminClient.GetFromJsonAsync<List<AuditEventRecord>>("/api/admin/audit-logs", JsonOptions);
        Assert.Contains(auditLogs!, a => a.ActionName == "QuickUnlock_LockedOut");
    }

    [Fact]
    public async Task QuickUnlock_BiometricChallengeAndWebAuthnVerify_SucceedsOnceAndBlocksReplay()
    {
        using var coordClient = _factory.CreateClient();
        await LoginAsAsync(coordClient, "coordinator@crisync.org", "Crisync@2026");

        var setupResp = await coordClient.PostAsJsonAsync("/api/auth/quick-unlock/setup",
            new QuickUnlockSetupRequestDto("Crisync@2026", "Pattern", "1-2-5-8-9", "cred-test-webauthn-001"));
        Assert.Equal(HttpStatusCode.OK, setupResp.StatusCode);
        var setup = await setupResp.Content.ReadFromJsonAsync<QuickUnlockSetupResponseDto>(JsonOptions);
        Assert.NotNull(setup);
        Assert.True(setup!.HasBiometricCredential);

        using var anonClient = _factory.CreateClient();
        var challengeResp = await anonClient.PostAsJsonAsync("/api/auth/quick-unlock/challenge",
            new QuickUnlockChallengeRequestDto(setup.UserId, setup.DeviceToken));
        Assert.Equal(HttpStatusCode.OK, challengeResp.StatusCode);
        var challenge = await challengeResp.Content.ReadFromJsonAsync<QuickUnlockChallengeResponseDto>(JsonOptions);
        Assert.NotNull(challenge);

        string clientJson = JsonSerializer.Serialize(new
        {
            type = "webauthn.get",
            challenge = challenge!.ChallengeBase64Url,
            origin = "http://localhost:5173"
        });
        string clientDataBase64Url = Convert.ToBase64String(Encoding.UTF8.GetBytes(clientJson))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');

        var bioPayload = new QuickUnlockBiometricVerifyRequestDto(
            setup.UserId,
            setup.DeviceToken,
            challenge.ChallengeId,
            "cred-test-webauthn-001",
            clientDataBase64Url);

        var firstVerify = await anonClient.PostAsJsonAsync("/api/auth/quick-unlock/biometric", bioPayload);
        Assert.Equal(HttpStatusCode.OK, firstVerify.StatusCode);
        var bioAuth = await firstVerify.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        Assert.False(string.IsNullOrWhiteSpace(bioAuth!.Token));

        var replayVerify = await anonClient.PostAsJsonAsync("/api/auth/quick-unlock/biometric", bioPayload);
        Assert.Equal(HttpStatusCode.Unauthorized, replayVerify.StatusCode);
    }

    [Fact]
    public async Task QuickUnlock_MultiDevice_LaptopAndPhoneBothWorkWithoutOverwriting()
    {
        using var coordClient = _factory.CreateClient();
        await LoginAsAsync(coordClient, "logistics@crisync.org", "Crisync@2026");

        var laptopResp = await coordClient.PostAsJsonAsync("/api/auth/quick-unlock/setup",
            new QuickUnlockSetupRequestDto("Crisync@2026", "Pin", "654321", "cred-laptop-001", "Windows PC (localhost:5173)", "localhost:5173"));
        Assert.Equal(HttpStatusCode.OK, laptopResp.StatusCode);
        var laptop = await laptopResp.Content.ReadFromJsonAsync<QuickUnlockSetupResponseDto>(JsonOptions);

        var phoneResp = await coordClient.PostAsJsonAsync("/api/auth/quick-unlock/setup",
            new QuickUnlockSetupRequestDto("Crisync@2026", "Pin", "654321", "cred-phone-002", "Android Phone (demo.ngrok-free.app)", "demo.ngrok-free.app"));
        Assert.Equal(HttpStatusCode.OK, phoneResp.StatusCode);
        var phone = await phoneResp.Content.ReadFromJsonAsync<QuickUnlockSetupResponseDto>(JsonOptions);

        Assert.NotEqual(laptop!.DeviceId, phone!.DeviceId);

        var status = await coordClient.GetFromJsonAsync<QuickUnlockStatusDto>("/api/auth/quick-unlock/status", JsonOptions);
        Assert.Equal(2, status!.TrustedDevices.Count);

        using var anonClient = _factory.CreateClient();
        var laptopVerify = await anonClient.PostAsJsonAsync("/api/auth/quick-unlock/verify",
            new QuickUnlockVerifyRequestDto(laptop.UserId, laptop.DeviceToken, "654321"));
        Assert.Equal(HttpStatusCode.OK, laptopVerify.StatusCode);

        var phoneVerify = await anonClient.PostAsJsonAsync("/api/auth/quick-unlock/verify",
            new QuickUnlockVerifyRequestDto(phone.UserId, phone.DeviceToken, "654321"));
        Assert.Equal(HttpStatusCode.OK, phoneVerify.StatusCode);

        var laptopChal = await anonClient.PostAsJsonAsync("/api/auth/quick-unlock/challenge",
            new QuickUnlockChallengeRequestDto(laptop.UserId, laptop.DeviceToken));
        var phoneChal = await anonClient.PostAsJsonAsync("/api/auth/quick-unlock/challenge",
            new QuickUnlockChallengeRequestDto(phone.UserId, phone.DeviceToken));
        Assert.Equal("cred-laptop-001", (await laptopChal.Content.ReadFromJsonAsync<QuickUnlockChallengeResponseDto>(JsonOptions))!.CredentialId);
        Assert.Equal("cred-phone-002", (await phoneChal.Content.ReadFromJsonAsync<QuickUnlockChallengeResponseDto>(JsonOptions))!.CredentialId);

        var removeLaptop = await coordClient.DeleteAsync($"/api/auth/quick-unlock/devices/{laptop.DeviceId}");
        Assert.Equal(HttpStatusCode.OK, removeLaptop.StatusCode);

        var laptopAfterRevoke = await anonClient.PostAsJsonAsync("/api/auth/quick-unlock/verify",
            new QuickUnlockVerifyRequestDto(laptop.UserId, laptop.DeviceToken, "654321"));
        Assert.Equal(HttpStatusCode.Unauthorized, laptopAfterRevoke.StatusCode);

        var phoneStillActive = await anonClient.PostAsJsonAsync("/api/auth/quick-unlock/verify",
            new QuickUnlockVerifyRequestDto(phone.UserId, phone.DeviceToken, "654321"));
        Assert.Equal(HttpStatusCode.OK, phoneStillActive.StatusCode);
    }

    [Fact]
    public async Task ShelterCheckout_ReleasesCapacity_AndSitRepAndFeedbackAnalytics_ReturnValidSummaries()
    {
        using var shelterClient = _factory.CreateClient();
        var shelterAuth = await LoginAsAsync(shelterClient, "shelter@crisync.org", "Crisync@2026");

        var shelterId = Guid.Parse("44444444-4444-4444-4444-444444444411");
        var beforeShelters = await shelterClient.GetFromJsonAsync<JsonElement>("/api/shelters", JsonOptions);
        int beforeOcc = beforeShelters.GetProperty("shelters").EnumerateArray()
            .First(s => s.GetProperty("id").GetGuid() == shelterId)
            .GetProperty("currentOccupancy").GetInt32();

        var allocResp = await shelterClient.PostAsJsonAsync("/api/shelters/allocate", new AllocateShelterRequestDto(
            shelterId,
            null,
            shelterAuth.UserId,
            "Checkout Verification Family",
            4,
            true
        ));
        allocResp.EnsureSuccessStatusCode();
        var allocation = await allocResp.Content.ReadFromJsonAsync<ShelterAllocation>(JsonOptions);
        Assert.NotNull(allocation);
        Assert.Equal("CheckedIn", allocation!.AllocationStatus);

        var checkoutResp = await shelterClient.PostAsJsonAsync(
            $"/api/shelters/allocations/{allocation.Id}/checkout",
            new CheckoutShelterAllocationDto("Family safely returned home after flood recession"));
        Assert.Equal(HttpStatusCode.OK, checkoutResp.StatusCode);
        var checkedOut = await checkoutResp.Content.ReadFromJsonAsync<ShelterAllocation>(JsonOptions);
        Assert.Equal("CheckedOut", checkedOut!.AllocationStatus);

        var afterShelters = await shelterClient.GetFromJsonAsync<JsonElement>("/api/shelters", JsonOptions);
        int afterOcc = afterShelters.GetProperty("shelters").EnumerateArray()
            .First(s => s.GetProperty("id").GetGuid() == shelterId)
            .GetProperty("currentOccupancy").GetInt32();
        Assert.Equal(beforeOcc, afterOcc);

        var doubleCheckoutResp = await shelterClient.PostAsJsonAsync(
            $"/api/shelters/allocations/{allocation.Id}/checkout",
            new CheckoutShelterAllocationDto("Duplicate checkout attempt"));
        Assert.Equal(HttpStatusCode.Conflict, doubleCheckoutResp.StatusCode);

        using var citizenClient = _factory.CreateClient();
        await LoginAsAsync(citizenClient, "citizen@crisync.org", "Crisync@2026");

        var fbPost = await citizenClient.PostAsJsonAsync("/api/requests/feedback", new SubmitFeedbackDto(
            Guid.Parse("66666666-6666-6666-6666-666666666611"),
            5,
            "Cold-chain insulin arrived quickly by boat.",
            true,
            true
        ));
        Assert.Equal(HttpStatusCode.OK, fbPost.StatusCode);

        var fbAnalytics = await citizenClient.GetFromJsonAsync<FeedbackAnalyticsSummaryDto>("/api/requests/feedback", JsonOptions);
        Assert.NotNull(fbAnalytics);
        Assert.True(fbAnalytics!.TotalReviewsCount >= 1);
        Assert.True(fbAnalytics.AverageRating >= 4.0);

        var sitRep = await shelterClient.GetFromJsonAsync<SitRepReportDto>("/api/reports/sitrep", JsonOptions);
        Assert.NotNull(sitRep);
        Assert.True(sitRep!.TotalAssistanceRequests >= 4);
        Assert.NotEmpty(sitRep.WarehouseAlerts);
    }

    [Fact]
    public async Task EmergencySos_AllowsUnauthenticatedDistressSubmission_WithMinimumContactAndLocationFields()
    {
        using var anonymousClient = _factory.CreateClient();

        var sosPayload = new EmergencySosRequestDto(
            ContactName: "Nimal Perera",
            ContactPhone: "+94-77-9988776",
            EmergencyType: "SearchAndRescue",
            PeopleCount: 4,
            LocationAddress: "No. 42, River Bank Road, Kalutara North",
            Latitude: 6.5854,
            Longitude: 79.9607,
            QuickNotes: "Family trapped on upper floor due to rapid flood rise"
        );

        var response = await anonymousClient.PostAsJsonAsync("/api/requests/emergency-sos", sosPayload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<AssistanceRequest>(JsonOptions);
        Assert.NotNull(created);
        Assert.StartsWith("SOS-", created!.ReferenceCode);
        Assert.Equal(UrgencyLevel.LifeThreatening, created.FinalApprovedUrgency);
        Assert.Contains("+94-77-9988776", created.Title);
        Assert.Contains("No. 42, River Bank Road, Kalutara North", created.LocationAddress);
        Assert.True(created.PriorityScore >= 95.0);
    }
}
