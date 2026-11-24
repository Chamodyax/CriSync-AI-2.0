using ReliefCoord.Application.DTOs;
using ReliefCoord.Application.Interfaces;
using ReliefCoord.Domain.Entities;
using ReliefCoord.Domain.Enums;

namespace ReliefCoord.Infrastructure.ExternalServices;

public class PrimaryEnsembleAiService : IAiDecisionSupportService
{
    private readonly IMappingProviderService _mappingService;

    public PrimaryEnsembleAiService(IMappingProviderService mappingService)
    {
        _mappingService = mappingService;
    }

    public string ProviderName => "AI-Priority-Classifier";

    public Task<AiRequestEvaluationResult> EvaluateAssistanceRequestAsync(
        AssistanceRequest request,
        IReadOnlyList<AssistanceRequest> existingOpenRequests,
        CancellationToken cancellationToken = default)
    {
        string combinedText = $"{request.Title} {request.Description}".ToLowerInvariant();

        RequestCategory suggestedCategory = request.Category;
        if (combinedText.Contains("insulin") || combinedText.Contains("medicine") || combinedText.Contains("dialysis") || combinedText.Contains("oxygen") || combinedText.Contains("injured"))
        {
            suggestedCategory = RequestCategory.Medicine;
        }
        else if (combinedText.Contains("trapped") || combinedText.Contains("roof") || combinedText.Contains("rescue") || combinedText.Contains("submerged"))
        {
            suggestedCategory = RequestCategory.SearchAndRescue;
        }
        else if (combinedText.Contains("shelter") || combinedText.Contains("evacuate") || combinedText.Contains("displaced") || combinedText.Contains("tent"))
        {
            suggestedCategory = RequestCategory.TemporaryShelter;
        }
        else if (combinedText.Contains("wheelchair") || combinedText.Contains("disabled") || combinedText.Contains("blind") || combinedText.Contains("mobility"))
        {
            suggestedCategory = RequestCategory.AccessibilityAssistance;
        }
        else if (combinedText.Contains("water") || combinedText.Contains("drinking") || combinedText.Contains("hygiene"))
        {
            suggestedCategory = RequestCategory.WaterAndSanitation;
        }
        else if (combinedText.Contains("food") || combinedText.Contains("rice") || combinedText.Contains("infant") || combinedText.Contains("milk"))
        {
            suggestedCategory = RequestCategory.Food;
        }

        double medicalRiskSignal = (combinedText.Contains("insulin") || combinedText.Contains("oxygen") || combinedText.Contains("trapped") || combinedText.Contains("bleeding") || combinedText.Contains("pregnant")) ? 32.0 : 10.0;
        double demographicVulnerability = Math.Min(25.0, (request.AffectedPeopleCount * 1.8) + (request.RequiresAccessibilitySupport ? 11.0 : 0.0));
        double selfUrgencyWeight = (int)request.SelfReportedUrgency * 6.5;
        double categoryBaseWeight = suggestedCategory is RequestCategory.SearchAndRescue or RequestCategory.MedicalEvacuation or RequestCategory.Medicine ? 18.0 : 11.0;

        double rawScore = Math.Min(99.4, Math.Round(medicalRiskSignal + demographicVulnerability + selfUrgencyWeight + categoryBaseWeight, 1));

        UrgencyLevel suggestedUrgency = rawScore switch
        {
            >= 86.0 => UrgencyLevel.LifeThreatening,
            >= 72.0 => UrgencyLevel.Critical,
            >= 55.0 => UrgencyLevel.High,
            >= 38.0 => UrgencyLevel.Medium,
            _ => UrgencyLevel.Low
        };

        bool isDuplicate = false;
        Guid? duplicateOfId = null;
        double highestSim = 0.0;

        foreach (var existing in existingOpenRequests.Where(e => e.Id != request.Id))
        {
            double textSim = ComputeJaccardSimilarity(combinedText, $"{existing.Title} {existing.Description}".ToLowerInvariant());
            double distKm = _mappingService.CalculateDistanceKm(request.Latitude, request.Longitude, existing.Latitude, existing.Longitude);
            double geoSim = distKm < 0.5 ? 1.0 : (distKm < 2.0 ? 0.75 : 0.0);
            double categoryMatch = existing.Category == request.Category ? 1.0 : 0.3;

            double compositeSim = Math.Round((textSim * 0.55) + (geoSim * 0.30) + (categoryMatch * 0.15), 2);
            if (compositeSim > highestSim)
            {
                highestSim = compositeSim;
                if (compositeSim >= 0.68)
                {
                    isDuplicate = true;
                    duplicateOfId = existing.Id;
                }
            }
        }

        bool isSuspicious = false;
        string suspiciousReason = string.Empty;
        if (request.RequestedQuantity > 500 && request.AffectedPeopleCount < 5)
        {
            isSuspicious = true;
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
