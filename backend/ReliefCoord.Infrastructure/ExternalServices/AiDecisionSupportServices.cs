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
        CancellationToken cancellationToken = default)
    {
        string normalizedSkill = requiredSkill.Trim().ToLowerInvariant();
        var list = volunteers
            .Where(v => v.IsAvailable && v.IsVerified)
            .Select(v =>
            {
                bool hasSkill = v.SkillsCsv.ToLowerInvariant().Contains(normalizedSkill);
                double dist = _mappingService.CalculateDistanceKm(targetLat, targetLon, v.CurrentLatitude, v.CurrentLongitude);
                double score = Math.Round((hasSkill ? 60.0 : 20.0) + Math.Max(0, 40.0 - dist * 0.8), 1);

                return new AiVolunteerCandidateDto(
                    v.Id,
                    v.FullName,
                    v.SkillsCsv,
                    Math.Round(dist, 2),
                    score,
                    hasSkill
                        ? $"Verified match for '{requiredSkill}' ({dist:F1} km away, {v.CompletedTasksCount} prior deployments)."
                        : $"General responder available ({dist:F1} km away)."
                );
            })
            .OrderByDescending(x => x.MatchScore)
            .ToList();

        return Task.FromResult<IReadOnlyList<AiVolunteerCandidateDto>>(list);
    }

    public Task<IReadOnlyList<DemandForecastItemDto>> ForecastResourceDemandAsync(
        Guid crisisEventId,
        IReadOnlyList<AssistanceRequest> recentRequests,
        IReadOnlyList<ResourceItem> currentInventory,
        CancellationToken cancellationToken = default)
    {
        var categories = Enum.GetValues<RequestCategory>();
        var forecasts = new List<DemandForecastItemDto>();

        foreach (var cat in categories)
        {
            var catRequests = recentRequests.Where(r => r.Category == cat).ToList();
            int currentRequested = catRequests.Sum(r => r.RequestedQuantity);
            int predicted48h = Math.Max(120, (int)Math.Round(currentRequested * 1.65 + (catRequests.Count * 28)));
            int availableStock = currentInventory.Where(i => i.Category == cat).Sum(i => i.AvailableQuantity);
            int deficit = Math.Max(0, predicted48h - availableStock);
            string risk = deficit > 100 ? "CriticalShortageProjected" : (deficit > 0 ? "ModerateDeficitRisk" : "AdequateBuffer");

            forecasts.Add(new DemandForecastItemDto(
                cat.ToString(),
                catRequests.Count,
                currentRequested,
                predicted48h,
                availableStock,
                deficit,
                risk,
                0.87
            ));
        }

        return Task.FromResult<IReadOnlyList<DemandForecastItemDto>>(
            forecasts.OrderByDescending(f => f.ProjectedDeficit).ToList());
    }

    public Task<MultilingualBriefingDto> GenerateMultilingualBriefingAsync(
        CrisisEvent crisis,
        int openRequestsCount,
        int criticalCount,
        string languageCode,
        CancellationToken cancellationToken = default)
    {
        string lang = (languageCode ?? "en").ToLowerInvariant();
        var (langName, headline, summary, advisory) = lang switch
        {
            "si" => (
                "Sinhala (සිංහල)",
                $"හදිසි ආපදා මෙහෙයුම් වාර්තාව: {crisis.Title}",
                $"දැනට විවෘත ඉල්ලීම් {openRequestsCount} ක් සහ අතිශය තීරණාත්මක අවස්ථා {criticalCount} ක් ක්‍රියාත්මක වේ. සියලුම AI නිර්දේශ බලයලත් නිලධාරීන්ගේ අනුමැතියට යටත් වේ.",
                "කරුණාකර අනුමත ආරක්ෂිත මධ්‍යස්ථාන වෙත යොමු වන්න. හදිසි ආහාර සහ වෛද්‍ය ආධාර බෙදාහැරීම අඛණ්ඩව සිදු කෙරේ."
            ),
            "ta" => (
                "Tamil (தமிழ்)",
                $"அவசர பேரிடர் செயல்பாட்டு அறிக்கை: {crisis.Title}",
                $"தற்போது {openRequestsCount} திறந்த கோரிக்கைகளும் {criticalCount} அதிமுக்கிய வழக்குகளும் உள்ளன. அனைத்து AI பரிந்துரைகளும் மனித மேற்பார்வைக்கு உட்பட்டவை.",
                "அங்கீகரிக்கப்பட்ட பாதுகாப்பான முகாம்களுக்குச் செல்லவும். மருத்துவ மற்றும் உணவு நிவாரணப் பணிகள் நடைபெற்று வருகின்றன."
            ),
            "es" => (
                "Spanish (Español)",
                $"Informe Operativo de Crisis: {crisis.Title}",
                $"Se registran {openRequestsCount} solicitudes activas y {criticalCount} casos críticos en {crisis.Region}. Todas las asignaciones críticas requieren supervisión humana.",
                "Diríjase a los refugios verificados más cercanos y mantenga activas las alertas oficiales."
            ),
            "fr" => (
                "French (Français)",
                $"Bulletin Opérationnel de Crise : {crisis.Title}",
                $"Il y a actuellement {openRequestsCount} demandes ouvertes dont {criticalCount} cas critiques dans la région de {crisis.Region}.",
                "Veuillez rejoindre les centres d'hébergement vérifiés et suivre les consignes d'évacuation."
            ),
            "ar" => (
                "Arabic (العربية)",
                $"موجز العمليات الإنسانية الطارئة: {crisis.Title}",
                $"يوجد حالياً {openRequestsCount} طلباً مفتوحاً و {criticalCount} حالة حرجة. تخضع جميع توصيات الذكاء الاصطناعي لمراجعة المنسقين المعتمدين.",
                "يرجى التوجه إلى مراكز الإيواء المعتمدة واتباع إرشادات السلامة الرسمية."
            ),
            _ => (
                "English",
                $"Operational Crisis Briefing: {crisis.Title} ({crisis.Severity})",
                $"Active multi-agency response across {crisis.Region}, {crisis.Country}. Tracking {openRequestsCount} open assistance cases including {criticalCount} Critical/Life-Threatening priorities under strict Human-in-the-Loop governance.",
                "Citizens in affected flood and landslide zones should proceed to verified accessible shelters and monitor SMS/In-App advisories."
            )
        };

        return Task.FromResult(new MultilingualBriefingDto(
            crisis.Id,
            lang,
            langName,
            headline,
            summary,
            advisory,
            ProviderName
        ));
    }

    private static double ComputeJaccardSimilarity(string textA, string textB)
    {
        var tokensA = textA.Split(new[] { ' ', ',', '.', ';', '-', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length > 2)
            .ToHashSet();
        var tokensB = textB.Split(new[] { ' ', ',', '.', ';', '-', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length > 2)
            .ToHashSet();

        if (!tokensA.Any() || !tokensB.Any())
        {
            return 0.0;
        }

        int intersection = tokensA.Intersect(tokensB).Count();
        int union = tokensA.Union(tokensB).Count();
        return union == 0 ? 0.0 : (double)intersection / union;
    }
}

public class FallbackHeuristicAiService : IAiDecisionSupportService
{
    private readonly PrimaryEnsembleAiService _innerRuleEngine;

    public FallbackHeuristicAiService(IMappingProviderService mappingService)
    {
        _innerRuleEngine = new PrimaryEnsembleAiService(mappingService);
    }

    public string ProviderName => "ResilientLocalHeuristicFallback-v1.0";

    public async Task<AiRequestEvaluationResult> EvaluateAssistanceRequestAsync(
        AssistanceRequest request,
        IReadOnlyList<AssistanceRequest> existingOpenRequests,
        CancellationToken cancellationToken = default)
    {
        var baseEval = await _innerRuleEngine.EvaluateAssistanceRequestAsync(request, existingOpenRequests, cancellationToken);
        return baseEval with
        {
            ConfidenceScore = 0.74,
            Rationale = $"[FALLBACK MODE ACTIVE - External AI Service Unreachable] Deterministic rule evaluation completed. {baseEval.Rationale}",
            ProviderUsed = ProviderName
        };
    }

    public Task<IReadOnlyList<AiResourceCandidateDto>> RecommendResourcesForRequestAsync(
        AssistanceRequest request,
        IReadOnlyList<ResourceItem> availableResources,
        CancellationToken cancellationToken = default)
        => _innerRuleEngine.RecommendResourcesForRequestAsync(request, availableResources, cancellationToken);

    public Task<IReadOnlyList<AiShelterCandidateDto>> RecommendSheltersForRequestAsync(
        AssistanceRequest request,
        IReadOnlyList<Shelter> shelters,
        CancellationToken cancellationToken = default)
        => _innerRuleEngine.RecommendSheltersForRequestAsync(request, shelters, cancellationToken);

    public Task<IReadOnlyList<AiVolunteerCandidateDto>> RecommendVolunteersForTaskAsync(
        string requiredSkill,
        double targetLat,
        double targetLon,
        IReadOnlyList<VolunteerProfile> volunteers,
        CancellationToken cancellationToken = default)
        => _innerRuleEngine.RecommendVolunteersForTaskAsync(requiredSkill, targetLat, targetLon, volunteers, cancellationToken);

    public Task<IReadOnlyList<DemandForecastItemDto>> ForecastResourceDemandAsync(
        Guid crisisEventId,
        IReadOnlyList<AssistanceRequest> recentRequests,
        IReadOnlyList<ResourceItem> currentInventory,
        CancellationToken cancellationToken = default)
        => _innerRuleEngine.ForecastResourceDemandAsync(crisisEventId, recentRequests, currentInventory, cancellationToken);

    public async Task<MultilingualBriefingDto> GenerateMultilingualBriefingAsync(
        CrisisEvent crisis,
        int openRequestsCount,
        int criticalCount,
        string languageCode,
        CancellationToken cancellationToken = default)
    {
        var briefing = await _innerRuleEngine.GenerateMultilingualBriefingAsync(crisis, openRequestsCount, criticalCount, languageCode, cancellationToken);
        return briefing with { GeneratedByProvider = ProviderName };
    }
}

public class AiProviderFactory : IAiProviderFactory
{
    private readonly IServiceResilienceMonitor _resilienceMonitor;
    private readonly IMappingProviderService _mappingService;

    public AiProviderFactory(IServiceResilienceMonitor resilienceMonitor, IMappingProviderService mappingService)
    {
        _resilienceMonitor = resilienceMonitor;
        _mappingService = mappingService;
    }

    public IAiDecisionSupportService CreateProvider(bool forceFallback = false)
    {
        if (forceFallback || _resilienceMonitor.SimulateExternalAiFailure)
        {
            _resilienceMonitor.RecordTrip("AI");
            return new FallbackHeuristicAiService(_mappingService);
        }

        return new PrimaryEnsembleAiService(_mappingService);
    }
}
