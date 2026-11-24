using ReliefCoord.Application.DTOs;
using ReliefCoord.Application.Interfaces;
using ReliefCoord.Domain.Entities;
using ReliefCoord.Domain.Enums;

namespace ReliefCoord.Application.Strategies;

public class MultiConstraintOptimalStrategy : IResourceAllocationStrategy
{
    public string StrategyName => "MultiConstraintOptimal";

    public ResourceAllocationPlanResult ComputeAllocationPlan(
        IReadOnlyList<AssistanceRequest> competingRequests,
        IReadOnlyList<ResourceItem> candidateResources,
        IMappingProviderService mappingService)
    {
        var allocations = new List<PlannedAllocationItemDto>();
        var remainingStockByWarehouse = new Dictionary<Guid, int>();

        foreach (var resource in candidateResources)
        {
            remainingStockByWarehouse[resource.Id] = resource.AvailableQuantity;
        }

        var sortedRequests = competingRequests
            .OrderByDescending(r => (int)r.FinalApprovedUrgency)
            .ThenByDescending(r => r.PriorityScore)
            .ToList();

        int totalRequested = 0;
        int totalAllocated = 0;
        bool shortageEncountered = false;

        foreach (var request in sortedRequests)
        {
            totalRequested += request.RequestedQuantity;

            ResourceItem? bestResource = null;
            double bestScore = -1.0;
            double bestDistanceKm = 0.0;

            foreach (var resource in candidateResources)
            {
                int currentAvailable = remainingStockByWarehouse[resource.Id];
                if (resource.Category != request.Category || currentAvailable <= 0)
                {
                    continue;
                }

                double distanceKm = mappingService.CalculateDistanceKm(
                    request.Latitude,
                    request.Longitude,
                    resource.WarehouseLatitude,
                    resource.WarehouseLongitude);

                double proximityScore = Math.Max(0.0, 100.0 - (distanceKm * 1.4));

                double stockAdequacyScore = 100.0;
                if (currentAvailable < request.RequestedQuantity)
                {
                    stockAdequacyScore = (currentAvailable / (double)request.RequestedQuantity) * 100.0;
                }

                double expiryScore = 65.0;
                if (resource.ExpiryDateUtc.HasValue)
                {
                    double daysLeft = (resource.ExpiryDateUtc.Value - DateTime.UtcNow).TotalDays;
                    if (daysLeft <= 30)
                    {
                        expiryScore = 95.0;
                    }
                    else if (daysLeft <= 90)
                    {
                        expiryScore = 80.0;
                    }
                }

                double coldChainScore = (request.Category == RequestCategory.Medicine && resource.SupportsColdChain) ? 100.0 : 75.0;
                double orgAlignmentScore = (request.AssignedOrganisationId == resource.OwningOrganisationId) ? 100.0 : 70.0;

                double totalWeightedScore =
                    (proximityScore * 0.35) +
                    (stockAdequacyScore * 0.25) +
                    (expiryScore * 0.15) +
                    (coldChainScore * 0.15) +
                    (orgAlignmentScore * 0.10);

                totalWeightedScore = Math.Round(totalWeightedScore, 2);

                if (totalWeightedScore > bestScore)
                {
                    bestScore = totalWeightedScore;
                    bestResource = resource;
                    bestDistanceKm = Math.Round(distanceKm, 2);
                }
            }

            if (bestResource == null)
            {
                shortageEncountered = true;
                allocations.Add(new PlannedAllocationItemDto(
                    request.Id,
                    request.ReferenceCode,
                    request.Title,
                    request.FinalApprovedUrgency,
                    request.PriorityScore,
                    Guid.Empty,
                    "No Matching Inventory",
                    "Partner Escalation Queue",
                    request.RequestedQuantity,
                    0,
                    true,
                    0,
                    0,
                    "Stock exhausted for category. Triggered Partner Aid Request."
                ));
                continue;
            }

            int availableAtBest = remainingStockByWarehouse[bestResource.Id];
            int allocatedQty = Math.Min(request.RequestedQuantity, availableAtBest);
            remainingStockByWarehouse[bestResource.Id] -= allocatedQty;
            totalAllocated += allocatedQty;

            bool isPartialShortage = allocatedQty < request.RequestedQuantity;
            if (isPartialShortage)
            {
                shortageEncountered = true;
            }

            string recommendationNote = "Primary multi-constraint selection satisfies full demand.";
            if (isPartialShortage)
            {
                int deficit = request.RequestedQuantity - allocatedQty;
                recommendationNote = $"Shortfall of {deficit} units. Recommend secondary warehouse dispatch or Partner Organisation transfer.";
            }

            allocations.Add(new PlannedAllocationItemDto(
                request.Id,
                request.ReferenceCode,
                request.Title,
                request.FinalApprovedUrgency,
                request.PriorityScore,
                bestResource.Id,
                bestResource.Name,
                bestResource.WarehouseName,
                request.RequestedQuantity,
                allocatedQty,
                isPartialShortage,
                bestScore,
                bestDistanceKm,
                recommendationNote
            ));
        }

        int unmetShortfall = Math.Max(0, totalRequested - totalAllocated);

        return new ResourceAllocationPlanResult(
            StrategyName,
            shortageEncountered,
            totalRequested,
            totalAllocated,
            unmetShortfall,
            allocations,
            "Evaluated 5 weighted constraints: Proximity (35%), Stock Adequacy (25%), FEFO Expiry (15%), Cold-Chain Suitability (15%), and Organisation Alignment (10%)."
        );
    }
}

