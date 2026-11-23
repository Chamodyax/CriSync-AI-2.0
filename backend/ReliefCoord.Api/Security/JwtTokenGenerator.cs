using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using ReliefCoord.Domain.Entities;

namespace ReliefCoord.Api.Security;

public static class JwtConfigurationHelper
{
    private const string DevFallbackSigningKey = "CriSyncDevOnlyFallbackSigningKey_2026_SE2053_Minimum32Chars!";

    public static string ResolveSigningKey(IConfiguration configuration, IHostEnvironment? environment = null)
    {
        string? envKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");
        if (!string.IsNullOrWhiteSpace(envKey))
        {
            return envKey.Trim();
        }

        string? configKey = configuration["Jwt:Key"];
        if (!string.IsNullOrWhiteSpace(configKey))
        {
            return configKey.Trim();
        }

        if (environment != null && environment.IsProduction())
        {
            return DevFallbackSigningKey;
        }

        return DevFallbackSigningKey;
    }
}

public class JwtTokenGenerator
{
    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment? _environment;

    public JwtTokenGenerator(IConfiguration configuration, IHostEnvironment? environment = null)
    {
        _configuration = configuration;
        _environment = environment;
    }

    public string GenerateToken(AppUser user)
    {
        string secretKey = JwtConfigurationHelper.ResolveSigningKey(_configuration, _environment);
        string issuer = _configuration["Jwt:Issuer"] ?? "ReliefCoordApi";
        string audience = _configuration["Jwt:Audience"] ?? "ReliefCoordClients";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("preferred_language", user.PreferredLanguage)
        };

        if (user.OrganisationId.HasValue)
        {
            claims.Add(new Claim("organisation_id", user.OrganisationId.Value.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(12),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
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
