using System.Security.Cryptography;
using System.Text.Json;
using ReliefCoord.Application.DTOs;
using ReliefCoord.Application.Interfaces;
using ReliefCoord.Application.Strategies;
using ReliefCoord.Domain.Entities;
using ReliefCoord.Domain.Enums;
using ReliefCoord.Domain.Events;

namespace ReliefCoord.Application.Services;

public class HumanitarianOperationsService
{
    private static readonly SemaphoreSlim ShelterAllocationLock = new(1, 1);

    private readonly IUnitOfWork _unitOfWork;
    private readonly IAiProviderFactory _aiProviderFactory;
    private readonly IMappingProviderService _mappingService;
    private readonly INotificationChannelFactory _notificationFactory;
    private readonly IDomainEventPublisher _eventPublisher;
    private readonly ResourceAllocationStrategyResolver _strategyResolver;
    private readonly IGovernanceConfigProvider? _governanceConfigProvider;

    public HumanitarianOperationsService(
        IUnitOfWork unitOfWork,
        IAiProviderFactory aiProviderFactory,
        IMappingProviderService mappingService,
        INotificationChannelFactory notificationFactory,
        IDomainEventPublisher eventPublisher,
        ResourceAllocationStrategyResolver strategyResolver,
        IGovernanceConfigProvider? governanceConfigProvider = null)
    {
        _unitOfWork = unitOfWork;
        _aiProviderFactory = aiProviderFactory;
        _mappingService = mappingService;
        _notificationFactory = notificationFactory;
        _eventPublisher = eventPublisher;
        _strategyResolver = strategyResolver;
        _governanceConfigProvider = governanceConfigProvider;
    }

    public static (string Hash, string Salt) HashPassword(string password)
    {
        byte[] saltBytes = RandomNumberGenerator.GetBytes(16);
        byte[] keyBytes = Rfc2898DeriveBytes.Pbkdf2(
            password,
            saltBytes,
            100_000,
            HashAlgorithmName.SHA256,
            32);
        string hash = Convert.ToBase64String(keyBytes);
        string salt = Convert.ToBase64String(saltBytes);
        return (hash, salt);
    }

    public static bool VerifyPassword(string password, string storedHash, string storedSalt)
    {
        if (string.IsNullOrWhiteSpace(storedHash) || string.IsNullOrWhiteSpace(storedSalt))
        {
            return false;
        }

        if (storedHash.StartsWith("PBKDF2$", StringComparison.Ordinal))
        {
            string[] parts = storedHash.Split('$');
            if (parts.Length != 3 || !int.TryParse(parts[1], out int iterations))
            {
                return false;
            }

            try
            {
                byte[] saltBytes = Convert.FromBase64String(storedSalt);
                byte[] expectedBytes = Convert.FromBase64String(parts[2]);
                byte[] computedBytes = Rfc2898DeriveBytes.Pbkdf2(
                    password,
                    saltBytes,
                    iterations,
                    HashAlgorithmName.SHA256,
                    expectedBytes.Length);
                return CryptographicOperations.FixedTimeEquals(computedBytes, expectedBytes);
            }
            catch
            {
                return false;
            }
        }

        try
        {
            byte[] combinedBytes = System.Text.Encoding.UTF8.GetBytes(password + storedSalt);
            byte[] computedLegacyBytes = SHA256.HashData(combinedBytes);
            byte[] expectedLegacyBytes = Convert.FromBase64String(storedHash);
            return CryptographicOperations.FixedTimeEquals(computedLegacyBytes, expectedLegacyBytes);
        }
        catch
        {
            return false;
        }
    }

    public async Task<AssistanceRequest> SubmitAssistanceRequestAsync(
        Guid citizenUserId,
        string citizenName,
        CreateAssistanceRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(dto.IdempotencyKey))
        {
            var existingByIdempotency = await _unitOfWork.AssistanceRequests.FindAsync(
                r => r.IdempotencyKey == dto.IdempotencyKey && r.CitizenUserId == citizenUserId,
                cancellationToken);
            if (existingByIdempotency.Any())
            {
                return existingByIdempotency.First();
            }
        }

        var existingOpenRequests = await _unitOfWork.AssistanceRequests.FindAsync(
            r => r.CrisisEventId == dto.CrisisEventId &&
                 r.Status != RequestStatus.Closed &&
                 r.Status != RequestStatus.Rejected,
            cancellationToken);

