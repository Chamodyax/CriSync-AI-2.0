using System.Collections.Concurrent;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ReliefCoord.Api.Security;
using ReliefCoord.Application.DTOs;
using ReliefCoord.Application.Interfaces;
using ReliefCoord.Application.Services;
using ReliefCoord.Domain.Entities;
using ReliefCoord.Domain.Enums;

namespace ReliefCoord.Api.Controllers;

[ApiController]
[Route("api")]
public class AuthAndUsersController : ControllerBase
{
    private static readonly object SettingsLock = new();
    private static readonly ConcurrentDictionary<string, (Guid UserId, string ChallengeBase64Url, DateTime ExpiresUtc)> QuickUnlockChallenges = new();
    private static ServiceIntegrationSettingsDto _serviceSettings = new(
        AiProviderName: "Azure OpenAI / Local Rule Fallback",
        AiModelName: "crisync-triage-v2",
        AiConfidenceThreshold: 0.72,
        SimulateExternalAiFailure: false,
        SmsProviderName: "Twilio Humanitarian Gateway",
        SmsSenderId: "CRISYNC",
        SmsIdempotencyWindowMinutes: 60,
        SimulateExternalNotificationFailure: false,
        EmailSmtpProvider: "SendGrid Relief Relay",
        EmailSenderAddress: "alerts@crisync.org",
        EmailAlertsEnabled: true,
        MappingProviderName: "OpenStreetMap / OSRM Routing",
        GeocodingProviderName: "Nominatim Disaster Geocode",
        SimulateExternalMappingFailure: false
    );

    private readonly IUnitOfWork _unitOfWork;
    private readonly JwtTokenGenerator _jwtGenerator;
    private readonly IServiceResilienceMonitor _resilienceMonitor;
    private readonly IGovernanceConfigProvider _governanceConfigProvider;

    public AuthAndUsersController(
        IUnitOfWork unitOfWork,
        JwtTokenGenerator jwtGenerator,
        IServiceResilienceMonitor resilienceMonitor,
        IGovernanceConfigProvider governanceConfigProvider)
    {
        _unitOfWork = unitOfWork;
        _jwtGenerator = jwtGenerator;
        _resilienceMonitor = resilienceMonitor;
        _governanceConfigProvider = governanceConfigProvider;
    }

