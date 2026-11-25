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
}