        var request = new AssistanceRequest
        {
            ReferenceCode = $"REQ-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}",
            CitizenUserId = citizenUserId,
            CrisisEventId = dto.CrisisEventId,
            Category = dto.Category,
            SelfReportedUrgency = dto.SelfReportedUrgency,
            FinalApprovedUrgency = dto.SelfReportedUrgency,
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim(),
            AffectedPeopleCount = Math.Max(1, dto.AffectedPeopleCount),
            RequestedQuantity = Math.Max(1, dto.RequestedQuantity),
            RequiresAccessibilitySupport = dto.RequiresAccessibilitySupport,
            LocationAddress = dto.LocationAddress,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            SupportingEvidenceFileName = dto.SupportingEvidenceFileName,
            SupportingEvidenceMimeType = dto.SupportingEvidenceMimeType,
            Status = RequestStatus.PendingAiReview,
            PreferredLanguage = string.IsNullOrWhiteSpace(dto.PreferredLanguage) ? "en" : dto.PreferredLanguage,
            IdempotencyKey = string.IsNullOrWhiteSpace(dto.IdempotencyKey) ? Guid.NewGuid().ToString("N") : dto.IdempotencyKey
        };

        var aiProvider = _aiProviderFactory.CreateProvider();
        var evaluation = await aiProvider.EvaluateAssistanceRequestAsync(request, existingOpenRequests, cancellationToken);

        request.PriorityScore = evaluation.PriorityScore;
        request.IsFlaggedPotentialDuplicate = evaluation.IsPotentialDuplicate;
        request.PotentialDuplicateOfRequestId = evaluation.DuplicateOfRequestId;
        request.DuplicateSimilarityScore = evaluation.DuplicateSimilarityScore;
        request.IsFlaggedSuspicious = evaluation.IsSuspicious;
        request.SuspiciousReason = evaluation.SuspiciousReason;

        var recommendation = new AiRecommendation
        {
            AssistanceRequestId = request.Id,
            CrisisEventId = request.CrisisEventId,
            RecommendationType = AiRecommendationType.UrgencyScoring,
            ModelIdentifier = evaluation.ProviderUsed,
            RecommendedCategory = evaluation.SuggestedCategory.ToString(),
            RecommendedUrgency = evaluation.SuggestedUrgency,
            RecommendedPriorityScore = evaluation.PriorityScore,
            ConfidenceScore = evaluation.ConfidenceScore,
            Rationale = evaluation.Rationale,
            ExplainableFactorsJson = JsonSerializer.Serialize(evaluation.FeatureWeights),
            SuggestedPayloadJson = JsonSerializer.Serialize(new
            {
                evaluation.SuggestedCategory,
                evaluation.SuggestedUrgency,
                evaluation.IsPotentialDuplicate,
                evaluation.DuplicateOfRequestId,
                evaluation.DuplicateSimilarityScore,
                evaluation.IsSuspicious,
                evaluation.SuspiciousReason
            }),
            GovernanceStatus = GovernanceDecisionStatus.PendingReview
        };

        var history = new RequestHistory
        {
            AssistanceRequestId = request.Id,
            PreviousStatus = RequestStatus.Submitted,
            NewStatus = RequestStatus.PendingAiReview,
            ActionDescription = $"Request submitted by {citizenName}. AI scored priority {evaluation.PriorityScore:F1} (Confidence {evaluation.ConfidenceScore * 100:F0}%). Waiting for authorised human coordinator review.",
            ChangedByUserId = citizenUserId,
            ChangedByUserName = citizenName,
            ChangedByRole = UserRole.Citizen.ToString()
        };

        await _unitOfWork.AssistanceRequests.AddAsync(request, cancellationToken);
        await _unitOfWork.AiRecommendations.AddAsync(recommendation, cancellationToken);
        await _unitOfWork.RequestHistories.AddAsync(history, cancellationToken);

        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "AssistanceRequest",
            ActionName = "RequestSubmittedWithAiAssessment",
            EntityType = nameof(AssistanceRequest),
            EntityId = request.Id.ToString(),
            ActorUserId = citizenUserId,
            ActorUserName = citizenName,
            ActorRole = UserRole.Citizen.ToString(),
            DetailsJson = JsonSerializer.Serialize(new
            {
                request.ReferenceCode,
                evaluation.PriorityScore,
                evaluation.ConfidenceScore,
                evaluation.IsPotentialDuplicate,
                evaluation.DuplicateSimilarityScore,
                evaluation.ProviderUsed
            })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _eventPublisher.PublishAsync(new AssistanceRequestSubmittedEvent(
            Guid.NewGuid(),
            DateTime.UtcNow,
            request.Id,
            citizenUserId,
            request.ReferenceCode,
            request.PreferredLanguage
        ), cancellationToken);

        request.Timeline = new List<RequestHistory> { history };
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