public class ShortageProportionalContentionStrategy : IResourceAllocationStrategy
{
    public string StrategyName => "ShortageProportionalContention";

    public ResourceAllocationPlanResult ComputeAllocationPlan(
        IReadOnlyList<AssistanceRequest> competingRequests,
        IReadOnlyList<ResourceItem> candidateResources,
        IMappingProviderService mappingService)
    {
        var allocations = new List<PlannedAllocationItemDto>();
        if (competingRequests.Count == 0 || candidateResources.Count == 0)
        {
            return new ResourceAllocationPlanResult(StrategyName, false, 0, 0, 0, allocations, "No requests or resources provided.");
        }

        var firstRequest = competingRequests[0];
        var matchingCategoryResources = candidateResources
            .Where(r => r.Category == firstRequest.Category && r.AvailableQuantity > 0)
            .ToList();

        var primaryDepot = matchingCategoryResources
            .OrderBy(r => mappingService.CalculateDistanceKm(
                firstRequest.Latitude,
                firstRequest.Longitude,
                r.WarehouseLatitude,
                r.WarehouseLongitude))
            .FirstOrDefault() ?? candidateResources[0];

        int remainingPool = primaryDepot.AvailableQuantity;
        int totalDemand = competingRequests.Sum(r => r.RequestedQuantity);
        bool isShortage = totalDemand > remainingPool;

        var requestWeights = new Dictionary<Guid, double>();
        double totalWeightSum = 0.0;

        foreach (var req in competingRequests)
        {
            double urgencyMultiplier = (int)req.FinalApprovedUrgency;
            double weight = urgencyMultiplier * Math.Max(10.0, req.PriorityScore) * Math.Max(1, req.AffectedPeopleCount);
            requestWeights[req.Id] = weight;
            totalWeightSum += weight;
        }

        var orderedCompeting = competingRequests
            .OrderByDescending(r => requestWeights[r.Id])
            .ToList();

        int totalAllocated = 0;

        foreach (var req in orderedCompeting)
        {
            double weightShare = requestWeights[req.Id] / Math.Max(1.0, totalWeightSum);
            int allocatedQty;

            if (!isShortage)
            {
                allocatedQty = req.RequestedQuantity;
            }
            else
            {
                int proportionalUnits = (int)Math.Floor(weightShare * primaryDepot.AvailableQuantity);
                if (req.FinalApprovedUrgency >= UrgencyLevel.Critical && proportionalUnits == 0 && remainingPool > 0)
                {
                    proportionalUnits = 1;
                }
                allocatedQty = Math.Min(req.RequestedQuantity, Math.Min(remainingPool, Math.Max(1, proportionalUnits)));
                if (remainingPool <= 0)
                {
                    allocatedQty = 0;
                }
            }

            remainingPool -= allocatedQty;
            totalAllocated += allocatedQty;

            int deficit = req.RequestedQuantity - allocatedQty;
            double distanceKm = mappingService.CalculateDistanceKm(
                req.Latitude,
                req.Longitude,
                primaryDepot.WarehouseLatitude,
                primaryDepot.WarehouseLongitude);

            double sharePercentage = Math.Round(weightShare * 100.0, 1);
            string note = deficit > 0
                ? $"Contention rationed {allocatedQty}/{req.RequestedQuantity} units (Priority Share {sharePercentage}%). Escalated {deficit} deficit units to backup warehouse / Partner Aid Pool."
                : "Full demand satisfied without contention deficit.";

            allocations.Add(new PlannedAllocationItemDto(
                req.Id,
                req.ReferenceCode,
                req.Title,
                req.FinalApprovedUrgency,
                req.PriorityScore,
                primaryDepot.Id,
                primaryDepot.Name,
                primaryDepot.WarehouseName,
                req.RequestedQuantity,
                allocatedQty,
                deficit > 0,
                sharePercentage,
                distanceKm,
                note
            ));
        }

        return new ResourceAllocationPlanResult(
            StrategyName,
            isShortage,
            totalDemand,
            totalAllocated,
            Math.Max(0, totalDemand - totalAllocated),
            allocations,
            "Urgency-weighted proportional rationing prevents single-request starvation when multiple urgent requests compete for limited stock."
        );
    }
}