    private string GetClientIp()
    {
        string? forwarded = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded))
        {
            return forwarded.Split(',')[0].Trim();
        }
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
    }

    private async Task<string> ResolveOrganisationNameAsync(AppUser user, CancellationToken cancellationToken)
    {
        if (user.OrganisationId.HasValue)
        {
            var org = await _unitOfWork.Organisations.GetByIdAsync(user.OrganisationId.Value, cancellationToken);
            if (org != null)
            {
                return org.Name;
            }
        }
        return user.Role switch
        {
            UserRole.Citizen => "Citizen / Household Portal",
            UserRole.Donor => "Public Humanitarian Donor",
            UserRole.Volunteer => "Community Volunteer Roster",
            _ => "Independent Responder"
        };
    }

    private AdminUserSummaryDto BuildUserSummary(AppUser u, string organisationName) =>
        new(
            u.Id,
            u.FullName,
            u.Email,
            u.PhoneNumber,
            u.Role.ToString(),
            u.PreferredLanguage,
            u.OrganisationId,
            organisationName,
            u.IsActive,
            u.CreatedAtUtc,
            u.AccountStatus,
            u.InvitedByUserName,
            u.InvitationCode);

    private async Task<(bool Allowed, string ErrorMessage)> ValidateAdminCountPolicyAsync(
        UserRole targetRole,
        bool targetIsActive,
        UserRole? previousRole,
        bool previousIsActive,
        CancellationToken cancellationToken)
    {
        var allUsers = await _unitOfWork.Users.GetAllAsync(cancellationToken);
        int activeGlobalAdmins = allUsers.Count(u => u.Role == UserRole.SystemAdmin && u.IsActive);
        int activeOrgAdmins = allUsers.Count(u => u.Role == UserRole.OrganizationAdmin && u.IsActive);

        bool wasActiveGlobal = previousRole == UserRole.SystemAdmin && previousIsActive;
        bool willBeActiveGlobal = targetRole == UserRole.SystemAdmin && targetIsActive;
        int projectedGlobal = activeGlobalAdmins + (willBeActiveGlobal ? 1 : 0) - (wasActiveGlobal ? 1 : 0);

        bool wasActiveOrg = previousRole == UserRole.OrganizationAdmin && previousIsActive;
        bool willBeActiveOrg = targetRole == UserRole.OrganizationAdmin && targetIsActive;
        int projectedOrg = activeOrgAdmins + (willBeActiveOrg ? 1 : 0) - (wasActiveOrg ? 1 : 0);

        SystemGovernanceConfigDto cfg = _governanceConfigProvider.GetConfig();

        if (willBeActiveGlobal && projectedGlobal > activeGlobalAdmins && projectedGlobal > cfg.MaxGlobalAdmins)
        {
            return (false, $"Small Admin Count Policy: Maximum limit of {cfg.MaxGlobalAdmins} active Global System Admins reached. Too many admins increases security risk.");
        }

        if (wasActiveGlobal && !willBeActiveGlobal && projectedGlobal < cfg.MinGlobalAdmins)
        {
            return (false, $"Small Admin Count Policy: At least {cfg.MinGlobalAdmins} active Global System Admins must remain active so system control is never lost if one admin is unavailable.");
        }

        if (willBeActiveOrg && projectedOrg > activeOrgAdmins && projectedOrg > cfg.MaxOrganizationAdmins)
        {
            return (false, $"Small Admin Count Policy: Maximum limit of {cfg.MaxOrganizationAdmins} active Organization Admins reached.");
        }

        return (true, string.Empty);
    }

    [HttpPost("auth/login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { message = "Email and password are required." });
        }

        string clientIp = GetClientIp();
        string normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var users = await _unitOfWork.Users.FindAsync(
            u => u.Email.ToLower() == normalizedEmail,
            cancellationToken);

        var user = users.FirstOrDefault();
        if (user == null || !HumanitarianOperationsService.VerifyPassword(dto.Password, user.PasswordHash, user.PasswordSalt))
        {
            await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
            {
                EventCategory = "Authentication",
                ActionName = "Login_Failed",
                EntityType = nameof(AppUser),
                EntityId = user?.Id.ToString() ?? normalizedEmail,
                ActorUserId = user?.Id,
                ActorUserName = user?.FullName ?? normalizedEmail,
                ActorRole = user?.Role.ToString() ?? "Anonymous",
                IpAddress = clientIp,
                DetailsJson = JsonSerializer.Serialize(new { Email = normalizedEmail, Reason = "InvalidCredentials" })
            }, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Unauthorized(new { message = "Invalid email or password credentials." });
        }

        if (!user.IsActive)
        {
            await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
            {
                EventCategory = "Authentication",
                ActionName = "Login_BlockedInactive",
                EntityType = nameof(AppUser),
                EntityId = user.Id.ToString(),
                ActorUserId = user.Id,
                ActorUserName = user.FullName,
                ActorRole = user.Role.ToString(),
                IpAddress = clientIp,
                DetailsJson = JsonSerializer.Serialize(new { Email = user.Email, Reason = "AccountDeactivated" })
            }, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Unauthorized(new { message = "This account has been deactivated by an administrator." });
        }

        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "Authentication",
            ActionName = "Login_Succeeded",
            EntityType = nameof(AppUser),
            EntityId = user.Id.ToString(),
            ActorUserId = user.Id,
            ActorUserName = user.FullName,
            ActorRole = user.Role.ToString(),
            IpAddress = clientIp,
            DetailsJson = JsonSerializer.Serialize(new { Email = user.Email, Role = user.Role.ToString() })
        }, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        string token = _jwtGenerator.GenerateToken(user);
        return Ok(await BuildAuthResponseAsync(user, token, cancellationToken));
    }

    private async Task<AuthResponseDto> BuildAuthResponseAsync(AppUser user, string token, CancellationToken cancellationToken)
    {
        string orgName = await ResolveOrganisationNameAsync(user, cancellationToken);
        return new AuthResponseDto(
            token,
            user.Id,
            user.FullName,
            user.Email,
            user.Role.ToString(),
            user.PreferredLanguage,
            user.OrganisationId,
            orgName,
            user.AccountStatus,
            user.PhoneNumber,
            user.ProfilePhotoUrl
        );
    }

    private static string Base64UrlEncode(byte[] data) =>
        Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] Base64UrlDecode(string input)
    {
        string padded = input.Replace('-', '+').Replace('_', '/');
        switch (padded.Length % 4)
        {
            case 2:
                padded += "==";
                break;
            case 3:
                padded += "=";
                break;
        }
        return Convert.FromBase64String(padded);
    }

    private static (bool IsValid, string NormalizedMode, string NormalizedSecret, string ErrorMessage) ValidateQuickUnlockSecret(string mode, string secret)
    {
        string trimmedMode = (mode ?? string.Empty).Trim();
        string trimmedSecret = (secret ?? string.Empty).Trim();

        if (string.Equals(trimmedMode, "Pin", StringComparison.OrdinalIgnoreCase))
        {
            if (!Regex.IsMatch(trimmedSecret, @"^\d{6}$"))
            {
                return (false, "Pin", string.Empty, "Quick Unlock PIN must be exactly 6 numeric digits.");
            }
            return (true, "Pin", trimmedSecret, string.Empty);
        }

        if (string.Equals(trimmedMode, "Pattern", StringComparison.OrdinalIgnoreCase))
        {
            string[] parts = trimmedSecret.Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (parts.Length < 4 || parts.Length > 9)
            {
                return (false, "Pattern", string.Empty, "Quick Unlock pattern must connect at least 4 distinct nodes.");
            }
            foreach (string p in parts)
            {
                if (!int.TryParse(p, out int node) || node < 1 || node > 9)
                {
                    return (false, "Pattern", string.Empty, "Quick Unlock pattern contains an invalid node.");
                }
            }
            if (parts.Distinct().Count() != parts.Length)
            {
                return (false, "Pattern", string.Empty, "Quick Unlock pattern must use distinct nodes without repeats.");
            }
            return (true, "Pattern", string.Join("-", parts), string.Empty);
        }

        return (false, string.Empty, string.Empty, "Quick Unlock mode must be either 'Pin' or 'Pattern'.");
    }

    private sealed record StoredTrustedDevice(
        string DeviceId,
        string DeviceName,
        string OriginHost,
        string TokenHash,
        string TokenSalt,
        string BiometricCredentialId,
        DateTime CreatedAtUtc);

    private static List<StoredTrustedDevice> ParseTrustedDevices(AppUser user)
    {
        if (!string.IsNullOrWhiteSpace(user.QuickUnlockTrustedDevicesJson) &&
            user.QuickUnlockTrustedDevicesJson.TrimStart().StartsWith("["))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<List<StoredTrustedDevice>>(user.QuickUnlockTrustedDevicesJson);
                if (parsed != null && parsed.Count > 0)
                {
                    return parsed;
                }
            }
            catch
            {
            }
        }

        if (user.QuickUnlockEnabled && !string.IsNullOrWhiteSpace(user.QuickUnlockDeviceTokenHash))
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
