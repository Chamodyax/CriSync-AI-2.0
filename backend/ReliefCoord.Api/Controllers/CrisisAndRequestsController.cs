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
    public async Task<ActionResult> CreateOperationalArea(
        Guid crisisId,
        [FromBody] CreateOperationalAreaDto dto,
        CancellationToken cancellationToken)
    {
        var crisis = await _unitOfWork.CrisisEvents.GetByIdAsync(crisisId, cancellationToken);
        if (crisis == null)
        {
            return NotFound(new { message = "Crisis event not found." });
        }

        var area = new OperationalArea
        {
            CrisisEventId = crisis.Id,
            ZoneName = dto.ZoneName.Trim(),
            District = dto.District.Trim(),
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            CoverageRadiusKm = dto.CoverageRadiusKm > 0 ? dto.CoverageRadiusKm : 10.0,
            EstimatedAffectedPopulation = Math.Max(0, dto.EstimatedAffectedPopulation),
            RiskLevel = string.IsNullOrWhiteSpace(dto.RiskLevel) ? "High" : dto.RiskLevel.Trim(),
            AssignedOrganisationId = dto.AssignedOrganisationId
        };

        await _unitOfWork.OperationalAreas.AddAsync(area, cancellationToken);
        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "CrisisManagement",
            ActionName = "OperationalArea_Added",
            EntityType = nameof(OperationalArea),
            EntityId = area.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "Coordinator",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "EmergencyCoordinator",
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new { crisis.Title, area.ZoneName, area.District, area.RiskLevel })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(area);
    }

    [HttpGet("crises/alerts")]
    [AllowAnonymous]
    public async Task<ActionResult> GetPublicAlerts(CancellationToken cancellationToken)
    {
        var alerts = await _unitOfWork.PublicAlerts.GetAllAsync(cancellationToken);
        return Ok(alerts);
    }

    [HttpPost("crises/alerts")]
    [Authorize(Roles = "EmergencyCoordinator,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> CreatePublicAlert([FromBody] CreatePublicAlertDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Message))
        {
            return BadRequest(new { message = "Alert title and message are required." });
        }

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid userId = Guid.TryParse(userIdStr, out var parsed) ? parsed : Guid.Empty;

        Guid targetCrisisId = dto.CrisisEventId;
        if (targetCrisisId == Guid.Empty)
        {
            var allCrises = await _unitOfWork.CrisisEvents.GetAllAsync(cancellationToken);
            targetCrisisId = allCrises.FirstOrDefault()?.Id ?? Guid.Empty;
        }

        var alert = new PublicAlert
        {
            CrisisEventId = targetCrisisId,
            Title = dto.Title.Trim(),
            Message = dto.Message.Trim(),
            SeverityLevel = string.IsNullOrWhiteSpace(dto.SeverityLevel) ? "Warning" : dto.SeverityLevel.Trim(),
            SafetyGuidance = dto.SafetyGuidance?.Trim() ?? string.Empty,
            TranslationsJson = string.IsNullOrWhiteSpace(dto.TranslationsJson) ? "{}" : dto.TranslationsJson,
            IsVerified = true,
            IssuedByUserId = userId
        };

        await _unitOfWork.PublicAlerts.AddAsync(alert, cancellationToken);
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "PublicSafetyAlert",
            ActionName = "PublicAlert_Broadcast",
            EntityType = nameof(PublicAlert),
            EntityId = alert.Id.ToString(),
            ActorUserId = userId == Guid.Empty ? null : userId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "Coordinator",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "EmergencyCoordinator",
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new { alert.Title, alert.SeverityLevel, alert.CrisisEventId })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _eventPublisher.PublishAsync(new PublicAlertBroadcastEvent(
            Guid.NewGuid(),
            DateTime.UtcNow,
            alert.Id,
            alert.CrisisEventId,
            alert.Title,
            alert.SeverityLevel,
            alert.Message
        ), cancellationToken);

        return Ok(alert);
    }

    [HttpGet("requests")]
    [AllowAnonymous]
    public async Task<ActionResult> GetAssistanceRequests(CancellationToken cancellationToken)
    {
        var requests = await _unitOfWork.AssistanceRequests.GetAllAsync(cancellationToken);
        var histories = await _unitOfWork.RequestHistories.GetAllAsync(cancellationToken);
        var recommendations = await _unitOfWork.AiRecommendations.GetAllAsync(cancellationToken);
        var decisions = await _unitOfWork.GovernanceDecisions.GetAllAsync(cancellationToken);

        var decisionMap = decisions.ToDictionary(d => d.AiRecommendationId, d => d);

        foreach (var rec in recommendations)
        {
            if (decisionMap.TryGetValue(rec.Id, out var dec))
            {
                rec.HumanDecision = dec;
            }
        }

        foreach (var req in requests)
        {
            req.Timeline = histories
                .Where(h => h.AssistanceRequestId == req.Id)
                .OrderByDescending(h => h.CreatedAtUtc)
                .ToList();

            req.AiRecommendations = recommendations
                .Where(a => a.AssistanceRequestId == req.Id)
                .OrderByDescending(a => a.CreatedAtUtc)
                .ToList();
        }

        return Ok(requests);
    }

    [HttpPost("requests")]
    [AllowAnonymous]
    public async Task<ActionResult> SubmitAssistanceRequest([FromBody] CreateAssistanceRequestDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Description))
        {
            return BadRequest(new { message = "Request title and description are required." });
        }

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userName = User.FindFirstValue(ClaimTypes.Name) ?? "Authenticated Citizen";
        Guid userId = Guid.TryParse(userIdStr, out var parsed) ? parsed : Guid.Empty;

        var created = await _opsService.SubmitAssistanceRequestAsync(userId, userName, dto, cancellationToken);
        return Ok(created);
    }

    [HttpPost("requests/upload-evidence")]
    [AllowAnonymous]
    public async Task<ActionResult> UploadEvidence(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No evidence file provided." });
        }

        const long maxFileSize = 5 * 1024 * 1024;
        if (file.Length > maxFileSize)
        {
            return BadRequest(new { message = "Evidence file size exceeds the 5 MB security limit." });
        }

        var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".pdf" };
        string ext = Path.GetExtension(file.FileName);
        if (!allowedExtensions.Contains(ext))
        {
            return BadRequest(new { message = "Invalid file extension. Only .jpg, .png, and .pdf files are permitted." });
        }

        var allowedMimeTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "application/pdf"
        };
        if (string.IsNullOrWhiteSpace(file.ContentType) || !allowedMimeTypes.Contains(file.ContentType))
        {
            return BadRequest(new { message = "Invalid content type. Only JPEG, PNG, and PDF MIME types are permitted." });
        }

        byte[] headerBytes = new byte[8];
        int bytesRead;
        await using (var readStream = file.OpenReadStream())
        {
            bytesRead = await readStream.ReadAsync(headerBytes.AsMemory(0, 8), cancellationToken);
        }

        bool validMagic = false;
        if ((ext.Equals(".jpg", StringComparison.OrdinalIgnoreCase) || ext.Equals(".jpeg", StringComparison.OrdinalIgnoreCase)) &&
            bytesRead >= 3 &&
    }
}