public class ProximityFirstStrategy : IResourceAllocationStrategy
{
    public string StrategyName => "ProximityFirst";

    public ResourceAllocationPlanResult ComputeAllocationPlan(
        IReadOnlyList<AssistanceRequest> competingRequests,
        IReadOnlyList<ResourceItem> candidateResources,
        IMappingProviderService mappingService)
    {
        var allocations = new List<PlannedAllocationItemDto>();
        var remainingStock = candidateResources.ToDictionary(r => r.Id, r => r.AvailableQuantity);
        int totalRequested = 0;
        int totalAllocated = 0;
        bool shortage = false;

        foreach (var req in competingRequests)
        {
            totalRequested += req.RequestedQuantity;

            var nearestWarehouse = candidateResources
                .Where(r => r.Category == req.Category && remainingStock[r.Id] > 0)
                .OrderBy(r => mappingService.CalculateDistanceKm(req.Latitude, req.Longitude, r.WarehouseLatitude, r.WarehouseLongitude))
                .FirstOrDefault();

            if (nearestWarehouse == null)
            {
                shortage = true;
                continue;
            }

            double distanceKm = mappingService.CalculateDistanceKm(
                req.Latitude,
                req.Longitude,
                nearestWarehouse.WarehouseLatitude,
                nearestWarehouse.WarehouseLongitude);

            int qty = Math.Min(req.RequestedQuantity, remainingStock[nearestWarehouse.Id]);
            remainingStock[nearestWarehouse.Id] -= qty;
            totalAllocated += qty;

            if (qty < req.RequestedQuantity)
            {
                shortage = true;
            }

            allocations.Add(new PlannedAllocationItemDto(
                req.Id,
                req.ReferenceCode,
                req.Title,
                req.FinalApprovedUrgency,
                req.PriorityScore,
                nearestWarehouse.Id,
                nearestWarehouse.Name,
                nearestWarehouse.WarehouseName,
                req.RequestedQuantity,
                qty,
                qty < req.RequestedQuantity,
                Math.Round(Math.Max(0.0, 100.0 - distanceKm), 2),
                distanceKm,
                qty < req.RequestedQuantity ? "Nearest warehouse depleted; switch to MultiConstraintOptimal." : "Nearest warehouse selected."
            ));
        }

        return new ResourceAllocationPlanResult(
            StrategyName,
            shortage,
            totalRequested,
            totalAllocated,
            Math.Max(0, totalRequested - totalAllocated),
            allocations,
            "Selected closest warehouse based on Haversine distance alone."
        );
    }
}

public class ResourceAllocationStrategyResolver
{
    private readonly IEnumerable<IResourceAllocationStrategy> _strategies;

    public ResourceAllocationStrategyResolver(IEnumerable<IResourceAllocationStrategy> strategies)
    {
        _strategies = strategies;
    }

    public IResourceAllocationStrategy Resolve(string? strategyName)
    {
        foreach (var strategy in _strategies)
        {
            if (strategy.StrategyName.Equals(strategyName, StringComparison.OrdinalIgnoreCase))
            {
                return strategy;
            }
        }

        return _strategies.First();
    }
}
