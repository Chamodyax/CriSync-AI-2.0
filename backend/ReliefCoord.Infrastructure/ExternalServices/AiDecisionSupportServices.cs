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
            suspiciousReason = $"Disproportionate quantity anomaly: {request.RequestedQuantity} units requested for a household of {request.AffectedPeopleCount}. Flagged for human coordinator verification.";
        }
        else if (combinedText.Contains("test spam") || combinedText.Contains("crypto") || combinedText.Contains("wire transfer"))
        {
            isSuspicious = true;
            suspiciousReason = "Lexical fraud indicator detected in request description.";
        }

        var featureWeights = new Dictionary<string, double>
        {
            ["MedicalKeywordScore"] = Math.Round(medicalRiskSignal, 1),
            ["PeopleCountScore"] = Math.Round(demographicVulnerability, 1),
            ["UserUrgencyScore"] = Math.Round(selfUrgencyWeight, 1),
            ["CategoryBaseScore"] = Math.Round(categoryBaseWeight, 1)
        };

        string duplicateClause = isDuplicate
            ? $" Possible duplicate found ({highestSim * 100:F0}% match with existing request; kept for coordinator check)."
            : " No duplicate found.";

        string rationale = $"Suggested category: {suggestedCategory}, Urgency: {suggestedUrgency} (Score {rawScore}/100) based on description keywords and {request.AffectedPeopleCount} affected people.{duplicateClause}";

        return Task.FromResult(new AiRequestEvaluationResult(
            suggestedCategory,
            suggestedUrgency,
            rawScore,
            0.91,
            rationale,
            featureWeights,
            isDuplicate,
            duplicateOfId,
            highestSim,
            isSuspicious,
            suspiciousReason,
            ProviderName
        ));
    }

    public Task<IReadOnlyList<AiResourceCandidateDto>> RecommendResourcesForRequestAsync(
        AssistanceRequest request,
        IReadOnlyList<ResourceItem> availableResources,
        CancellationToken cancellationToken = default)
    {
        var results = availableResources
            .Where(r => r.Category == request.Category && r.AvailableQuantity > 0)
            .Select(r =>
            {
                double dist = _mappingService.CalculateDistanceKm(request.Latitude, request.Longitude, r.WarehouseLatitude, r.WarehouseLongitude);
                int daysToExpiry = r.ExpiryDateUtc.HasValue
                    ? Math.Max(1, (int)(r.ExpiryDateUtc.Value - DateTime.UtcNow).TotalDays)
                    : 365;
                double proxScore = Math.Max(0, 100 - dist * 1.5);
                double stockScore = Math.Min(100, (r.AvailableQuantity / (double)Math.Max(1, request.RequestedQuantity)) * 100);
                double coldScore = r.SupportsColdChain ? 100 : 75;
                double totalScore = Math.Round((proxScore * 0.45) + (stockScore * 0.35) + (coldScore * 0.20), 1);

                return new AiResourceCandidateDto(
                    r.Id,
                    r.Name,
                    r.WarehouseName,
                    r.AvailableQuantity,
                    Math.Round(dist, 2),
                    totalScore,
                    $"Proximity={proxScore:F0}%, StockAdequacy={stockScore:F0}%, ColdChain={r.SupportsColdChain}",
                    r.SupportsColdChain,
                    daysToExpiry
                );
            })
            .OrderByDescending(c => c.MultiConstraintScore)
            .ToList();

        return Task.FromResult<IReadOnlyList<AiResourceCandidateDto>>(results);
    }

    public Task<IReadOnlyList<AiShelterCandidateDto>> RecommendSheltersForRequestAsync(
        AssistanceRequest request,
        IReadOnlyList<Shelter> shelters,
        CancellationToken cancellationToken = default)
    {
        var candidates = shelters
            .Where(s => s.TotalCapacity - s.CurrentOccupancy >= request.AffectedPeopleCount)
            .Where(s => !request.RequiresAccessibilitySupport || s.IsWheelchairAccessible)
            .Select(s =>
            {
                int avail = s.TotalCapacity - s.CurrentOccupancy;
                double dist = _mappingService.CalculateDistanceKm(request.Latitude, request.Longitude, s.Latitude, s.Longitude);
                double score = Math.Round(
                    Math.Max(0, 100 - dist * 1.8) * 0.5 +
                    (s.HasMedicalFacility ? 25 : 10) +
                    (s.IsWheelchairAccessible ? 25 : 10), 1);

                return new AiShelterCandidateDto(
                    s.Id,
                    s.Name,
                    s.Address,
                    avail,
                    Math.Round(dist, 2),
                    score,
                    s.IsWheelchairAccessible,
                    s.HasMedicalFacility,
                    $"Has {avail} open beds ({dist:F1} km away). Accessibility={s.IsWheelchairAccessible}, MedicalUnit={s.HasMedicalFacility}."
                );
            })
            .OrderByDescending(c => c.SuitabilityScore)
            .ToList();

        return Task.FromResult<IReadOnlyList<AiShelterCandidateDto>>(candidates);
    }

    public Task<IReadOnlyList<AiVolunteerCandidateDto>> RecommendVolunteersForTaskAsync(
        string requiredSkill,
        double targetLat,
        double targetLon,
        IReadOnlyList<VolunteerProfile> volunteers,
    }
}
