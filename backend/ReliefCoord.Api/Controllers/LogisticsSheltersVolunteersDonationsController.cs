using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReliefCoord.Application.DTOs;
using ReliefCoord.Application.Interfaces;
using ReliefCoord.Application.Services;
using ReliefCoord.Application.Strategies;
using ReliefCoord.Domain.Entities;
using ReliefCoord.Domain.Enums;
using ReliefCoord.Domain.Events;

namespace ReliefCoord.Api.Controllers;

[ApiController]
[Route("api")]
public class LogisticsSheltersVolunteersDonationsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly HumanitarianOperationsService _opsService;
    private readonly IAiProviderFactory _aiProviderFactory;
    private readonly IMappingProviderService _mappingService;
    private readonly IServiceResilienceMonitor _resilienceMonitor;
    private readonly ResourceAllocationStrategyResolver _strategyResolver;
    private readonly IDomainEventPublisher _eventPublisher;

    public LogisticsSheltersVolunteersDonationsController(
        IUnitOfWork unitOfWork,
        HumanitarianOperationsService opsService,
        IAiProviderFactory aiProviderFactory,
        IMappingProviderService mappingService,
        IServiceResilienceMonitor resilienceMonitor,
        ResourceAllocationStrategyResolver strategyResolver,
        IDomainEventPublisher eventPublisher)
    {
        _unitOfWork = unitOfWork;
        _opsService = opsService;
        _aiProviderFactory = aiProviderFactory;
        _mappingService = mappingService;
        _resilienceMonitor = resilienceMonitor;
        _strategyResolver = strategyResolver;
        _eventPublisher = eventPublisher;
    }

    private string GetClientIp()
    {
        string? forwarded = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded))
        {
            return forwarded.Split(',')[0].Trim();
        }
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
    }

    [HttpGet("logistics/resources")]
    [Authorize]
    public async Task<ActionResult> GetResources(CancellationToken cancellationToken)
    {
        var items = await _unitOfWork.Resources.GetAllAsync(cancellationToken);
        return Ok(items);
    }

    [HttpPost("logistics/resources")]
    [Authorize(Roles = "LogisticsManager,PartnerOfficer,EmergencyCoordinator,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> CreateResource([FromBody] CreateResourceItemDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.WarehouseName))
        {
            return BadRequest(new { message = "Resource name and warehouse name are required." });
        }

        int totalQty = Math.Max(1, dto.TotalQuantity);
        int availQty = dto.AvailableQuantity.HasValue ? Math.Clamp(dto.AvailableQuantity.Value, 0, totalQty) : totalQty;

        var item = new ResourceItem
        {
            Name = dto.Name.Trim(),
            Category = dto.Category,
            Unit = string.IsNullOrWhiteSpace(dto.Unit) ? "Units" : dto.Unit.Trim(),
            TotalQuantity = totalQty,
            AvailableQuantity = availQty,
            AllocatedQuantity = Math.Max(0, totalQty - availQty),
            ReorderThreshold = Math.Max(0, dto.ReorderThreshold),
            WarehouseName = dto.WarehouseName.Trim(),
            WarehouseLatitude = dto.WarehouseLatitude,
            WarehouseLongitude = dto.WarehouseLongitude,
            SupportsColdChain = dto.SupportsColdChain,
            ExpiryDateUtc = dto.ExpiryDateUtc,
            OwningOrganisationId = dto.OwningOrganisationId
        };

        await _unitOfWork.Resources.AddAsync(item, cancellationToken);
        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "Logistics",
            ActionName = "ResourceItem_Added",
            EntityType = nameof(ResourceItem),
            EntityId = item.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "LogisticsManager",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "LogisticsManager",
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new { item.Name, item.WarehouseName, item.TotalQuantity })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(item);
    }

    [HttpPut("logistics/resources/{id:guid}")]
    [Authorize(Roles = "LogisticsManager,EmergencyCoordinator,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> UpdateResource(Guid id, [FromBody] UpdateResourceItemDto dto, CancellationToken cancellationToken)
    {
        var item = await _unitOfWork.Resources.GetByIdAsync(id, cancellationToken);
        if (item == null)
        {
            return NotFound(new { message = "Resource item not found." });
        }

        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.WarehouseName))
        {
            return BadRequest(new { message = "Resource name and warehouse name are required." });
        }

        item.Name = dto.Name.Trim();
        item.Category = dto.Category;
        item.WarehouseName = dto.WarehouseName.Trim();
        item.Unit = string.IsNullOrWhiteSpace(dto.Unit) ? item.Unit : dto.Unit.Trim();
        item.TotalQuantity = Math.Max(0, dto.TotalQuantity);
        item.AvailableQuantity = Math.Clamp(dto.AvailableQuantity, 0, item.TotalQuantity);
        item.ReorderThreshold = Math.Max(0, dto.ReorderThreshold);
        item.WarehouseLatitude = dto.WarehouseLatitude;
        item.WarehouseLongitude = dto.WarehouseLongitude;

        await _unitOfWork.Resources.UpdateAsync(item, cancellationToken);

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "Logistics",
            ActionName = "Admin_UpdatedResource",
            EntityType = nameof(ResourceItem),
            EntityId = item.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "SystemAdmin",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "SystemAdmin",
            DetailsJson = JsonSerializer.Serialize(new { item.Name, item.WarehouseName, item.AvailableQuantity, item.TotalQuantity })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(item);
    }

    [HttpDelete("logistics/resources/{id:guid}")]
    [Authorize(Roles = "SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> DeleteResource(Guid id, CancellationToken cancellationToken)
    {
        var item = await _unitOfWork.Resources.GetByIdAsync(id, cancellationToken);
        if (item == null)
        {
            return NotFound(new { message = "Resource item not found." });
        }

        var allocs = await _unitOfWork.ResourceAllocations.FindAsync(a => a.ResourceItemId == id, cancellationToken);
        var allocIds = allocs.Select(a => a.Id).ToHashSet();
        if (allocIds.Count > 0)
        {
            var dispatches = await _unitOfWork.DispatchRecords.FindAsync(d => allocIds.Contains(d.ResourceAllocationId), cancellationToken);
            foreach (var disp in dispatches)
            {
                await _unitOfWork.DispatchRecords.DeleteAsync(disp, cancellationToken);
            }
        }
        foreach (var alloc in allocs)
        {
            await _unitOfWork.ResourceAllocations.DeleteAsync(alloc, cancellationToken);
        }

        await _unitOfWork.Resources.DeleteAsync(item, cancellationToken);

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "Logistics",
            ActionName = "Admin_DeletedResource",
            EntityType = nameof(ResourceItem),
            EntityId = item.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "SystemAdmin",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "SystemAdmin",
            DetailsJson = JsonSerializer.Serialize(new { item.Name, item.WarehouseName })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(new { deletedResourceId = id });
    }

    [HttpGet("logistics/recommendations/{requestId:guid}")]
    [Authorize]
    public async Task<ActionResult> GetResourceRecommendations(Guid requestId, CancellationToken cancellationToken)
    {
        var req = await _unitOfWork.AssistanceRequests.GetByIdAsync(requestId, cancellationToken);
        if (req == null)
        {
            return NotFound(new { message = "Assistance request not found." });
        }

        var resources = await _unitOfWork.Resources.GetAllAsync(cancellationToken);
        var ai = _aiProviderFactory.CreateProvider();
        var candidates = await ai.RecommendResourcesForRequestAsync(req, resources, cancellationToken);
        return Ok(candidates);
    }

    [HttpPost("logistics/simulate-allocation")]
    [Authorize]
    public async Task<ActionResult<ResourceAllocationPlanResult>> SimulateAllocation(
        [FromBody] CompetingShortageScenarioRequestDto dto,
        CancellationToken cancellationToken)
    {
        var allRequests = await _unitOfWork.AssistanceRequests.GetAllAsync(cancellationToken);
        var targetRequests = dto.CompetingRequestIds.Any()
            ? allRequests.Where(r => dto.CompetingRequestIds.Contains(r.Id)).ToList()
            : allRequests.Where(r => r.Status != RequestStatus.Fulfilled && r.Status != RequestStatus.MergedAsDuplicate).ToList();

        var allResources = await _unitOfWork.Resources.GetAllAsync(cancellationToken);
        var strategy = _strategyResolver.Resolve(dto.StrategyName);
        var plan = strategy.ComputeAllocationPlan(targetRequests, allResources, _mappingService);
        return Ok(plan);
    }

    [HttpPost("logistics/execute-allocation")]
    [Authorize(Roles = "LogisticsManager,PartnerOfficer,EmergencyCoordinator,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult<ResourceAllocationPlanResult>> ExecuteAllocation(
        [FromBody] CompetingShortageScenarioRequestDto dto,
        CancellationToken cancellationToken)
    {
        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : Guid.Empty;
        var actorName = User.FindFirstValue(ClaimTypes.Name) ?? "Logistics Manager";
        var roleStr = User.FindFirstValue(ClaimTypes.Role) ?? "LogisticsManager";
        Enum.TryParse<UserRole>(roleStr, out var actorRole);

        var plan = await _opsService.ExecuteResourceAllocationAsync(
            actorId,
            actorName,
            actorRole,
            dto.CompetingRequestIds,
            dto.StrategyName,
            cancellationToken);

        return Ok(plan);
    }

    [HttpGet("logistics/allocations")]
    [Authorize]
    public async Task<ActionResult> GetAllocations(CancellationToken cancellationToken)
    {
        var allocations = await _unitOfWork.ResourceAllocations.GetAllAsync(cancellationToken);
        var dispatches = await _unitOfWork.DispatchRecords.GetAllAsync(cancellationToken);
        var partnerRequests = await _unitOfWork.PartnerAidRequests.GetAllAsync(cancellationToken);

        return Ok(new
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
