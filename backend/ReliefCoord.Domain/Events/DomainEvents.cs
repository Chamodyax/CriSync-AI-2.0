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
    public string EventType => nameof(ShelterAllocatedEvent);
}

public record ResourceShortageDetectedEvent(
    Guid EventId,
    DateTime OccurredAtUtc,
    Guid ResourceItemId,
    string ResourceName,
    int AvailableQuantity,
    int TotalCompetingDemand
) : IDomainEvent
{
    public string EventType => nameof(ResourceShortageDetectedEvent);
}

public record RequestStatusChangedEvent(
    Guid EventId,
    DateTime OccurredAtUtc,
    Guid RequestId,
    Guid CitizenUserId,
    string ReferenceCode,
    string NewStatus,
    string PreferredLanguage,
    string Note
) : IDomainEvent
{
    public string EventType => nameof(RequestStatusChangedEvent);
}

public record VolunteerAssignedEvent(
    Guid EventId,
    DateTime OccurredAtUtc,
    Guid AssignmentId,
    Guid VolunteerUserId,
    string VolunteerName,
    string TaskTitle
) : IDomainEvent
{
    public string EventType => nameof(VolunteerAssignedEvent);
}

public record PublicAlertBroadcastEvent(
    Guid EventId,
    DateTime OccurredAtUtc,
    Guid AlertId,
    Guid CrisisEventId,
    string Title,
    string SeverityLevel,
    string Message
) : IDomainEvent
{
    public string EventType => nameof(PublicAlertBroadcastEvent);
}
