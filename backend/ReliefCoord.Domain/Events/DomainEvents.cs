namespace ReliefCoord.Domain.Events;

public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredAtUtc { get; }
    string EventType { get; }
}

public record AssistanceRequestSubmittedEvent(
    Guid EventId,
    DateTime OccurredAtUtc,
    Guid RequestId,
    Guid CitizenUserId,
    string ReferenceCode,
    string PreferredLanguage
) : IDomainEvent
{
    public string EventType => nameof(AssistanceRequestSubmittedEvent);
}

public record AiRecommendationReviewedEvent(
    Guid EventId,
    DateTime OccurredAtUtc,
    Guid RecommendationId,
    Guid? RequestId,
    string ActionTaken,
    Guid ReviewerUserId,
    string ReviewerName
) : IDomainEvent
{
    public string EventType => nameof(AiRecommendationReviewedEvent);
}

public record ResourceAllocatedEvent(
    Guid EventId,
    DateTime OccurredAtUtc,
    Guid AllocationId,
    Guid RequestId,
    Guid CitizenUserId,
    string ResourceName,
    int AllocatedQuantity,
    bool IsPartialShortage
) : IDomainEvent
{
    public string EventType => nameof(ResourceAllocatedEvent);
}

public record ShelterAllocatedEvent(
    Guid EventId,
    DateTime OccurredAtUtc,
    Guid ShelterId,
    string ShelterName,
    Guid CitizenUserId,
    int AllocatedMembersCount
) : IDomainEvent
{

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
