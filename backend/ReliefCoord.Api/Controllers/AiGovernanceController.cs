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
