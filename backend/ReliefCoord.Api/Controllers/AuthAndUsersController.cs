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
        {
            return new List<StoredTrustedDevice>
            {
                new(
                    "legacy-device",
                    "Primary Device",
                    "localhost",
                    user.QuickUnlockDeviceTokenHash,
                    user.QuickUnlockDeviceTokenSalt,
                    user.QuickUnlockBiometricCredentialId,
                    user.UpdatedAtUtc)
            };
        }

        return new List<StoredTrustedDevice>();
    }

    private static StoredTrustedDevice? FindMatchingTrustedDevice(AppUser user, string deviceToken)
    {
        if (string.IsNullOrWhiteSpace(deviceToken))
        {
            return null;
        }

        foreach (var dev in ParseTrustedDevices(user))
        {
            if (HumanitarianOperationsService.VerifyPassword(deviceToken, dev.TokenHash, dev.TokenSalt))
            {
                return dev;
            }
        }

        return null;
    }

    private static void ClearQuickUnlockCredentials(AppUser user)
    {
        user.QuickUnlockEnabled = false;
        user.QuickUnlockMode = string.Empty;
        user.QuickUnlockSecretHash = string.Empty;
        user.QuickUnlockSecretSalt = string.Empty;
        user.QuickUnlockDeviceTokenHash = string.Empty;
        user.QuickUnlockDeviceTokenSalt = string.Empty;
        user.QuickUnlockBiometricCredentialId = string.Empty;
        user.QuickUnlockFailedAttempts = 0;
        user.QuickUnlockTrustedDevicesJson = "[]";
    }

    [HttpGet("auth/quick-unlock/status")]
    [Authorize]
    public async Task<ActionResult<QuickUnlockStatusDto>> GetQuickUnlockStatus(CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out Guid userId))
        {
            return Unauthorized();
        }

        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            return NotFound();
        }

        var devices = ParseTrustedDevices(user)
            .Select(d => new TrustedDeviceSummaryDto(
                d.DeviceId,
                d.DeviceName,
                d.OriginHost,
                !string.IsNullOrWhiteSpace(d.BiometricCredentialId),
                d.CreatedAtUtc))
            .ToList();

        return Ok(new QuickUnlockStatusDto(
            user.QuickUnlockEnabled,
            user.QuickUnlockMode,
            devices.Any(d => d.HasBiometrics) || !string.IsNullOrWhiteSpace(user.QuickUnlockBiometricCredentialId),
            user.QuickUnlockFailedAttempts,
            devices));
    }

    [HttpPost("auth/quick-unlock/setup")]
    [Authorize]
    public async Task<ActionResult<QuickUnlockSetupResponseDto>> SetupQuickUnlock([FromBody] QuickUnlockSetupRequestDto dto, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out Guid userId))
        {
            return Unauthorized();
        }

        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user == null || !user.IsActive)
        {
            return Unauthorized(new { message = "Active authenticated account required." });
        }

        if (!HumanitarianOperationsService.VerifyPassword(dto.CurrentPassword, user.PasswordHash, user.PasswordSalt))
        {
            return Unauthorized(new { message = "Current account password is incorrect." });
        }

        var validation = ValidateQuickUnlockSecret(dto.Mode, dto.Secret);
        if (!validation.IsValid)
        {
            return BadRequest(new { message = validation.ErrorMessage });
        }

        string rawDeviceToken = Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        var (secretHash, secretSalt) = HumanitarianOperationsService.HashPassword(validation.NormalizedSecret);
        var (deviceHash, deviceSalt) = HumanitarianOperationsService.HashPassword(rawDeviceToken);

        string deviceId = Guid.NewGuid().ToString("N")[..12];
        string cleanDeviceName = string.IsNullOrWhiteSpace(dto.DeviceName)
            ? "Trusted Browser"
            : dto.DeviceName.Trim();
        string cleanOriginHost = string.IsNullOrWhiteSpace(dto.OriginHost)
            ? (Request.Host.Value ?? "localhost")
            : dto.OriginHost.Trim();
        string cleanCredId = string.IsNullOrWhiteSpace(dto.BiometricCredentialId)
            ? string.Empty
            : dto.BiometricCredentialId.Trim();

        var existingDevices = ParseTrustedDevices(user);
        existingDevices.Add(new StoredTrustedDevice(
            deviceId,
            cleanDeviceName,
            cleanOriginHost,
            deviceHash,
            deviceSalt,
            cleanCredId,
            DateTime.UtcNow));

        if (existingDevices.Count > 5)
        {
            existingDevices = existingDevices.Skip(existingDevices.Count - 5).ToList();
        }

        user.QuickUnlockEnabled = true;
        user.QuickUnlockMode = validation.NormalizedMode;
        user.QuickUnlockSecretHash = secretHash;
        user.QuickUnlockSecretSalt = secretSalt;
        user.QuickUnlockDeviceTokenHash = deviceHash;
        user.QuickUnlockDeviceTokenSalt = deviceSalt;
        user.QuickUnlockBiometricCredentialId = cleanCredId;
        user.QuickUnlockFailedAttempts = 0;
        user.QuickUnlockTrustedDevicesJson = JsonSerializer.Serialize(existingDevices);

        await _unitOfWork.Users.UpdateAsync(user, cancellationToken);
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "Authentication",
            ActionName = "QuickUnlock_Configured",
            EntityType = nameof(AppUser),
            EntityId = user.Id.ToString(),
            ActorUserId = user.Id,
            ActorUserName = user.FullName,
            ActorRole = user.Role.ToString(),
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new
            {
                Mode = user.QuickUnlockMode,
                DeviceId = deviceId,
                DeviceName = cleanDeviceName,
                OriginHost = cleanOriginHost,
                BiometricsEnrolled = !string.IsNullOrWhiteSpace(cleanCredId),
                TotalTrustedDevices = existingDevices.Count
            })
        }, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Ok(new QuickUnlockSetupResponseDto(
            user.Id,
            user.FullName,
            user.Email,
            user.Role.ToString(),
            user.QuickUnlockMode,
            !string.IsNullOrWhiteSpace(cleanCredId),
            rawDeviceToken,
            deviceId,
            cleanDeviceName));
    }

    [HttpDelete("auth/quick-unlock/devices/{deviceId}")]
    [Authorize]
    public async Task<IActionResult> RemoveTrustedDevice(string deviceId, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out Guid userId))
        {
            return Unauthorized();
        }

        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            return NotFound();
        }

        var devices = ParseTrustedDevices(user);
        int removed = devices.RemoveAll(d => string.Equals(d.DeviceId, deviceId, StringComparison.OrdinalIgnoreCase));
        if (removed == 0)
        {
            return NotFound(new { message = "Trusted device not found." });
        }

        if (devices.Count == 0)
        {
            ClearQuickUnlockCredentials(user);
        }
        else
        {
            var latest = devices[^1];
            user.QuickUnlockTrustedDevicesJson = JsonSerializer.Serialize(devices);
            user.QuickUnlockDeviceTokenHash = latest.TokenHash;
            user.QuickUnlockDeviceTokenSalt = latest.TokenSalt;
            user.QuickUnlockBiometricCredentialId = latest.BiometricCredentialId;
        }

        await _unitOfWork.Users.UpdateAsync(user, cancellationToken);
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "Authentication",
            ActionName = "QuickUnlock_DeviceRevoked",
            EntityType = nameof(AppUser),
            EntityId = user.Id.ToString(),
            ActorUserId = user.Id,
            ActorUserName = user.FullName,
            ActorRole = user.Role.ToString(),
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new { user.Email, DeviceId = deviceId, RemainingDevices = devices.Count })
        }, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Trusted device removed.", remainingDevices = devices.Count });
    }

    [HttpDelete("auth/quick-unlock")]
    [Authorize]
    public async Task<IActionResult> RevokeQuickUnlock(CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out Guid userId))
        {
            return Unauthorized();
        }

        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            return NotFound();
        }

        ClearQuickUnlockCredentials(user);
        await _unitOfWork.Users.UpdateAsync(user, cancellationToken);
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "Authentication",
            ActionName = "QuickUnlock_Revoked",
            EntityType = nameof(AppUser),
            EntityId = user.Id.ToString(),
            ActorUserId = user.Id,
            ActorUserName = user.FullName,
            ActorRole = user.Role.ToString(),
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new { user.Email })
        }, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Trusted-device Quick Unlock disabled across all devices." });
    }

    [HttpPost("auth/quick-unlock/verify")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponseDto>> VerifyQuickUnlock([FromBody] QuickUnlockVerifyRequestDto dto, CancellationToken cancellationToken)
    {
        string clientIp = GetClientIp();
        var user = await _unitOfWork.Users.GetByIdAsync(dto.UserId, cancellationToken);
        if (user == null || !user.IsActive || !user.QuickUnlockEnabled)
        {
            return Unauthorized(new { message = "Quick Unlock is not active for this device. Please sign in with your password." });
        }

        var matchedDevice = FindMatchingTrustedDevice(user, dto.DeviceToken);
        if (matchedDevice == null)
        {
            await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
            {
                EventCategory = "Authentication",
                ActionName = "QuickUnlock_InvalidDeviceToken",
                EntityType = nameof(AppUser),
                EntityId = user.Id.ToString(),
                ActorUserId = user.Id,
                ActorUserName = user.FullName,
                ActorRole = user.Role.ToString(),
                IpAddress = clientIp,
                DetailsJson = JsonSerializer.Serialize(new { user.Email })
            }, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Unauthorized(new { message = "Device binding expired or mismatched. Please sign in with your password." });
        }

        bool validSecret = HumanitarianOperationsService.VerifyPassword((dto.Secret ?? string.Empty).Trim(), user.QuickUnlockSecretHash, user.QuickUnlockSecretSalt);
        if (!validSecret)
        {
            user.QuickUnlockFailedAttempts += 1;
            bool lockedOut = user.QuickUnlockFailedAttempts >= 3;
            string action = lockedOut ? "QuickUnlock_LockedOut" : "QuickUnlock_Failed";
            int attemptsSnapshot = user.QuickUnlockFailedAttempts;

            if (lockedOut)
            {
                ClearQuickUnlockCredentials(user);
            }

            await _unitOfWork.Users.UpdateAsync(user, cancellationToken);
            await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
            {
                EventCategory = "Authentication",
                ActionName = action,
                EntityType = nameof(AppUser),
                EntityId = user.Id.ToString(),
                ActorUserId = user.Id,
                ActorUserName = user.FullName,
                ActorRole = user.Role.ToString(),
                IpAddress = clientIp,
                DetailsJson = "{}"
            }, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            if (lockedOut)
            {
                return Unauthorized(new { message = "Quick Unlock locked after 3 failed attempts. Please sign in with your full password." });
            }

            int remaining = 3 - attemptsSnapshot;
            return Unauthorized(new { message = $"Incorrect {user.QuickUnlockMode}. {remaining} attempt(s) remaining before lockout." });
        }

        user.QuickUnlockFailedAttempts = 0;
        await _unitOfWork.Users.UpdateAsync(user, cancellationToken);
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "Authentication",
            ActionName = "QuickUnlock_Succeeded",
            EntityType = nameof(AppUser),
            EntityId = user.Id.ToString(),
            ActorUserId = user.Id,
            ActorUserName = user.FullName,
            ActorRole = user.Role.ToString(),
            IpAddress = clientIp,
            DetailsJson = JsonSerializer.Serialize(new { user.Email, Mode = user.QuickUnlockMode, matchedDevice.DeviceId, matchedDevice.DeviceName })
        }, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        string token = _jwtGenerator.GenerateToken(user);
        return Ok(await BuildAuthResponseAsync(user, token, cancellationToken));
    }

    [HttpPost("auth/quick-unlock/challenge")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<QuickUnlockChallengeResponseDto>> IssueBiometricChallenge([FromBody] QuickUnlockChallengeRequestDto dto, CancellationToken cancellationToken)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(dto.UserId, cancellationToken);
        if (user == null || !user.IsActive || !user.QuickUnlockEnabled)
        {
            return Unauthorized(new { message = "Biometric Quick Unlock is not enrolled on this account." });
        }

        var matchedDevice = FindMatchingTrustedDevice(user, dto.DeviceToken);
        if (matchedDevice == null)
        {
            return Unauthorized(new { message = "Untrusted device token. Please sign in with your password." });
        }

        if (string.IsNullOrWhiteSpace(matchedDevice.BiometricCredentialId))
        {
            return Unauthorized(new { message = "Biometrics are not enrolled on this specific device. Unlock with your Pattern/PIN or re-enroll on this device." });
        }

        string challengeId = Guid.NewGuid().ToString("N");
        string challengeBase64Url = Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        QuickUnlockChallenges[challengeId] = (user.Id, challengeBase64Url, DateTime.UtcNow.AddMinutes(2));

        return Ok(new QuickUnlockChallengeResponseDto(challengeId, challengeBase64Url, matchedDevice.BiometricCredentialId));
    }

    [HttpPost("auth/quick-unlock/biometric")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponseDto>> VerifyBiometricQuickUnlock([FromBody] QuickUnlockBiometricVerifyRequestDto dto, CancellationToken cancellationToken)
    {
        if (!QuickUnlockChallenges.TryRemove(dto.ChallengeId, out var challengeEntry) ||
            challengeEntry.ExpiresUtc < DateTime.UtcNow ||
            challengeEntry.UserId != dto.UserId)
        {
            return Unauthorized(new { message = "Biometric challenge is expired or already consumed. Please retry." });
        }

        var user = await _unitOfWork.Users.GetByIdAsync(dto.UserId, cancellationToken);
        if (user == null || !user.IsActive || !user.QuickUnlockEnabled)
        {
            return Unauthorized(new { message = "Biometric Quick Unlock is not active for this account." });
        }

        var matchedDevice = FindMatchingTrustedDevice(user, dto.DeviceToken);
        if (matchedDevice == null ||
            string.IsNullOrWhiteSpace(matchedDevice.BiometricCredentialId) ||
            !string.Equals(dto.CredentialId.Trim(), matchedDevice.BiometricCredentialId, StringComparison.Ordinal))
        {
            return Unauthorized(new { message = "Biometric credential mismatch on this device." });
        }

        try
        {
            byte[] clientJsonBytes = Base64UrlDecode(dto.ClientDataJsonBase64Url);
            using var doc = JsonDocument.Parse(clientJsonBytes);
            string? authType = doc.RootElement.TryGetProperty("type", out var tProp) ? tProp.GetString() : null;
            string? authChallenge = doc.RootElement.TryGetProperty("challenge", out var cProp) ? cProp.GetString() : null;

            if (!string.Equals(authType, "webauthn.get", StringComparison.Ordinal) ||
                !string.Equals(authChallenge, challengeEntry.ChallengeBase64Url, StringComparison.Ordinal))
            {
                return Unauthorized(new { message = "Invalid WebAuthn assertion payload." });
            }
        }
        catch
        {
            return Unauthorized(new { message = "Malformed WebAuthn client assertion payload." });
        }

        user.QuickUnlockFailedAttempts = 0;
        await _unitOfWork.Users.UpdateAsync(user, cancellationToken);
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "Authentication",
            ActionName = "QuickUnlock_BiometricSucceeded",
            EntityType = nameof(AppUser),
            EntityId = user.Id.ToString(),
    }
}
