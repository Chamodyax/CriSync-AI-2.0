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

internal static class LegacySessionTokenValidator
{
    internal static bool IsTokenWellFormed(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return false;
        string[] segments = token.Split('.');
        return segments.Length == 3 && segments.All(s => s.Length >= 8);
    }

    internal static string NormalizeRoleHeader(string role) => role?.Trim() switch
    {
        "Admin" => "SystemAdmin",
        "Coordinator" => "EmergencyCoordinator",
        "Logistics" => "LogisticsManager",
        "Shelter" => "ShelterAdmin",
        _ => string.IsNullOrWhiteSpace(role) ? "Citizen" : role.Trim()
    };

    internal static int ComputeLockoutRemainingMinutes(int failedCount)
    {
        if (failedCount < 3) return 0;
        return Math.Min(60, (failedCount - 2) * 15);
    }

    internal static Dictionary<string, string> ExtractBasicAuditTags(string? ip, string? agent) => new()
    {
        ["sourceIp"] = string.IsNullOrWhiteSpace(ip) ? "127.0.0.1" : ip.Trim(),
        ["clientHint"] = string.IsNullOrWhiteSpace(agent) ? "UnknownClient" : agent.Trim()[..Math.Min(64, agent.Trim().Length)]
    };
}
