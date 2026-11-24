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
        string hash = $"PBKDF2$100000${Convert.ToBase64String(keyBytes)}";
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
        request.AiRecommendations = new List<AiRecommendation> { recommendation };
        return request;
    }

    public async Task<HumanGovernanceDecision> ReviewAiRecommendationAsync(
        Guid reviewerUserId,
        string reviewerName,
        UserRole reviewerRole,
        ReviewAiRecommendationDto dto,
        CancellationToken cancellationToken = default)
    {
        if (reviewerRole != UserRole.EmergencyCoordinator &&
            reviewerRole != UserRole.CaseManager &&
            reviewerRole != UserRole.SystemAdmin &&
            reviewerRole != UserRole.OrganizationAdmin)
        {
            throw new UnauthorizedAccessException("Critical humanitarian AI decisions require EmergencyCoordinator, CaseManager, SystemAdmin, or OrganizationAdmin authority.");
        }

        var recommendation = await _unitOfWork.AiRecommendations.GetByIdAsync(dto.RecommendationId, cancellationToken)
            ?? throw new KeyNotFoundException("AI Recommendation not found.");

        recommendation.GovernanceStatus = dto.DecisionStatus;
        recommendation.UpdatedAtUtc = DateTime.UtcNow;
        await _unitOfWork.AiRecommendations.UpdateAsync(recommendation, cancellationToken);

        string originalAiSummary = $"Category={recommendation.RecommendedCategory}, Urgency={recommendation.RecommendedUrgency}, PriorityScore={recommendation.RecommendedPriorityScore:F1}";
        UrgencyLevel finalUrgency = dto.OverriddenUrgency ?? recommendation.RecommendedUrgency;
        string finalCategory = dto.OverriddenCategory?.ToString() ?? recommendation.RecommendedCategory;
        string finalHumanSummary = $"Action={dto.DecisionStatus}, FinalCategory={finalCategory}, FinalUrgency={finalUrgency}";

        var decision = new HumanGovernanceDecision
        {
            AiRecommendationId = recommendation.Id,
            ActionTaken = dto.DecisionStatus,
            OriginalAiRecommendationSummary = originalAiSummary,
            OriginalConfidence = recommendation.ConfidenceScore,
            FinalHumanDecisionSummary = finalHumanSummary,
            OverrideJustification = dto.Justification,
            ResponsibleUserId = reviewerUserId,
            ResponsibleUserName = reviewerName,
            ResponsibleUserRole = reviewerRole.ToString(),
            DecisionTimestampUtc = DateTime.UtcNow
        };

        await _unitOfWork.GovernanceDecisions.AddAsync(decision, cancellationToken);

        if (recommendation.AssistanceRequestId.HasValue)
        {
            var request = await _unitOfWork.AssistanceRequests.GetByIdAsync(recommendation.AssistanceRequestId.Value, cancellationToken);
            if (request != null)
            {
                var prevStatus = request.Status;
                if (dto.DecisionStatus == GovernanceDecisionStatus.Approved || dto.DecisionStatus == GovernanceDecisionStatus.Modified)
                {
                    request.FinalApprovedUrgency = finalUrgency;
                    if (dto.OverriddenCategory.HasValue)
                    {
                        request.Category = dto.OverriddenCategory.Value;
                    }
                    request.Status = finalUrgency >= UrgencyLevel.Critical ? RequestStatus.Escalated : RequestStatus.Prioritised;
                    if (dto.DecisionStatus == GovernanceDecisionStatus.Modified)
                    {
                        request.PriorityScore = Math.Min(100.0, (int)finalUrgency * 19.5);
                    }
                }
                else if (dto.DecisionStatus == GovernanceDecisionStatus.Rejected)
                {
                    request.Status = RequestStatus.Verified;
                }

                request.UpdatedAtUtc = DateTime.UtcNow;
                await _unitOfWork.AssistanceRequests.UpdateAsync(request, cancellationToken);

                await _unitOfWork.RequestHistories.AddAsync(new RequestHistory
                {
                    AssistanceRequestId = request.Id,
                    PreviousStatus = prevStatus,
                    NewStatus = request.Status,
                    ActionDescription = $"Human-in-the-loop governance {dto.DecisionStatus} by {reviewerName} ({reviewerRole}). Final Urgency: {request.FinalApprovedUrgency}. Rationale: {dto.Justification}",
                    ChangedByUserId = reviewerUserId,
                    ChangedByUserName = reviewerName,
                    ChangedByRole = reviewerRole.ToString()
                }, cancellationToken);
            }
        }

        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "AiGovernance",
            ActionName = $"AiRecommendation_{dto.DecisionStatus}",
            EntityType = nameof(AiRecommendation),
            EntityId = recommendation.Id.ToString(),
            ActorUserId = reviewerUserId,
            ActorUserName = reviewerName,
            ActorRole = reviewerRole.ToString(),
            DetailsJson = JsonSerializer.Serialize(new
            {
                recommendation.Id,
                recommendation.AssistanceRequestId,
                OriginalAi = originalAiSummary,
                OriginalConfidence = recommendation.ConfidenceScore,
                HumanDecision = finalHumanSummary,
                dto.Justification,
                decision.DecisionTimestampUtc
            })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _eventPublisher.PublishAsync(new AiRecommendationReviewedEvent(
            Guid.NewGuid(),
            DateTime.UtcNow,
            recommendation.Id,
            recommendation.AssistanceRequestId,
            dto.DecisionStatus.ToString(),
            reviewerUserId,
            reviewerName
        ), cancellationToken);

        return decision;
    }

    public async Task<ResourceAllocationPlanResult> ExecuteResourceAllocationAsync(
        Guid actorUserId,
        string actorName,
        UserRole actorRole,
        IReadOnlyList<Guid> requestIds,
        string strategyName,
        CancellationToken cancellationToken = default)
    {
        if (actorRole != UserRole.LogisticsManager &&
            actorRole != UserRole.PartnerOfficer &&
            actorRole != UserRole.EmergencyCoordinator &&
            actorRole != UserRole.OrganizationAdmin &&
            actorRole != UserRole.SystemAdmin)
        {
            throw new UnauthorizedAccessException("Resource allocation requires LogisticsManager, PartnerOfficer, EmergencyCoordinator, OrganizationAdmin, or SystemAdmin role.");
        }

        var allRequests = await _unitOfWork.AssistanceRequests.GetAllAsync(cancellationToken);
        var competingRequests = allRequests.Where(r => requestIds.Contains(r.Id)).ToList();
        if (!competingRequests.Any())
        {
            throw new InvalidOperationException("No valid assistance requests selected for allocation.");
        }

        var allResources = await _unitOfWork.Resources.GetAllAsync(cancellationToken);
        var strategy = _strategyResolver.Resolve(strategyName);
        var plan = strategy.ComputeAllocationPlan(competingRequests, allResources, _mappingService);

        await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            foreach (var item in plan.Allocations)
            {
                if (item.SelectedResourceItemId != Guid.Empty && item.AllocatedQuantity > 0)
                {
                    var resource = await _unitOfWork.Resources.GetByIdAsync(item.SelectedResourceItemId, cancellationToken);
                    if (resource != null)
                    {
                        resource.AvailableQuantity = Math.Max(0, resource.AvailableQuantity - item.AllocatedQuantity);
                        resource.AllocatedQuantity += item.AllocatedQuantity;
                        resource.UpdatedAtUtc = DateTime.UtcNow;
                        await _unitOfWork.Resources.UpdateAsync(resource, cancellationToken);
                    }

                    var allocationEntity = new ResourceAllocation
                    {
                        ResourceItemId = item.SelectedResourceItemId,
                        AssistanceRequestId = item.AssistanceRequestId,
                        RequestedQuantity = item.RequestedQuantity,
                        AllocatedQuantity = item.AllocatedQuantity,
                        IsPartialShortageAllocation = item.IsPartialShortage,
                        AllocationStrategyUsed = plan.StrategyUsed,
                        ConstraintMatchScore = item.ConstraintScore,
                        EstimatedDistanceKm = item.DistanceKm,
                        AlternativeRecommendation = item.AlternativeRecommendation,
                        Status = item.IsPartialShortage ? "PartiallyAllocated_Shortage" : "Allocated",
                        ApprovedByUserId = actorUserId
                    };
                    await _unitOfWork.ResourceAllocations.AddAsync(allocationEntity, cancellationToken);

                    var request = competingRequests.First(r => r.Id == item.AssistanceRequestId);
                    var route = await _mappingService.CalculateRouteAsync(
                        resource?.WarehouseLatitude ?? request.Latitude,
                        resource?.WarehouseLongitude ?? request.Longitude,
                        request.Latitude,
                        request.Longitude,
                        cancellationToken);

                    await _unitOfWork.DispatchRecords.AddAsync(new DispatchRecord
                    {
                        ResourceAllocationId = allocationEntity.Id,
                        VehicleRegistration = $"UN-RELIEF-{Random.Shared.Next(100, 999)}",
                        DriverName = "Logistics Rapid Response Unit",
                        RouteSummary = route.RouteSummary,
                        DistanceKm = route.DistanceKm,
                        EstimatedTravelMinutes = route.EstimatedMinutes,
                        DispatchStatus = "InTransit"
                    }, cancellationToken);

                    var previousStatus = request.Status;
                    request.Status = item.IsPartialShortage ? RequestStatus.InProgress : RequestStatus.Fulfilled;
                    request.UpdatedAtUtc = DateTime.UtcNow;
                    await _unitOfWork.AssistanceRequests.UpdateAsync(request, cancellationToken);

                    await _unitOfWork.RequestHistories.AddAsync(new RequestHistory
                    {
                        AssistanceRequestId = request.Id,
                        PreviousStatus = previousStatus,
                        NewStatus = request.Status,
                        ActionDescription = $"Allocated {item.AllocatedQuantity}/{item.RequestedQuantity} units of {item.SelectedResourceName} from {item.WarehouseName} using {plan.StrategyUsed} strategy. {item.AlternativeRecommendation}",
                        ChangedByUserId = actorUserId,
                        ChangedByUserName = actorName,
                        ChangedByRole = actorRole.ToString()
                    }, cancellationToken);

                    await _eventPublisher.PublishAsync(new ResourceAllocatedEvent(
                        Guid.NewGuid(),
                        DateTime.UtcNow,
                        allocationEntity.Id,
                        request.Id,
                        request.CitizenUserId,
                        item.SelectedResourceName,
                        item.AllocatedQuantity,
                        item.IsPartialShortage
                    ), cancellationToken);
                }

                if (item.IsPartialShortage)
                {
                    var req = competingRequests.First(r => r.Id == item.AssistanceRequestId);
                    await _unitOfWork.PartnerAidRequests.AddAsync(new PartnerAidRequest
                    {
                        RequestingOrganisationId = req.AssignedOrganisationId ?? Guid.Empty,
                        NeededCategory = req.Category,
                        ResourceName = item.SelectedResourceName,
                        QuantityNeeded = item.RequestedQuantity - item.AllocatedQuantity,
                        Justification = $"Automatic shortage escalation for Request {req.ReferenceCode}: {item.AlternativeRecommendation}",
                        Status = "OpenPartnerEscalation"
                    }, cancellationToken);
                }
            }

            await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
            {
                EventCategory = "ResourceLogistics",
                ActionName = "MultiConstraintResourceAllocation",
                EntityType = nameof(ResourceAllocation),
                EntityId = string.Join(",", requestIds),
                ActorUserId = actorUserId,
                ActorUserName = actorName,
                ActorRole = actorRole.ToString(),
                DetailsJson = JsonSerializer.Serialize(new
                {
                    plan.StrategyUsed,
                    plan.ShortageEncountered,
                    plan.TotalRequestedAcrossCases,
                    plan.TotalAllocatedAcrossCases,
                    plan.TotalUnmetShortfall
                })
            }, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }, cancellationToken);

        return plan;
    }

    public async Task<ShelterAllocation> AllocateShelterAsync(
        Guid actorUserId,
        string actorName,
        UserRole actorRole,
        AllocateShelterRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        if (actorRole != UserRole.ShelterAdmin &&
            actorRole != UserRole.EmergencyCoordinator &&
            actorRole != UserRole.CaseManager &&
            actorRole != UserRole.OrganizationAdmin &&
            actorRole != UserRole.SystemAdmin)
        {
            throw new UnauthorizedAccessException("Shelter allocation requires ShelterAdmin, CaseManager, EmergencyCoordinator, OrganizationAdmin, or SystemAdmin role.");
        }

        if (dto.MembersCount <= 0)
        {
            throw new ArgumentException("Allocated household member count must be at least 1.");
        }

        ShelterAllocation? allocation = null;
        string allocatedShelterName = string.Empty;

        
        try
        {
            await _unitOfWork.ExecuteInTransactionAsync(async () =>
            {
                var shelter = await _unitOfWork.Shelters.GetByIdAsync(dto.ShelterId, cancellationToken)
                    ?? throw new KeyNotFoundException("Shelter not found.");

                int availableSpots = shelter.TotalCapacity - shelter.CurrentOccupancy;
                if (dto.MembersCount > availableSpots)
                {
                    throw new InvalidOperationException($"Shelter over-allocation prevented: '{shelter.Name}' only has {availableSpots} available spaces, but {dto.MembersCount} spaces were requested.");
                }

                if (dto.RequiresAccessibility && !shelter.IsWheelchairAccessible)
                {
                    throw new InvalidOperationException($"Suitability constraint failed: '{shelter.Name}' does not have wheelchair accessibility required by this household.");
                }

                allocation = new ShelterAllocation
                {
                    ShelterId = shelter.Id,
                    AssistanceRequestId = dto.AssistanceRequestId,
                    CitizenUserId = dto.CitizenUserId,
                    HouseholdName = dto.HouseholdName,
                    AllocatedMembersCount = dto.MembersCount,
                    RequiresAccessibility = dto.RequiresAccessibility,
                    AllocationStatus = "CheckedIn",
                    ApprovedByUserId = actorUserId
                };

                shelter.CurrentOccupancy += dto.MembersCount;
                if (shelter.CurrentOccupancy >= shelter.TotalCapacity)
                {
                    shelter.Status = "AtFullCapacity";
                }
                shelter.UpdatedAtUtc = DateTime.UtcNow;
                allocatedShelterName = shelter.Name;

                await _unitOfWork.Shelters.UpdateAsync(shelter, cancellationToken);
                await _unitOfWork.ShelterAllocations.AddAsync(allocation, cancellationToken);

                await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
                {
                    EventCategory = "ShelterManagement",
                    ActionName = "ShelterHouseholdAllocated",
                    EntityType = nameof(Shelter),
                    EntityId = shelter.Id.ToString(),
                    ActorUserId = actorUserId,
                    ActorUserName = actorName,
                    ActorRole = actorRole.ToString(),
                    DetailsJson = JsonSerializer.Serialize(new
                    {
                        shelter.Name,
                        dto.HouseholdName,
                        dto.MembersCount,
                        NewOccupancy = shelter.CurrentOccupancy,
                        shelter.TotalCapacity
                    })
                }, cancellationToken);

                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }, cancellationToken);
        }
        finally
        {
            ShelterAllocationLock.Release();
        }

        await _eventPublisher.PublishAsync(new ShelterAllocatedEvent(
            Guid.NewGuid(),
            DateTime.UtcNow,
            dto.ShelterId,
            allocatedShelterName,
            dto.CitizenUserId,
            dto.MembersCount
        ), cancellationToken);

        return allocation!;
    }

    public async Task<ShelterAllocation> CheckoutShelterAllocationAsync(
        Guid actorUserId,
        string actorName,
        UserRole actorRole,
        Guid allocationId,
        string? dischargeNotes = null,
        CancellationToken cancellationToken = default)
    {
        if (actorRole != UserRole.ShelterAdmin &&
            actorRole != UserRole.EmergencyCoordinator &&
            actorRole != UserRole.CaseManager &&
            actorRole != UserRole.OrganizationAdmin &&
            actorRole != UserRole.SystemAdmin)
        {
            throw new UnauthorizedAccessException("Shelter discharge requires ShelterAdmin, CaseManager, EmergencyCoordinator, OrganizationAdmin, or SystemAdmin role.");
        }

        ShelterAllocation? allocation = null;

        
        try
        {
            await _unitOfWork.ExecuteInTransactionAsync(async () =>
            {
                allocation = await _unitOfWork.ShelterAllocations.GetByIdAsync(allocationId, cancellationToken)
                    ?? throw new KeyNotFoundException("Shelter allocation record not found.");

                if (string.Equals(allocation.AllocationStatus, "CheckedOut", StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException($"Household '{allocation.HouseholdName}' has already been checked out.");
                }

                var shelter = await _unitOfWork.Shelters.GetByIdAsync(allocation.ShelterId, cancellationToken);
                if (shelter != null)
                {
                    shelter.CurrentOccupancy = Math.Max(0, shelter.CurrentOccupancy - allocation.AllocatedMembersCount);
                    if (shelter.CurrentOccupancy < shelter.TotalCapacity &&
                        string.Equals(shelter.Status, "AtFullCapacity", StringComparison.OrdinalIgnoreCase))
                    {
                        shelter.Status = "Operational";
                    }
                    shelter.UpdatedAtUtc = DateTime.UtcNow;
                    await _unitOfWork.Shelters.UpdateAsync(shelter, cancellationToken);
                }

                allocation.AllocationStatus = "CheckedOut";
                allocation.UpdatedAtUtc = DateTime.UtcNow;
                await _unitOfWork.ShelterAllocations.UpdateAsync(allocation, cancellationToken);

                await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
                {
                    EventCategory = "ShelterManagement",
                    ActionName = "ShelterHouseholdCheckedOut",
                    EntityType = nameof(ShelterAllocation),
                    EntityId = allocation.Id.ToString(),
                    ActorUserId = actorUserId,
                    ActorUserName = actorName,
                    ActorRole = actorRole.ToString(),
                    DetailsJson = JsonSerializer.Serialize(new
                    {
                        allocation.ShelterId,
                        ShelterName = shelter?.Name ?? "Shelter",
                        allocation.HouseholdName,
                        ReleasedSpaces = allocation.AllocatedMembersCount,
                        NewOccupancy = shelter?.CurrentOccupancy ?? 0,
                        DischargeNotes = dischargeNotes ?? "Household safely discharged"
                    })
                }, cancellationToken);

                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }, cancellationToken);
        }
        finally
        {
            ShelterAllocationLock.Release();
        }

        return allocation!;
    }

    public async Task<NotificationRecord> SendIdempotentNotificationAsync(
        SendNotificationRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(dto.IdempotencyKey))
        {
            var existing = await _unitOfWork.Notifications.FindAsync(
                n => n.IdempotencyKey == dto.IdempotencyKey &&
                     n.RecipientUserId == dto.RecipientUserId &&
                     n.DeliveryStatus == NotificationDeliveryStatus.Sent,
                cancellationToken);

            if (existing.Any())
            {
                var duplicateAttemptRecord = new NotificationRecord
                {
                    RecipientUserId = dto.RecipientUserId,
                    RecipientContact = dto.RecipientContact,
                    Channel = dto.Channel,
                    LanguageCode = dto.LanguageCode,
                    Subject = dto.Subject,
                    MessageBody = dto.MessageBody,
                    IdempotencyKey = dto.IdempotencyKey,
                    DeliveryStatus = NotificationDeliveryStatus.SkippedDuplicate,
                    RetryAttempts = 0,
                    ProviderResponse = $"Skipped duplicate delivery for IdempotencyKey={dto.IdempotencyKey}"
                };
                await _unitOfWork.Notifications.AddAsync(duplicateAttemptRecord, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                return duplicateAttemptRecord;
            }
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
