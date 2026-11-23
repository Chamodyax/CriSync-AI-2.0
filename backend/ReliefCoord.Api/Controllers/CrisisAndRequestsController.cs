using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ReliefCoord.Application.DTOs;
using ReliefCoord.Application.Interfaces;
using ReliefCoord.Application.Services;
using ReliefCoord.Domain.Entities;
using ReliefCoord.Domain.Enums;
using ReliefCoord.Domain.Events;

namespace ReliefCoord.Api.Controllers;

[ApiController]
[Route("api")]
public class CrisisAndRequestsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly HumanitarianOperationsService _opsService;
    private readonly IWebHostEnvironment _env;
    private readonly IDomainEventPublisher _eventPublisher;

    public CrisisAndRequestsController(
        IUnitOfWork unitOfWork,
        HumanitarianOperationsService opsService,
        IWebHostEnvironment env,
        IDomainEventPublisher eventPublisher)
    {
        _unitOfWork = unitOfWork;
        _opsService = opsService;
        _env = env;
        _eventPublisher = eventPublisher;
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

    [HttpGet("crises")]
    [AllowAnonymous]
    public async Task<ActionResult> GetCrises(CancellationToken cancellationToken)
    {
        var crises = await _unitOfWork.CrisisEvents.GetAllAsync(cancellationToken);
        var areas = await _unitOfWork.OperationalAreas.GetAllAsync(cancellationToken);

        foreach (var c in crises)
        {
            c.OperationalAreas = areas.Where(a => a.CrisisEventId == c.Id).ToList();
        }

        return Ok(crises);
    }

    [HttpPost("crises")]
    [Authorize(Roles = "EmergencyCoordinator,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> CreateCrisis([FromBody] CreateCrisisEventDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return BadRequest(new { message = "Crisis title is required." });
        }

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        var crisis = new CrisisEvent
        {
            Title = dto.Title.Trim(),
            CrisisType = dto.CrisisType,
            Severity = dto.Severity,
            Country = dto.Country.Trim(),
            Region = dto.Region.Trim(),
            Description = dto.Description.Trim(),
            CenterLatitude = dto.CenterLatitude,
            CenterLongitude = dto.CenterLongitude,
            RadiusKm = dto.RadiusKm > 0 ? dto.RadiusKm : 25.0,
            IsActive = dto.IsActive,
            LeadCoordinatorId = actorId
        };

        await _unitOfWork.CrisisEvents.AddAsync(crisis, cancellationToken);
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "CrisisManagement",
            ActionName = "CrisisEvent_Created",
            EntityType = nameof(CrisisEvent),
            EntityId = crisis.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "Coordinator",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "EmergencyCoordinator",
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new { crisis.Title, Severity = crisis.Severity.ToString(), crisis.Region })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(crisis);
    }

    [HttpPut("crises/{id:guid}")]
    [Authorize(Roles = "EmergencyCoordinator,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> UpdateCrisis(Guid id, [FromBody] UpdateCrisisEventDto dto, CancellationToken cancellationToken)
    {
        var crisis = await _unitOfWork.CrisisEvents.GetByIdAsync(id, cancellationToken);
        if (crisis == null)
        {
            return NotFound(new { message = "Crisis event not found." });
        }

        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return BadRequest(new { message = "Crisis title is required." });
        }

        crisis.Title = dto.Title.Trim();
        crisis.CrisisType = dto.CrisisType;
        crisis.Severity = dto.Severity;
        crisis.Region = dto.Region?.Trim() ?? string.Empty;
        crisis.Description = dto.Description?.Trim() ?? string.Empty;
        crisis.CenterLatitude = dto.CenterLatitude;
        crisis.CenterLongitude = dto.CenterLongitude;
        crisis.RadiusKm = dto.RadiusKm > 0 ? dto.RadiusKm : crisis.RadiusKm;
        crisis.IsActive = dto.IsActive;

        await _unitOfWork.CrisisEvents.UpdateAsync(crisis, cancellationToken);

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "CrisisManagement",
            ActionName = "Admin_UpdatedCrisis",
            EntityType = nameof(CrisisEvent),
            EntityId = crisis.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "SystemAdmin",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "SystemAdmin",
            DetailsJson = JsonSerializer.Serialize(new { crisis.Title, Severity = crisis.Severity.ToString(), crisis.IsActive })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(crisis);
    }

    [HttpDelete("crises/{id:guid}")]
    [Authorize(Roles = "SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> DeleteCrisis(Guid id, CancellationToken cancellationToken)
    {
        var crisis = await _unitOfWork.CrisisEvents.GetByIdAsync(id, cancellationToken);
        if (crisis == null)
        {
            return NotFound(new { message = "Crisis event not found." });
        }

        var areas = await _unitOfWork.OperationalAreas.FindAsync(a => a.CrisisEventId == id, cancellationToken);
        foreach (var area in areas)
        {
            await _unitOfWork.OperationalAreas.DeleteAsync(area, cancellationToken);
        }

        var alerts = await _unitOfWork.PublicAlerts.FindAsync(a => a.CrisisEventId == id, cancellationToken);
        foreach (var alert in alerts)
        {
            await _unitOfWork.PublicAlerts.DeleteAsync(alert, cancellationToken);
        }

        await _unitOfWork.CrisisEvents.DeleteAsync(crisis, cancellationToken);

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "CrisisManagement",
            ActionName = "Admin_DeletedCrisis",
            EntityType = nameof(CrisisEvent),
            EntityId = crisis.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "SystemAdmin",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "SystemAdmin",
            DetailsJson = JsonSerializer.Serialize(new { crisis.Title, crisis.Region })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(new { deletedCrisisId = id });
    }

    [HttpPost("crises/{crisisId:guid}/operational-areas")]
    [Authorize(Roles = "EmergencyCoordinator,SystemAdmin,OrganizationAdmin")]
    }
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
