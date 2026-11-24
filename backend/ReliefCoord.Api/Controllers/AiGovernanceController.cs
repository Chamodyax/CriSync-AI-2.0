using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReliefCoord.Application.DTOs;
using ReliefCoord.Application.Interfaces;
using ReliefCoord.Application.Services;
using ReliefCoord.Domain.Enums;

namespace ReliefCoord.Api.Controllers;

[ApiController]
[Route("api/ai-governance")]
public class AiGovernanceController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly HumanitarianOperationsService _opsService;
    private readonly IAiProviderFactory _aiProviderFactory;

    public AiGovernanceController(
        IUnitOfWork unitOfWork,
        HumanitarianOperationsService opsService,
        IAiProviderFactory aiProviderFactory)
    {
        _unitOfWork = unitOfWork;
        _opsService = opsService;
        _aiProviderFactory = aiProviderFactory;
    }

    [HttpGet("recommendations")]
    [AllowAnonymous]
    public async Task<ActionResult> GetRecommendations(CancellationToken cancellationToken)
    {
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

        return Ok(recommendations);
    }

    [HttpGet("decisions")]
    [AllowAnonymous]
    public async Task<ActionResult> GetHumanGovernanceDecisions(CancellationToken cancellationToken)
    {
        var decisions = await _unitOfWork.GovernanceDecisions.GetAllAsync(cancellationToken);
        return Ok(decisions);
    }

    [HttpPost("review")]
    [Authorize(Roles = "EmergencyCoordinator,CaseManager,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> ReviewRecommendation([FromBody] ReviewAiRecommendationDto dto, CancellationToken cancellationToken)
    {
        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : Guid.Empty;
        var actorName = User.FindFirstValue(ClaimTypes.Name) ?? "Authorised Coordinator";
        var roleStr = User.FindFirstValue(ClaimTypes.Role) ?? "EmergencyCoordinator";
        Enum.TryParse<UserRole>(roleStr, out var actorRole);

        var decision = await _opsService.ReviewAiRecommendationAsync(
            actorId,
            actorName,
            actorRole,
            dto,
            cancellationToken);

        return Ok(decision);
    }

    [HttpGet("demand-forecast/{crisisEventId:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult> GetDemandForecast(Guid crisisEventId, CancellationToken cancellationToken)
    {
        var requests = await _unitOfWork.AssistanceRequests.FindAsync(r => r.CrisisEventId == crisisEventId, cancellationToken);
        var inventory = await _unitOfWork.Resources.GetAllAsync(cancellationToken);
        var aiService = _aiProviderFactory.CreateProvider();
        var forecast = await aiService.ForecastResourceDemandAsync(crisisEventId, requests, inventory, cancellationToken);
        return Ok(forecast);
    }

    [HttpGet("multilingual-briefing/{crisisEventId:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult> GetMultilingualBriefing(
        Guid crisisEventId,
        [FromQuery] string lang = "en",
        CancellationToken cancellationToken = default)
    {
        var crisis = await _unitOfWork.CrisisEvents.GetByIdAsync(crisisEventId, cancellationToken);
        if (crisis == null)
        {
            var allCrises = await _unitOfWork.CrisisEvents.GetAllAsync(cancellationToken);
            crisis = allCrises.FirstOrDefault();
            if (crisis == null)
            {
                return NotFound(new { message = "No crisis events found." });
            }
        }

        var requests = await _unitOfWork.AssistanceRequests.FindAsync(r => r.CrisisEventId == crisis.Id, cancellationToken);
        int openCount = requests.Count(r => r.Status != RequestStatus.Closed && r.Status != RequestStatus.Fulfilled);
        int criticalCount = requests.Count(r => r.FinalApprovedUrgency >= UrgencyLevel.Critical);

        var aiService = _aiProviderFactory.CreateProvider();
        var briefing = await aiService.GenerateMultilingualBriefingAsync(crisis, openCount, criticalCount, lang, cancellationToken);
        return Ok(briefing);
    }
}
