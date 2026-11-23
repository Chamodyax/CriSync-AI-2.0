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
    [Authorize]
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
    [Authorize]
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
    [Authorize]
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
            headerBytes[0] == 0xFF && headerBytes[1] == 0xD8 && headerBytes[2] == 0xFF)
        {
            validMagic = true;
        }
        else if (ext.Equals(".png", StringComparison.OrdinalIgnoreCase) &&
                 bytesRead >= 8 &&
                 headerBytes[0] == 0x89 && headerBytes[1] == 0x50 && headerBytes[2] == 0x4E && headerBytes[3] == 0x47 &&
                 headerBytes[4] == 0x0D && headerBytes[5] == 0x0A && headerBytes[6] == 0x1A && headerBytes[7] == 0x0A)
        {
            validMagic = true;
        }
        else if (ext.Equals(".pdf", StringComparison.OrdinalIgnoreCase) &&
                 bytesRead >= 4 &&
                 headerBytes[0] == 0x25 && headerBytes[1] == 0x50 && headerBytes[2] == 0x44 && headerBytes[3] == 0x46)
        {
            validMagic = true;
        }

        if (!validMagic)
        {
            return BadRequest(new { message = "File content signature does not match declared file type." });
        }

        string safeFileName = $"EVIDENCE_{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid().ToString("N")[..8]}{ext.ToLowerInvariant()}";
        string uploadsDir = Path.Combine(_env.ContentRootPath, "App_Data", "uploads");
        Directory.CreateDirectory(uploadsDir);
        string fullPath = Path.Combine(uploadsDir, safeFileName);

        await using (var targetStream = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(targetStream, cancellationToken);
        }

        return Ok(new
        {
            SafeFileName = safeFileName,
            OriginalFileName = Path.GetFileName(file.FileName),
            ContentType = file.ContentType,
            SizeBytes = file.Length,
            SecurityScanStatus = "PassedMagicByteMimeAndExtensionValidation"
        });
    }

    [HttpGet("requests/evidence/{fileName}")]
    [Authorize]
    public ActionResult DownloadEvidence(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName) ||
            fileName.Contains("..", StringComparison.Ordinal) ||
            fileName.Contains('/') ||
            fileName.Contains('\\'))
        {
            return BadRequest(new { message = "Invalid evidence filename." });
        }

        string sanitized = Path.GetFileName(fileName);
        string uploadsDir = Path.Combine(_env.ContentRootPath, "App_Data", "uploads");
        string fullPath = Path.Combine(uploadsDir, sanitized);

        if (!System.IO.File.Exists(fullPath))
        {
            return NotFound(new { message = "Uploaded evidence file not found." });
        }

        string ext = Path.GetExtension(sanitized).ToLowerInvariant();
        string contentType = ext switch
        {
            ".png" => "image/png",
            ".pdf" => "application/pdf",
            _ => "image/jpeg"
        };

        return PhysicalFile(fullPath, contentType);
    }

    [HttpPut("requests/{id:guid}/status")]
    [Authorize(Roles = "EmergencyCoordinator,CaseManager,LogisticsManager,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> UpdateRequestStatus(Guid id, [FromBody] UpdateRequestStatusDto dto, CancellationToken cancellationToken)
    {
        var request = await _unitOfWork.AssistanceRequests.GetByIdAsync(id, cancellationToken);
        if (request == null)
        {
            return NotFound(new { message = "Assistance request not found." });
        }

        var previous = request.Status;
        request.Status = dto.NewStatus;
        if (dto.UpdatedUrgency.HasValue)
        {
            request.FinalApprovedUrgency = dto.UpdatedUrgency.Value;
        }
        if (dto.AssignedCaseManagerId.HasValue)
        {
            request.AssignedCaseManagerId = dto.AssignedCaseManagerId.Value;
        }
        if (dto.AssignedOrganisationId.HasValue)
        {
            request.AssignedOrganisationId = dto.AssignedOrganisationId.Value;
        }

        await _unitOfWork.AssistanceRequests.UpdateAsync(request, cancellationToken);

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : Guid.Empty;
        var actorName = User.FindFirstValue(ClaimTypes.Name) ?? "Coordinator";
        var actorRole = User.FindFirstValue(ClaimTypes.Role) ?? "CaseManager";

        string note = string.IsNullOrWhiteSpace(dto.ActionNote)
            ? $"Status transitioned from {previous} to {dto.NewStatus} by {actorName}."
            : dto.ActionNote;

        await _unitOfWork.RequestHistories.AddAsync(new RequestHistory
        {
            AssistanceRequestId = request.Id,
            PreviousStatus = previous,
            NewStatus = dto.NewStatus,
            ActionDescription = note,
            ChangedByUserId = actorId,
            ChangedByUserName = actorName,
            ChangedByRole = actorRole
        }, cancellationToken);

        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "AssistanceRequest",
            ActionName = $"RequestStatus_{dto.NewStatus}",
            EntityType = nameof(AssistanceRequest),
            EntityId = request.Id.ToString(),
            ActorUserId = actorId == Guid.Empty ? null : actorId,
            ActorUserName = actorName,
            ActorRole = actorRole,
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new { request.ReferenceCode, Previous = previous.ToString(), Next = dto.NewStatus.ToString(), request.AssignedOrganisationId })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _eventPublisher.PublishAsync(new RequestStatusChangedEvent(
            Guid.NewGuid(),
            DateTime.UtcNow,
            request.Id,
            request.CitizenUserId,
            request.ReferenceCode,
            dto.NewStatus.ToString(),
            request.PreferredLanguage,
            note
        ), cancellationToken);

        return Ok(request);
    }

    [HttpPost("requests/merge-duplicate")]
    [Authorize(Roles = "EmergencyCoordinator,CaseManager,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> MergeDuplicateRequest([FromBody] MergeDuplicateRequestDto dto, CancellationToken cancellationToken)
    {
        var primary = await _unitOfWork.AssistanceRequests.GetByIdAsync(dto.PrimaryRequestId, cancellationToken);
        var duplicate = await _unitOfWork.AssistanceRequests.GetByIdAsync(dto.DuplicateRequestId, cancellationToken);

        if (primary == null || duplicate == null)
        {
            return NotFound(new { message = "Primary or duplicate assistance request not found." });
        }

        var prevStatus = duplicate.Status;
        duplicate.Status = RequestStatus.MergedAsDuplicate;
        duplicate.PotentialDuplicateOfRequestId = primary.Id;
        duplicate.IsFlaggedPotentialDuplicate = true;
        await _unitOfWork.AssistanceRequests.UpdateAsync(duplicate, cancellationToken);

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : Guid.Empty;
        var actorName = User.FindFirstValue(ClaimTypes.Name) ?? "Coordinator";
        var actorRole = User.FindFirstValue(ClaimTypes.Role) ?? "CaseManager";

        await _unitOfWork.RequestHistories.AddAsync(new RequestHistory
        {
            AssistanceRequestId = duplicate.Id,
            PreviousStatus = prevStatus,
            NewStatus = RequestStatus.MergedAsDuplicate,
            ActionDescription = $"Merged as duplicate into primary case {primary.ReferenceCode} without record deletion. Justification: {dto.MergeJustification}",
            ChangedByUserId = actorId,
            ChangedByUserName = actorName,
            ChangedByRole = actorRole
        }, cancellationToken);

        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "DuplicateResolution",
            ActionName = "MergeDuplicateWithoutDeletion",
            EntityType = nameof(AssistanceRequest),
            EntityId = duplicate.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = actorName,
            ActorRole = actorRole,
            DetailsJson = JsonSerializer.Serialize(new
            {
                PrimaryRequestId = primary.Id,
                PrimaryReferenceCode = primary.ReferenceCode,
                DuplicateRequestId = duplicate.Id,
                DuplicateReferenceCode = duplicate.ReferenceCode,
                dto.MergeJustification
            })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(new { Primary = primary, MergedDuplicate = duplicate });
    }

    [HttpGet("requests/feedback")]
    [Authorize]
    public async Task<ActionResult<FeedbackAnalyticsSummaryDto>> GetFeedbackAnalytics(CancellationToken cancellationToken)
    {
        var feedbacks = await _unitOfWork.RequestFeedbacks.GetAllAsync(cancellationToken);
        var requests = await _unitOfWork.AssistanceRequests.GetAllAsync(cancellationToken);
        var reqMap = requests.ToDictionary(r => r.Id, r => r);

        int total = feedbacks.Count;
        double avgRating = total > 0 ? Math.Round(feedbacks.Average(f => f.Rating), 2) : 0.0;
        double timelyPct = total > 0 ? Math.Round(feedbacks.Count(f => f.WasAidTimely) * 100.0 / total, 1) : 100.0;
        double sufficientPct = total > 0 ? Math.Round(feedbacks.Count(f => f.WasQuantitySufficient) * 100.0 / total, 1) : 100.0;

        var recent = feedbacks
            .OrderByDescending(f => f.CreatedAtUtc)
            .Take(25)
            .Select(f =>
            {
                reqMap.TryGetValue(f.AssistanceRequestId, out var req);
                return new RequestFeedbackItemDto(
                    f.Id,
                    f.AssistanceRequestId,
                    req?.ReferenceCode ?? "REQ-UNKNOWN",
                    req?.Title ?? "Assistance Request",
                    f.CitizenUserId,
                    f.Rating,
                    f.Comments,
                    f.WasAidTimely,
                    f.WasQuantitySufficient,
                    f.CreatedAtUtc
                );
            })
            .ToList();

        return Ok(new FeedbackAnalyticsSummaryDto(
            total,
            avgRating,
            timelyPct,
            sufficientPct,
            recent
        ));
    }

    [HttpPost("requests/feedback")]
    [Authorize]
    public async Task<ActionResult> SubmitFeedback([FromBody] SubmitFeedbackDto dto, CancellationToken cancellationToken)
    {
        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : Guid.Empty;
        var feedback = new RequestFeedback
        {
            AssistanceRequestId = dto.AssistanceRequestId,
            CitizenUserId = actorId,
            Rating = Math.Clamp(dto.Rating, 1, 5),
            Comments = dto.Comments,
            WasAidTimely = dto.WasAidTimely,
            WasQuantitySufficient = dto.WasQuantitySufficient
        };

        await _unitOfWork.RequestFeedbacks.AddAsync(feedback, cancellationToken);
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "CitizenFeedback",
            ActionName = "CitizenAidFeedback_Submitted",
            EntityType = nameof(RequestFeedback),
            EntityId = feedback.Id.ToString(),
            ActorUserId = actorId == Guid.Empty ? null : actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "Citizen",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "Citizen",
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new
            {
                feedback.AssistanceRequestId,
                feedback.Rating,
                feedback.WasAidTimely,
                feedback.WasQuantitySufficient
            })
        }, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(feedback);
    }

    [HttpDelete("requests/{id:guid}")]
    [Authorize(Roles = "SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> DeleteAssistanceRequest(Guid id, CancellationToken cancellationToken)
    {
        var req = await _unitOfWork.AssistanceRequests.GetByIdAsync(id, cancellationToken);
        if (req == null)
        {
            return NotFound(new { message = "Assistance request not found." });
        }

        var recs = await _unitOfWork.AiRecommendations.FindAsync(a => a.AssistanceRequestId == id, cancellationToken);
        foreach (var rec in recs)
        {
            var decisions = await _unitOfWork.GovernanceDecisions.FindAsync(d => d.AiRecommendationId == rec.Id, cancellationToken);
            foreach (var dec in decisions)
            {
                await _unitOfWork.GovernanceDecisions.DeleteAsync(dec, cancellationToken);
            }
            await _unitOfWork.AiRecommendations.DeleteAsync(rec, cancellationToken);
        }

        var histories = await _unitOfWork.RequestHistories.FindAsync(h => h.AssistanceRequestId == id, cancellationToken);
        foreach (var history in histories)
        {
            await _unitOfWork.RequestHistories.DeleteAsync(history, cancellationToken);
        }

        var feedbacks = await _unitOfWork.RequestFeedbacks.FindAsync(f => f.AssistanceRequestId == id, cancellationToken);
        foreach (var fb in feedbacks)
        {
            await _unitOfWork.RequestFeedbacks.DeleteAsync(fb, cancellationToken);
        }

        var resourceAllocs = await _unitOfWork.ResourceAllocations.FindAsync(a => a.AssistanceRequestId == id, cancellationToken);
        var allocIds = resourceAllocs.Select(a => a.Id).ToHashSet();
        if (allocIds.Count > 0)
        {
            var dispatches = await _unitOfWork.DispatchRecords.FindAsync(d => allocIds.Contains(d.ResourceAllocationId), cancellationToken);
            foreach (var disp in dispatches)
            {
                await _unitOfWork.DispatchRecords.DeleteAsync(disp, cancellationToken);
            }
        }
        foreach (var alloc in resourceAllocs)
        {
            await _unitOfWork.ResourceAllocations.DeleteAsync(alloc, cancellationToken);
        }

        var shelterAllocs = await _unitOfWork.ShelterAllocations.FindAsync(s => s.AssistanceRequestId == id, cancellationToken);
        foreach (var sAlloc in shelterAllocs)
        {
            sAlloc.AssistanceRequestId = null;
            await _unitOfWork.ShelterAllocations.UpdateAsync(sAlloc, cancellationToken);
        }

        var volAssignments = await _unitOfWork.VolunteerAssignments.FindAsync(v => v.AssistanceRequestId == id, cancellationToken);
        foreach (var vAssign in volAssignments)
        {
            vAssign.AssistanceRequestId = null;
            await _unitOfWork.VolunteerAssignments.UpdateAsync(vAssign, cancellationToken);
        }

        await _unitOfWork.AssistanceRequests.DeleteAsync(req, cancellationToken);

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "RequestManagement",
            ActionName = "Admin_DeletedRequest",
            EntityType = nameof(AssistanceRequest),
            EntityId = req.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "SystemAdmin",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "SystemAdmin",
            DetailsJson = JsonSerializer.Serialize(new { req.ReferenceCode, req.Title })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(new { deletedRequestId = id });
    }
}
