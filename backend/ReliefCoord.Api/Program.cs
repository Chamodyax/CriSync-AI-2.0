using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ReliefCoord.Api.Security;
using ReliefCoord.Application.Interfaces;
using ReliefCoord.Application.Services;
using ReliefCoord.Application.Strategies;
using ReliefCoord.Infrastructure.ExternalServices;
using ReliefCoord.Infrastructure.Messaging;
using ReliefCoord.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AI-Powered Humanitarian Crisis Management & Aid Coordination API",
        Version = "v1.0",
        Description = "SE205.3 Software Architecture Multi-Organisation Humanitarian Operations Platform"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT token"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

string dbProvider = builder.Configuration["DatabaseProvider"] ?? "Sqlite";
builder.Services.AddDbContext<ReliefCoordDbContext>(options =>
{
    if (dbProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlServer(builder.Configuration.GetConnectionString("SqlServerConnection"));
    }
    else if (dbProvider.Equals("InMemory", StringComparison.OrdinalIgnoreCase))
    {
        options.UseInMemoryDatabase("ReliefCoordTestDb");
    }
    else
    {
        options.UseSqlite(builder.Configuration.GetConnectionString("SqliteConnection") ?? "Data Source=reliefcoord_platform.db");
    }
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();

builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IConfiguration, IHostEnvironment>((options, configuration, environment) =>
    {
        string jwtKey = configuration["Jwt:Key"] ?? "FallbackKey";
        string jwtIssuer = configuration["Jwt:Issuer"] ?? "ReliefCoordApi";
        string jwtAudience = configuration["Jwt:Audience"] ?? "ReliefCoordClients";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

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
