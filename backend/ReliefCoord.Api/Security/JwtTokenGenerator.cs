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
            throw new InvalidOperationException("JWT_SECRET_KEY must be configured in Production.");
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
