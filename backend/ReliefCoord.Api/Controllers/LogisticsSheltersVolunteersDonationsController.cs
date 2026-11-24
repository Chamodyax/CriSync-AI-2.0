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
        {
            Allocations = allocations,
            Dispatches = dispatches,
            PartnerAidRequests = partnerRequests
        });
    }

    [HttpPost("logistics/resources/{id:guid}/replenish")]
    [Authorize(Roles = "LogisticsManager,PartnerOfficer,EmergencyCoordinator,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> ReplenishResource(Guid id, [FromBody] ReplenishResourceDto dto, CancellationToken cancellationToken)
    {
        if (dto.AddedQuantity <= 0)
        {
            return BadRequest(new { message = "Replenishment quantity must be greater than 0." });
        }

        var item = await _unitOfWork.Resources.GetByIdAsync(id, cancellationToken);
        if (item == null)
        {
            return NotFound(new { message = "Resource item not found." });
        }

        item.TotalQuantity += dto.AddedQuantity;
        item.AvailableQuantity += dto.AddedQuantity;
        item.UpdatedAtUtc = DateTime.UtcNow;
        await _unitOfWork.Resources.UpdateAsync(item, cancellationToken);

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "Logistics",
            ActionName = "ResourceStock_Replenished",
            EntityType = nameof(ResourceItem),
            EntityId = item.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "LogisticsManager",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "LogisticsManager",
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new { item.Name, dto.AddedQuantity, item.AvailableQuantity, item.TotalQuantity, dto.SourceNote })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(item);
    }

    [HttpPost("logistics/dispatches/{id:guid}/deliver")]
    [Authorize(Roles = "LogisticsManager,PartnerOfficer,EmergencyCoordinator,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> MarkDispatchDelivered(Guid id, CancellationToken cancellationToken)
    {
        var dispatch = await _unitOfWork.DispatchRecords.GetByIdAsync(id, cancellationToken);
        if (dispatch == null)
        {
            return NotFound(new { message = "Dispatch record not found." });
        }

        dispatch.DispatchStatus = "Delivered";
        dispatch.DeliveredAtUtc = DateTime.UtcNow;
        dispatch.UpdatedAtUtc = DateTime.UtcNow;
        await _unitOfWork.DispatchRecords.UpdateAsync(dispatch, cancellationToken);

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "Logistics",
            ActionName = "ConvoyDispatch_Delivered",
            EntityType = nameof(DispatchRecord),
            EntityId = dispatch.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "LogisticsManager",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "LogisticsManager",
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new { dispatch.VehicleRegistration, dispatch.RouteSummary, dispatch.DeliveredAtUtc })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(dispatch);
    }

    [HttpPost("logistics/partner-aid-requests")]
    [Authorize(Roles = "LogisticsManager,PartnerOfficer,EmergencyCoordinator,ShelterAdmin,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> CreatePartnerAidRequest([FromBody] CreatePartnerAidRequestDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.ResourceName) || dto.QuantityNeeded <= 0)
        {
            return BadRequest(new { message = "Resource name and positive quantity needed are required." });
        }

        var orgClaim = User.FindFirstValue("organisation_id");
        Guid requestingOrgId = Guid.TryParse(orgClaim, out var parsedOrg) ? parsedOrg : Guid.Empty;

        var partnerReq = new PartnerAidRequest
        {
            RequestingOrganisationId = requestingOrgId,
            TargetPartnerOrganisationId = dto.TargetPartnerOrganisationId,
            NeededCategory = dto.NeededCategory,
            ResourceName = dto.ResourceName.Trim(),
            QuantityNeeded = dto.QuantityNeeded,
            Justification = dto.Justification.Trim(),
            Status = "OpenPartnerRequest"
        };

        await _unitOfWork.PartnerAidRequests.AddAsync(partnerReq, cancellationToken);
        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "PartnerCoordination",
            ActionName = "PartnerAidRequest_Created",
            EntityType = nameof(PartnerAidRequest),
            EntityId = partnerReq.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "PartnerOfficer",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "PartnerOfficer",
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new { partnerReq.ResourceName, partnerReq.QuantityNeeded, partnerReq.NeededCategory })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(partnerReq);
    }

    [HttpPost("logistics/partner-aid-requests/{id:guid}/fulfill")]
    [Authorize(Roles = "PartnerOfficer,LogisticsManager,EmergencyCoordinator,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> FulfillPartnerAidRequest(Guid id, [FromBody] FulfillPartnerAidRequestDto? dto, CancellationToken cancellationToken)
    {
        var req = await _unitOfWork.PartnerAidRequests.GetByIdAsync(id, cancellationToken);
        if (req == null)
        {
            return NotFound(new { message = "Partner aid request not found." });
        }

        var orgClaim = User.FindFirstValue("organisation_id");
        if (Guid.TryParse(orgClaim, out var fulfillOrgId) && req.TargetPartnerOrganisationId == null)
        {
            req.TargetPartnerOrganisationId = fulfillOrgId;
        }

        req.Status = "FulfilledByPartner";
        if (!string.IsNullOrWhiteSpace(dto?.FulfillmentNotes))
        {
            req.Justification = $"{req.Justification} | Fulfillment: {dto.FulfillmentNotes.Trim()}";
        }
        req.UpdatedAtUtc = DateTime.UtcNow;
        await _unitOfWork.PartnerAidRequests.UpdateAsync(req, cancellationToken);

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "PartnerCoordination",
            ActionName = "PartnerAidRequest_Fulfilled",
            EntityType = nameof(PartnerAidRequest),
            EntityId = req.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "PartnerOfficer",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "PartnerOfficer",
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new { req.ResourceName, req.QuantityNeeded, req.Status })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(req);
    }

    [HttpGet("shelters")]
    [Authorize]
    public async Task<ActionResult> GetShelters(CancellationToken cancellationToken)
    {
        var shelters = await _unitOfWork.Shelters.GetAllAsync(cancellationToken);
        var allocations = await _unitOfWork.ShelterAllocations.GetAllAsync(cancellationToken);
        return Ok(new
        {
            Shelters = shelters,
            Allocations = allocations
        });
    }

    [HttpGet("shelters/recommendations/{requestId:guid}")]
    [Authorize]
    public async Task<ActionResult> GetShelterRecommendations(Guid requestId, CancellationToken cancellationToken)
    {
        var req = await _unitOfWork.AssistanceRequests.GetByIdAsync(requestId, cancellationToken);
        if (req == null)
        {
            return NotFound();
        }

        var shelters = await _unitOfWork.Shelters.GetAllAsync(cancellationToken);
        var ai = _aiProviderFactory.CreateProvider();
        var candidates = await ai.RecommendSheltersForRequestAsync(req, shelters, cancellationToken);
        return Ok(candidates);
    }

    [HttpPost("shelters")]
    [Authorize(Roles = "ShelterAdmin,EmergencyCoordinator,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> CreateShelter([FromBody] CreateShelterDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Address))
        {
            return BadRequest(new { message = "Shelter name and address are required." });
        }

        Guid crisisId = dto.CrisisEventId ?? Guid.Empty;
        if (crisisId == Guid.Empty)
        {
            var crises = await _unitOfWork.CrisisEvents.GetAllAsync(cancellationToken);
            crisisId = crises.OrderByDescending(c => c.IsActive).ThenByDescending(c => c.CreatedAtUtc).FirstOrDefault()?.Id ?? Guid.Empty;
        }

        var shelter = new Shelter
        {
            Name = dto.Name.Trim(),
            CrisisEventId = crisisId,
            Address = dto.Address.Trim(),
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            TotalCapacity = Math.Max(1, dto.TotalCapacity),
            CurrentOccupancy = Math.Clamp(dto.CurrentOccupancy, 0, Math.Max(1, dto.TotalCapacity)),
            IsWheelchairAccessible = dto.IsWheelchairAccessible,
            HasMedicalFacility = dto.HasMedicalFacility,
            HasCleanWater = dto.HasCleanWater,
            HasPowerBackup = dto.HasPowerBackup,
            HasChildSafeSpace = dto.HasChildSafeSpace,
            AvailableServices = dto.AvailableServices?.Trim() ?? string.Empty,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Operational" : dto.Status.Trim(),
            ManagedByOrganisationId = dto.ManagedByOrganisationId
        };

        await _unitOfWork.Shelters.AddAsync(shelter, cancellationToken);
        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "Shelters",
            ActionName = "Shelter_Created",
            EntityType = nameof(Shelter),
            EntityId = shelter.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "ShelterAdmin",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "ShelterAdmin",
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new { shelter.Name, shelter.Address, shelter.TotalCapacity })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(shelter);
    }

    [HttpPut("shelters/{id:guid}")]
    [Authorize(Roles = "ShelterAdmin,EmergencyCoordinator,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> UpdateShelter(Guid id, [FromBody] UpdateShelterDto dto, CancellationToken cancellationToken)
    {
        var shelter = await _unitOfWork.Shelters.GetByIdAsync(id, cancellationToken);
        if (shelter == null)
        {
            return NotFound(new { message = "Shelter not found." });
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { message = "Shelter name is required." });
        }

        shelter.Name = dto.Name.Trim();
        shelter.Address = dto.Address?.Trim() ?? string.Empty;
        shelter.TotalCapacity = Math.Max(1, dto.TotalCapacity);
        shelter.CurrentOccupancy = Math.Clamp(dto.CurrentOccupancy, 0, shelter.TotalCapacity);
        shelter.IsWheelchairAccessible = dto.IsWheelchairAccessible;
        shelter.HasMedicalFacility = dto.HasMedicalFacility;
        shelter.HasPowerBackup = dto.HasPowerBackup;
        shelter.Status = string.IsNullOrWhiteSpace(dto.Status) ? "Operational" : dto.Status.Trim();
        shelter.Latitude = dto.Latitude;
        shelter.Longitude = dto.Longitude;

        await _unitOfWork.Shelters.UpdateAsync(shelter, cancellationToken);

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "Shelters",
            ActionName = "Admin_UpdatedShelter",
            EntityType = nameof(Shelter),
            EntityId = shelter.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "SystemAdmin",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "SystemAdmin",
            DetailsJson = JsonSerializer.Serialize(new { shelter.Name, shelter.TotalCapacity, shelter.CurrentOccupancy, shelter.Status })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(shelter);
    }

    [HttpDelete("shelters/{id:guid}")]
    [Authorize(Roles = "SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> DeleteShelter(Guid id, CancellationToken cancellationToken)
    {
        var shelter = await _unitOfWork.Shelters.GetByIdAsync(id, cancellationToken);
        if (shelter == null)
        {
            return NotFound(new { message = "Shelter not found." });
        }

        var allocs = await _unitOfWork.ShelterAllocations.FindAsync(a => a.ShelterId == id, cancellationToken);
        foreach (var alloc in allocs)
        {
            await _unitOfWork.ShelterAllocations.DeleteAsync(alloc, cancellationToken);
        }

        await _unitOfWork.Shelters.DeleteAsync(shelter, cancellationToken);

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "Shelters",
            ActionName = "Admin_DeletedShelter",
            EntityType = nameof(Shelter),
            EntityId = shelter.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "SystemAdmin",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "SystemAdmin",
            DetailsJson = JsonSerializer.Serialize(new { shelter.Name, shelter.Address })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(new { deletedShelterId = id });
    }

    [HttpPost("shelters/allocate")]
    [Authorize(Roles = "ShelterAdmin,EmergencyCoordinator,CaseManager,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> AllocateShelter([FromBody] AllocateShelterRequestDto dto, CancellationToken cancellationToken)
    {
        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : Guid.Empty;
        var actorName = User.FindFirstValue(ClaimTypes.Name) ?? "Shelter Administrator";
        var roleStr = User.FindFirstValue(ClaimTypes.Role) ?? "ShelterAdmin";
        Enum.TryParse<UserRole>(roleStr, out var actorRole);

        var allocation = await _opsService.AllocateShelterAsync(actorId, actorName, actorRole, dto, cancellationToken);
        return Ok(allocation);
    }

    [HttpPost("shelters/allocations/{id:guid}/checkout")]
    [Authorize(Roles = "ShelterAdmin,EmergencyCoordinator,CaseManager,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> CheckoutShelterAllocation(
        Guid id,
        [FromBody] CheckoutShelterAllocationDto? dto,
        CancellationToken cancellationToken)
    {
        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : Guid.Empty;
        var actorName = User.FindFirstValue(ClaimTypes.Name) ?? "Shelter Administrator";
        var roleStr = User.FindFirstValue(ClaimTypes.Role) ?? "ShelterAdmin";
        Enum.TryParse<UserRole>(roleStr, out var actorRole);

        var allocation = await _opsService.CheckoutShelterAllocationAsync(
            actorId,
            actorName,
            actorRole,
            id,
            dto?.DischargeNotes,
            cancellationToken);
        return Ok(allocation);
    }

    [HttpGet("logistics/alerts")]
    [Authorize]
    public async Task<ActionResult<List<SitRepLowStockAlertDto>>> GetWarehouseStockAndExpiryAlerts(CancellationToken cancellationToken)
    {
        var resources = await _unitOfWork.Resources.GetAllAsync(cancellationToken);
        var alerts = BuildWarehouseAlerts(resources);
        return Ok(alerts);
    }

    [HttpGet("reports/sitrep")]
    [Authorize]
    public async Task<ActionResult<SitRepReportDto>> GetSituationReport(CancellationToken cancellationToken)
    {
        var crises = await _unitOfWork.CrisisEvents.GetAllAsync(cancellationToken);
        var activeCrisis = crises.OrderByDescending(c => c.IsActive).ThenByDescending(c => c.CreatedAtUtc).FirstOrDefault();
        var requests = await _unitOfWork.AssistanceRequests.GetAllAsync(cancellationToken);
        var shelters = await _unitOfWork.Shelters.GetAllAsync(cancellationToken);
        var allocations = await _unitOfWork.ShelterAllocations.GetAllAsync(cancellationToken);
        var campaigns = await _unitOfWork.DonationCampaigns.GetAllAsync(cancellationToken);
        var feedbacks = await _unitOfWork.RequestFeedbacks.GetAllAsync(cancellationToken);
        var resources = await _unitOfWork.Resources.GetAllAsync(cancellationToken);

        int unresolved = requests.Count(r =>
            r.Status != RequestStatus.Fulfilled &&
            r.Status != RequestStatus.Closed &&
            r.Status != RequestStatus.MergedAsDuplicate &&
            r.Status != RequestStatus.Rejected);

        int criticalOpen = requests.Count(r =>
            r.FinalApprovedUrgency >= UrgencyLevel.Critical &&
            r.Status != RequestStatus.Fulfilled &&
            r.Status != RequestStatus.Closed);

        int activeShelterCheckIns = allocations.Count(a =>
            !string.Equals(a.AllocationStatus, "CheckedOut", StringComparison.OrdinalIgnoreCase));

        double avgRating = feedbacks.Count > 0 ? Math.Round(feedbacks.Average(f => f.Rating), 2) : 0.0;
        var warehouseAlerts = BuildWarehouseAlerts(resources);

        var report = new SitRepReportDto(
            DateTime.UtcNow,
            User.FindFirstValue(ClaimTypes.Name) ?? "Humanitarian Coordinator",
            activeCrisis?.Title ?? "No Active Crisis Declared",
            activeCrisis?.Region ?? "N/A",
            activeCrisis?.Severity.ToString() ?? "N/A",
            requests.Count,
            unresolved,
            criticalOpen,
            shelters.Sum(s => s.TotalCapacity),
            shelters.Sum(s => s.CurrentOccupancy),
            activeShelterCheckIns,
            campaigns.Sum(c => c.CollectedAmountUsd),
            campaigns.Sum(c => c.DisbursedAmountUsd),
            avgRating,
            feedbacks.Count,
            warehouseAlerts
        );

        return Ok(report);
    }

    private static List<SitRepLowStockAlertDto> BuildWarehouseAlerts(IReadOnlyList<ResourceItem> resources)
    {
        var alerts = new List<SitRepLowStockAlertDto>();
        foreach (var r in resources)
        {
            bool isLowStock = r.AvailableQuantity <= r.ReorderThreshold;
            int? daysUntilExpiry = r.ExpiryDateUtc.HasValue
                ? (int)Math.Ceiling((r.ExpiryDateUtc.Value - DateTime.UtcNow).TotalDays)
                : null;
            bool isExpiringSoon = daysUntilExpiry.HasValue && daysUntilExpiry.Value <= 30;

            if (!isLowStock && !isExpiringSoon)
            {
                continue;
            }

            string reason = (isLowStock && isExpiringSoon)
                ? $"Low Stock ({r.AvailableQuantity}/{r.ReorderThreshold}) & Expiring in {daysUntilExpiry}d"
                : isLowStock
                    ? $"Below Reorder Threshold ({r.AvailableQuantity} <= {r.ReorderThreshold} {r.Unit})"
                    : $"FEFO Expiry Alert ({daysUntilExpiry} days left)";

            alerts.Add(new SitRepLowStockAlertDto(
                r.Id,
                r.Name,
                r.Category.ToString(),
                r.WarehouseName,
                r.AvailableQuantity,
                r.ReorderThreshold,
                r.ExpiryDateUtc,
                daysUntilExpiry,
                reason
            ));
        }

        return alerts;
    }

    [HttpPost("shelters/{id:guid}/request-supplies")]
    [Authorize(Roles = "ShelterAdmin,EmergencyCoordinator,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> RequestShelterSupplies(Guid id, [FromBody] RequestShelterSuppliesDto dto, CancellationToken cancellationToken)
    {
        var shelter = await _unitOfWork.Shelters.GetByIdAsync(id, cancellationToken);
        if (shelter == null)
        {
            return NotFound(new { message = "Shelter not found." });
        }

        var supplyReq = new PartnerAidRequest
        {
            RequestingOrganisationId = shelter.ManagedByOrganisationId ?? Guid.Empty,
            NeededCategory = dto.Category,
            ResourceName = dto.ResourceName.Trim(),
            QuantityNeeded = dto.QuantityNeeded,
            Justification = $"Shelter '{shelter.Name}' supply request: {dto.Justification.Trim()}",
            Status = "OpenShelterSupplyRequest"
        };

        await _unitOfWork.PartnerAidRequests.AddAsync(supplyReq, cancellationToken);
        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "Shelters",
            ActionName = "Shelter_RequestedAdditionalSupplies",
            EntityType = nameof(PartnerAidRequest),
            EntityId = supplyReq.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "ShelterAdmin",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "ShelterAdmin",
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new { ShelterName = shelter.Name, supplyReq.ResourceName, supplyReq.QuantityNeeded })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(supplyReq);
    }

    [HttpGet("volunteers")]
    [Authorize]
    public async Task<ActionResult> GetVolunteers(CancellationToken cancellationToken)
    {
        var volunteers = await _unitOfWork.Volunteers.GetAllAsync(cancellationToken);
        var assignments = await _unitOfWork.VolunteerAssignments.GetAllAsync(cancellationToken);
        return Ok(new
        {
            Volunteers = volunteers,
            Assignments = assignments
        });
    }

    [HttpPost("volunteers")]
    [Authorize]
    public async Task<ActionResult> RegisterVolunteer([FromBody] CreateVolunteerProfileDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName))
        {
            return BadRequest(new { message = "Volunteer full name is required." });
        }

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : Guid.Empty;
        var callerRole = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        bool autoVerified = callerRole != nameof(UserRole.Volunteer);
        var volunteer = new VolunteerProfile
        {
            UserId = actorId,
            FullName = dto.FullName.Trim(),
            SkillsCsv = dto.SkillsCsv?.Trim() ?? string.Empty,
            LanguagesCsv = string.IsNullOrWhiteSpace(dto.LanguagesCsv) ? "en" : dto.LanguagesCsv.Trim(),
            IsVerified = autoVerified,
            IsAvailable = true,
            AvailabilitySchedule = string.IsNullOrWhiteSpace(dto.AvailabilitySchedule) ? "Available On-Call" : dto.AvailabilitySchedule.Trim(),
            CurrentLatitude = dto.CurrentLatitude,
            CurrentLongitude = dto.CurrentLongitude,
            CompletedTasksCount = 0
        };

        await _unitOfWork.Volunteers.AddAsync(volunteer, cancellationToken);
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "VolunteerOperations",
            ActionName = "Volunteer_Registered",
            EntityType = nameof(VolunteerProfile),
            EntityId = volunteer.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? volunteer.FullName,
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "Volunteer",
            DetailsJson = JsonSerializer.Serialize(new { volunteer.FullName, volunteer.SkillsCsv, volunteer.IsVerified })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(volunteer);
    }

    [HttpPost("volunteers/{id:guid}/verify-activate")]
    [Authorize(Roles = "VolunteerCoordinator,EmergencyCoordinator,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> VerifyAndActivateVolunteer(Guid id, CancellationToken cancellationToken)
    {
        var volunteer = await _unitOfWork.Volunteers.GetByIdAsync(id, cancellationToken);
        if (volunteer == null)
        {
            return NotFound(new { message = "Volunteer profile not found." });
        }

        volunteer.IsVerified = true;
        volunteer.IsAvailable = true;
        await _unitOfWork.Volunteers.UpdateAsync(volunteer, cancellationToken);

        if (volunteer.UserId != Guid.Empty)
        {
            var linkedUser = await _unitOfWork.Users.GetByIdAsync(volunteer.UserId, cancellationToken);
            if (linkedUser != null)
            {
                linkedUser.AccountStatus = "Active";
                linkedUser.IsActive = true;
                await _unitOfWork.Users.UpdateAsync(linkedUser, cancellationToken);
            }
        }

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "VolunteerOperations",
            ActionName = "VolunteerCoordinator_VerifiedVolunteer",
            EntityType = nameof(VolunteerProfile),
            EntityId = volunteer.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "VolunteerCoordinator",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "VolunteerCoordinator",
            DetailsJson = JsonSerializer.Serialize(new { volunteer.FullName, volunteer.UserId, Verified = true })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(volunteer);
    }

    [HttpDelete("volunteers/{id:guid}")]
    [Authorize(Roles = "VolunteerCoordinator,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> DeleteVolunteer(Guid id, CancellationToken cancellationToken)
    {
        var volunteer = await _unitOfWork.Volunteers.GetByIdAsync(id, cancellationToken);
        if (volunteer == null)
        {
            return NotFound(new { message = "Volunteer profile not found." });
        }

        var assignments = await _unitOfWork.VolunteerAssignments.FindAsync(a => a.VolunteerProfileId == id, cancellationToken);
        foreach (var assign in assignments)
        {
            await _unitOfWork.VolunteerAssignments.DeleteAsync(assign, cancellationToken);
        }

        await _unitOfWork.Volunteers.DeleteAsync(volunteer, cancellationToken);

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "VolunteerOperations",
            ActionName = "Admin_DeletedVolunteer",
            EntityType = nameof(VolunteerProfile),
            EntityId = volunteer.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "SystemAdmin",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "SystemAdmin",
            DetailsJson = JsonSerializer.Serialize(new { volunteer.FullName })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(new { deletedVolunteerId = id });
    }

    [HttpGet("volunteers/match")]
    [Authorize]
    public async Task<ActionResult> MatchVolunteers(
        [FromQuery] string skill = "Medicine",
        [FromQuery] double lat = 6.6828,
        [FromQuery] double lon = 80.3992,
        CancellationToken cancellationToken = default)
    {
        var volunteers = await _unitOfWork.Volunteers.GetAllAsync(cancellationToken);
        var ai = _aiProviderFactory.CreateProvider();
        var matches = await ai.RecommendVolunteersForTaskAsync(skill, lat, lon, volunteers, cancellationToken);
        return Ok(matches);
    }

    [HttpPost("volunteers/assign")]
    [Authorize(Roles = "VolunteerCoordinator,PartnerOfficer,EmergencyCoordinator,SystemAdmin,OrganizationAdmin")]
    public async Task<ActionResult> AssignVolunteerTask([FromBody] AssignVolunteerTaskDto dto, CancellationToken cancellationToken)
    {
        var volunteer = await _unitOfWork.Volunteers.GetByIdAsync(dto.VolunteerProfileId, cancellationToken);
        if (volunteer == null)
        {
            return NotFound(new { message = "Volunteer profile not found." });
        }

        double targetLat = volunteer.CurrentLatitude;
        double targetLon = volunteer.CurrentLongitude;
        double distKm = 1.8;
        if (dto.AssistanceRequestId.HasValue)
        {
            var req = await _unitOfWork.AssistanceRequests.GetByIdAsync(dto.AssistanceRequestId.Value, cancellationToken);
            if (req != null)
            {
                targetLat = req.Latitude;
                targetLon = req.Longitude;
                distKm = _mappingService.CalculateDistanceKm(volunteer.CurrentLatitude, volunteer.CurrentLongitude, req.Latitude, req.Longitude);
            }
        }

        var ai = _aiProviderFactory.CreateProvider();
        var scored = await ai.RecommendVolunteersForTaskAsync(dto.RequiredSkill, targetLat, targetLon, new[] { volunteer }, cancellationToken);
        double matchScore = scored.FirstOrDefault()?.MatchScore
            ?? Math.Round((volunteer.SkillsCsv.Contains(dto.RequiredSkill, StringComparison.OrdinalIgnoreCase) ? 60.0 : 25.0) + Math.Max(0, 40.0 - distKm * 0.8), 1);

        var assignment = new VolunteerTaskAssignment
        {
            VolunteerProfileId = volunteer.Id,
            AssistanceRequestId = dto.AssistanceRequestId,
            TaskTitle = dto.TaskTitle,
            RequiredSkill = dto.RequiredSkill,
            AiMatchScore = matchScore,
            DistanceKm = distKm,
            Status = "Assigned"
        };

        await _unitOfWork.VolunteerAssignments.AddAsync(assignment, cancellationToken);

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "VolunteerOperations",
            ActionName = "VolunteerTask_Assigned",
            EntityType = nameof(VolunteerTaskAssignment),
            EntityId = assignment.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "VolunteerCoordinator",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "VolunteerCoordinator",
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new { volunteer.FullName, assignment.TaskTitle, assignment.RequiredSkill, assignment.AiMatchScore })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _eventPublisher.PublishAsync(new VolunteerAssignedEvent(
            Guid.NewGuid(),
            DateTime.UtcNow,
            assignment.Id,
            volunteer.UserId,
            volunteer.FullName,
            assignment.TaskTitle
        ), cancellationToken);

        return Ok(assignment);
    }

    [HttpPut("volunteers/me/availability")]
    [Authorize]
    public async Task<ActionResult> UpdateMyVolunteerAvailability([FromBody] UpdateVolunteerAvailabilityDto dto, CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var profiles = await _unitOfWork.Volunteers.FindAsync(v => v.UserId == userId, cancellationToken);
        var profile = profiles.FirstOrDefault();
        if (profile == null)
        {
            return NotFound(new { message = "Volunteer profile not found for signed-in account." });
        }

        profile.IsAvailable = dto.IsAvailable;
        profile.AvailabilitySchedule = dto.AvailabilitySchedule.Trim();
        if (dto.CurrentLatitude.HasValue) profile.CurrentLatitude = dto.CurrentLatitude.Value;
        if (dto.CurrentLongitude.HasValue) profile.CurrentLongitude = dto.CurrentLongitude.Value;
        profile.UpdatedAtUtc = DateTime.UtcNow;

        await _unitOfWork.Volunteers.UpdateAsync(profile, cancellationToken);
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "VolunteerOperations",
            ActionName = "Volunteer_UpdatedAvailability",
            EntityType = nameof(VolunteerProfile),
            EntityId = profile.Id.ToString(),
            ActorUserId = userId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? profile.FullName,
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "Volunteer",
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new { profile.IsAvailable, profile.AvailabilitySchedule })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(profile);
    }

    [HttpPost("volunteers/assignments/{id:guid}/respond")]
    [Authorize]
    public async Task<ActionResult> RespondToVolunteerAssignment(Guid id, [FromBody] RespondVolunteerAssignmentDto dto, CancellationToken cancellationToken)
    {
        var assignment = await _unitOfWork.VolunteerAssignments.GetByIdAsync(id, cancellationToken);
        if (assignment == null)
        {
            return NotFound(new { message = "Volunteer assignment not found." });
        }

        var profile = await _unitOfWork.Volunteers.GetByIdAsync(assignment.VolunteerProfileId, cancellationToken);
        var callerId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : Guid.Empty;
        var callerRole = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        bool isCoordinator = callerRole is "VolunteerCoordinator" or "EmergencyCoordinator" or "SystemAdmin" or "OrganizationAdmin";
        if (!isCoordinator && profile != null && profile.UserId != callerId)
        {
            return Forbid();
        }

        string decision = dto.Decision.Trim();
        if (!decision.Equals("Accepted", StringComparison.OrdinalIgnoreCase) &&
            !decision.Equals("Declined", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Decision must be 'Accepted' or 'Declined'." });
        }

        assignment.Status = decision.Equals("Accepted", StringComparison.OrdinalIgnoreCase) ? "Accepted" : "Declined";
        if (!string.IsNullOrWhiteSpace(dto.Notes))
        {
            assignment.CompletionNotes = dto.Notes.Trim();
        }
        assignment.UpdatedAtUtc = DateTime.UtcNow;

        await _unitOfWork.VolunteerAssignments.UpdateAsync(assignment, cancellationToken);
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "VolunteerOperations",
            ActionName = $"VolunteerAssignment_{assignment.Status}",
            EntityType = nameof(VolunteerTaskAssignment),
            EntityId = assignment.Id.ToString(),
            ActorUserId = callerId == Guid.Empty ? null : callerId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "Volunteer",
            ActorRole = callerRole,
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new { assignment.TaskTitle, assignment.Status, dto.Notes })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(assignment);
    }

    [HttpPost("volunteers/assignments/{id:guid}/complete")]
    [Authorize]
    public async Task<ActionResult> CompleteVolunteerAssignment(Guid id, [FromBody] CompleteVolunteerAssignmentDto dto, CancellationToken cancellationToken)
    {
        var assignment = await _unitOfWork.VolunteerAssignments.GetByIdAsync(id, cancellationToken);
        if (assignment == null)
        {
            return NotFound(new { message = "Volunteer assignment not found." });
        }

        var profile = await _unitOfWork.Volunteers.GetByIdAsync(assignment.VolunteerProfileId, cancellationToken);
        var callerId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : Guid.Empty;
        var callerRole = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        bool isCoordinator = callerRole is "VolunteerCoordinator" or "EmergencyCoordinator" or "SystemAdmin" or "OrganizationAdmin";
        if (!isCoordinator && profile != null && profile.UserId != callerId)
        {
            return Forbid();
        }

        if (assignment.Status != "Completed")
        {
            assignment.Status = "Completed";
            assignment.CompletionNotes = dto.CompletionNotes.Trim();
            assignment.CompletedAtUtc = DateTime.UtcNow;
            assignment.UpdatedAtUtc = DateTime.UtcNow;
            await _unitOfWork.VolunteerAssignments.UpdateAsync(assignment, cancellationToken);

            if (profile != null)
            {
                profile.CompletedTasksCount += 1;
                profile.UpdatedAtUtc = DateTime.UtcNow;
                await _unitOfWork.Volunteers.UpdateAsync(profile, cancellationToken);
            }

            await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
            {
                EventCategory = "VolunteerOperations",
                ActionName = "VolunteerAssignment_Completed",
                EntityType = nameof(VolunteerTaskAssignment),
                EntityId = assignment.Id.ToString(),
                ActorUserId = callerId == Guid.Empty ? null : callerId,
                ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "Volunteer",
                ActorRole = callerRole,
                IpAddress = GetClientIp(),
                DetailsJson = JsonSerializer.Serialize(new { assignment.TaskTitle, assignment.CompletionNotes, CompletedAt = assignment.CompletedAtUtc })
            }, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return Ok(assignment);
    }

    [HttpGet("donations")]
    [Authorize]
    public async Task<ActionResult> GetDonations(CancellationToken cancellationToken)
    {
        var campaigns = await _unitOfWork.DonationCampaigns.GetAllAsync(cancellationToken);
        var donations = await _unitOfWork.Donations.GetAllAsync(cancellationToken);
        return Ok(new
        {
            Campaigns = campaigns,
            Donations = donations
        });
    }

    [HttpPost("donations/campaigns")]
    [Authorize(Roles = "DonorOfficer,EmergencyCoordinator,SystemAdmin")]
    public async Task<ActionResult> CreateDonationCampaign([FromBody] CreateDonationCampaignDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return BadRequest(new { message = "Campaign title is required." });
        }

        Guid crisisEventId = dto.CrisisEventId ?? Guid.Empty;
        if (crisisEventId == Guid.Empty)
        {
            var crises = await _unitOfWork.CrisisEvents.GetAllAsync(cancellationToken);
            crisisEventId = crises.OrderByDescending(c => c.CreatedAtUtc).FirstOrDefault()?.Id ?? Guid.Empty;
        }

        var campaign = new DonationCampaign
        {
            Title = dto.Title.Trim(),
            CrisisEventId = crisisEventId,
            TargetAmountUsd = dto.TargetAmountUsd > 0 ? dto.TargetAmountUsd : 50000m,
            CollectedAmountUsd = 0m,
            DisbursedAmountUsd = 0m,
            IsActive = true
        };

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.DonationCampaigns.AddAsync(campaign, cancellationToken);
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "Donations",
            ActionName = "DonationCampaign_Created",
            EntityType = nameof(DonationCampaign),
            EntityId = campaign.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "Donor Officer",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "DonorOfficer",
            DetailsJson = JsonSerializer.Serialize(new { campaign.Title, campaign.TargetAmountUsd, campaign.CrisisEventId })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(campaign);
    }

    [HttpDelete("donations/campaigns/{id:guid}")]
    [Authorize(Roles = "DonorOfficer,SystemAdmin")]
    public async Task<ActionResult> DeleteDonationCampaign(Guid id, CancellationToken cancellationToken)
    {
        var campaign = await _unitOfWork.DonationCampaigns.GetByIdAsync(id, cancellationToken);
        if (campaign == null)
        {
            return NotFound(new { message = "Donation campaign not found." });
        }

        var donations = await _unitOfWork.Donations.FindAsync(d => d.CampaignId == id, cancellationToken);
        foreach (var d in donations)
        {
            await _unitOfWork.Donations.DeleteAsync(d, cancellationToken);
        }

        var expenditures = await _unitOfWork.CampaignExpenditures.FindAsync(e => e.CampaignId == id, cancellationToken);
        foreach (var exp in expenditures)
        {
            await _unitOfWork.CampaignExpenditures.DeleteAsync(exp, cancellationToken);
        }

        await _unitOfWork.DonationCampaigns.DeleteAsync(campaign, cancellationToken);

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "Donations",
            ActionName = "Admin_DeletedCampaign",
            EntityType = nameof(DonationCampaign),
            EntityId = campaign.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "SystemAdmin",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "SystemAdmin",
            DetailsJson = JsonSerializer.Serialize(new { campaign.Title })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(new { deletedCampaignId = id });
    }

    [HttpPost("donations")]
    [Authorize]
    public async Task<ActionResult> RecordDonation([FromBody] CreateDonationDto dto, CancellationToken cancellationToken)
    {
        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        var record = await _opsService.RecordDonationAsync(actorId, dto, cancellationToken);
        return Ok(record);
    }

    [HttpPost("donations/{id:guid}/approve")]
    [Authorize(Roles = "DonorOfficer,EmergencyCoordinator,SystemAdmin")]
    public async Task<ActionResult> ApproveSuspiciousDonation(Guid id, CancellationToken cancellationToken)
    {
        var donation = await _unitOfWork.Donations.GetByIdAsync(id, cancellationToken);
        if (donation == null)
        {
            return NotFound();
        }

        if (!donation.IsReviewedByHuman)
        {
            donation.IsReviewedByHuman = true;
            donation.VerificationStatus = "HumanComplianceApproved";
            await _unitOfWork.Donations.UpdateAsync(donation, cancellationToken);

            var campaign = await _unitOfWork.DonationCampaigns.GetByIdAsync(donation.CampaignId, cancellationToken);
            if (campaign != null && donation.MonetaryAmountUsd > 0)
            {
                campaign.CollectedAmountUsd += donation.MonetaryAmountUsd;
                await _unitOfWork.DonationCampaigns.UpdateAsync(campaign, cancellationToken);
            }

            var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
            await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
            {
                EventCategory = "DonationCompliance",
                ActionName = "Donation_HumanComplianceApproved",
                EntityType = nameof(DonationRecord),
                EntityId = donation.Id.ToString(),
                ActorUserId = actorId,
                ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "DonorOfficer",
                ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "DonorOfficer",
                IpAddress = GetClientIp(),
                DetailsJson = JsonSerializer.Serialize(new { donation.DonorName, donation.MonetaryAmountUsd, donation.CampaignId })
            }, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return Ok(donation);
    }

    [HttpPost("donations/{id:guid}/reject")]
    [Authorize(Roles = "DonorOfficer,EmergencyCoordinator,SystemAdmin")]
    public async Task<ActionResult> RejectSuspiciousDonation(Guid id, CancellationToken cancellationToken)
    {
        var donation = await _unitOfWork.Donations.GetByIdAsync(id, cancellationToken);
        if (donation == null)
        {
            return NotFound();
        }

        donation.IsReviewedByHuman = true;
        donation.VerificationStatus = "ComplianceRejected";
        await _unitOfWork.Donations.UpdateAsync(donation, cancellationToken);

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;
        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "DonationCompliance",
            ActionName = "Donation_ComplianceRejected",
            EntityType = nameof(DonationRecord),
            EntityId = donation.Id.ToString(),
            ActorUserId = actorId,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "DonorOfficer",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "DonorOfficer",
            IpAddress = GetClientIp(),
            DetailsJson = JsonSerializer.Serialize(new { donation.DonorName, donation.MonetaryAmountUsd, donation.CampaignId })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(donation);
    }

    [HttpPost("donations/campaigns/{campaignId:guid}/expenditures")]
    [Authorize(Roles = "DonorOfficer,EmergencyCoordinator,SystemAdmin")]
    public async Task<ActionResult> RecordCampaignExpenditure(
        Guid campaignId,
        [FromBody] CreateCampaignExpenditureDto dto,
        CancellationToken cancellationToken)
    {
        if (dto.AmountUsd <= 0)
        {
            return BadRequest(new { message = "Expenditure amount must be greater than zero." });
        }

        var actorId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : Guid.Empty;
        var actorName = User.FindFirstValue(ClaimTypes.Name) ?? "Donor Officer";
        var actorRole = User.FindFirstValue(ClaimTypes.Role) ?? "DonorOfficer";

        CampaignExpenditure? expenditure = null;
        await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            var campaign = await _unitOfWork.DonationCampaigns.GetByIdAsync(campaignId, cancellationToken)
                ?? throw new KeyNotFoundException("Donation campaign not found.");

            decimal remainingBalance = campaign.CollectedAmountUsd - campaign.DisbursedAmountUsd;
            if (dto.AmountUsd > remainingBalance)
            {
                throw new InvalidOperationException($"Insufficient verified campaign funds: only ${remainingBalance:N2} USD remains unallocated in '{campaign.Title}'.");
            }

            expenditure = new CampaignExpenditure
            {
                CampaignId = campaign.Id,
                AmountUsd = dto.AmountUsd,
                Category = dto.Category.Trim(),
                Description = dto.Description.Trim(),
                RecordedByUserId = actorId,
                RecordedByUserName = actorName,
                ApprovedAtUtc = DateTime.UtcNow
            };

            campaign.DisbursedAmountUsd += dto.AmountUsd;
            campaign.UpdatedAtUtc = DateTime.UtcNow;

            await _unitOfWork.CampaignExpenditures.AddAsync(expenditure, cancellationToken);
            await _unitOfWork.DonationCampaigns.UpdateAsync(campaign, cancellationToken);
            await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
            {
                EventCategory = "DonationCompliance",
                ActionName = "CampaignExpenditure_Recorded",
                EntityType = nameof(CampaignExpenditure),
                EntityId = expenditure.Id.ToString(),
                ActorUserId = actorId == Guid.Empty ? null : actorId,
                ActorUserName = actorName,
                ActorRole = actorRole,
                IpAddress = GetClientIp(),
                DetailsJson = JsonSerializer.Serialize(new { campaign.Title, expenditure.AmountUsd, expenditure.Category, expenditure.Description })
            }, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }, cancellationToken);

        return Ok(expenditure);
    }

    [HttpGet("donations/transparency-report")]
    [Authorize]
    public async Task<ActionResult> GetDonationTransparencyReport(CancellationToken cancellationToken)
    {
        var campaigns = await _unitOfWork.DonationCampaigns.GetAllAsync(cancellationToken);
        var donations = await _unitOfWork.Donations.GetAllAsync(cancellationToken);
        var expenditures = await _unitOfWork.CampaignExpenditures.GetAllAsync(cancellationToken);

        var campaignBreakdown = campaigns.Select(c =>
        {
            var campExps = expenditures.Where(e => e.CampaignId == c.Id).OrderByDescending(e => e.ApprovedAtUtc).ToList();
            decimal remaining = Math.Max(0m, c.CollectedAmountUsd - c.DisbursedAmountUsd);
            double utilisation = c.CollectedAmountUsd > 0
                ? Math.Round((double)(c.DisbursedAmountUsd / c.CollectedAmountUsd) * 100.0, 1)
                : 0.0;

            return new
            {
                CampaignId = c.Id,
                c.Title,
                c.TargetAmountUsd,
                c.CollectedAmountUsd,
                c.DisbursedAmountUsd,
                RemainingBalanceUsd = remaining,
                UtilisationPercentage = utilisation,
                Expenditures = campExps
            };
        }).ToList();

        var expenditureByCategory = expenditures
            .GroupBy(e => e.Category)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.AmountUsd));

        return Ok(new
        {
            TotalCollectedUsd = campaigns.Sum(c => c.CollectedAmountUsd),
            TotalDisbursedUsd = campaigns.Sum(c => c.DisbursedAmountUsd),
            TotalRemainingUsd = campaigns.Sum(c => Math.Max(0m, c.CollectedAmountUsd - c.DisbursedAmountUsd)),
            VerifiedDonationsCount = donations.Count(d => !d.IsFlaggedSuspicious || d.VerificationStatus == "HumanComplianceApproved"),
            PendingFlaggedDonationsCount = donations.Count(d => d.IsFlaggedSuspicious && !d.IsReviewedByHuman),
            RejectedDonationsCount = donations.Count(d => d.VerificationStatus == "ComplianceRejected"),
            ExpenditureByCategory = expenditureByCategory,
            Campaigns = campaignBreakdown
        });
    }

    [HttpGet("notifications")]
    [Authorize(Roles = "SystemAdmin,OrganizationAdmin,EmergencyCoordinator,CaseManager")]
    public async Task<ActionResult> GetNotifications(CancellationToken cancellationToken)
    {
        var notifications = await _unitOfWork.Notifications.GetAllAsync(cancellationToken);
        return Ok(notifications);
    }

    [HttpGet("notifications/me")]
    [Authorize]
    public async Task<ActionResult> GetMyNotifications(CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var mine = await _unitOfWork.Notifications.FindAsync(n => n.RecipientUserId == userId, cancellationToken);
        return Ok(mine.OrderByDescending(n => n.CreatedAtUtc));
    }

    [HttpPost("notifications/retry-failed")]
    [Authorize(Roles = "SystemAdmin,OrganizationAdmin,EmergencyCoordinator")]
    public async Task<ActionResult> RetryFailedNotifications(CancellationToken cancellationToken)
    {
        int recovered = await _opsService.RetryFailedNotificationsAsync(cancellationToken);
        return Ok(new { RecoveredCount = recovered });
    }

    [HttpPost("notifications/send")]
    [Authorize]
    public async Task<ActionResult> SendNotification([FromBody] SendNotificationRequestDto dto, CancellationToken cancellationToken)
    {
        var record = await _opsService.SendIdempotentNotificationAsync(dto, cancellationToken);
        return Ok(record);
    }

    [HttpGet("mapping/route")]
    [Authorize]
    public async Task<ActionResult<RouteCalculationDto>> CalculateRoute(
        [FromQuery] double originLat = 6.6890,
        [FromQuery] double originLon = 80.4020,
        [FromQuery] double destLat = 6.6828,
        [FromQuery] double destLon = 80.3992,
        CancellationToken cancellationToken = default)
    {
        var route = await _mappingService.CalculateRouteAsync(originLat, originLon, destLat, destLon, cancellationToken);
        return Ok(route);
    }

    [HttpGet("mapping/geocode")]
    [Authorize]
    public async Task<ActionResult<GeocodingResultDto>> Geocode([FromQuery] string address = "Ratnapura", CancellationToken cancellationToken = default)
    {
        var geo = await _mappingService.GeocodeAddressAsync(address, cancellationToken);
        return Ok(geo);
    }

    [HttpGet("mapping/reverse-geocode")]
    [Authorize]
    public async Task<ActionResult<GeocodingResultDto>> ReverseGeocode(
        [FromQuery] double latitude = 6.6828,
        [FromQuery] double longitude = 80.3992,
        CancellationToken cancellationToken = default)
    {
        var geo = await _mappingService.ReverseGeocodeAsync(latitude, longitude, cancellationToken);
        return Ok(geo);
    }

    [HttpGet("mapping/references")]
    [Authorize]
    public async Task<ActionResult> GetMappingReferences(CancellationToken cancellationToken)
    {
        var refs = await _unitOfWork.MappingReferences.GetAllAsync(cancellationToken);
        return Ok(refs);
    }

    [HttpGet("mapping/coverage-report")]
    [Authorize]
    public async Task<ActionResult> GetCoverageReport(CancellationToken cancellationToken)
    {
        var areas = await _unitOfWork.OperationalAreas.GetAllAsync(cancellationToken);
        var requests = await _unitOfWork.AssistanceRequests.GetAllAsync(cancellationToken);
        var shelters = await _unitOfWork.Shelters.GetAllAsync(cancellationToken);
        var resources = await _unitOfWork.Resources.GetAllAsync(cancellationToken);
        var refs = await _unitOfWork.MappingReferences.GetAllAsync(cancellationToken);

        var zoneReports = areas.Select(area =>
        {
            double radiusKm = area.CoverageRadiusKm > 0 ? area.CoverageRadiusKm : 15.0;
            int openRequestsInZone = requests.Count(r =>
                r.Status != RequestStatus.Closed &&
                r.Status != RequestStatus.Fulfilled &&
                r.Status != RequestStatus.MergedAsDuplicate &&
                _mappingService.CalculateDistanceKm(area.Latitude, area.Longitude, r.Latitude, r.Longitude) <= radiusKm);

            var nearbyShelters = shelters
                .Where(s => _mappingService.CalculateDistanceKm(area.Latitude, area.Longitude, s.Latitude, s.Longitude) <= radiusKm)
                .ToList();
            int availableBeds = nearbyShelters.Sum(s => Math.Max(0, s.TotalCapacity - s.CurrentOccupancy));

            int nearbyDepots = resources
                .Where(res => _mappingService.CalculateDistanceKm(area.Latitude, area.Longitude, res.WarehouseLatitude, res.WarehouseLongitude) <= radiusKm)
                .Select(res => res.WarehouseName)
                .Distinct()
                .Count();

            int serviceCentres = refs
                .Count(mr => _mappingService.CalculateDistanceKm(area.Latitude, area.Longitude, mr.Latitude, mr.Longitude) <= radiusKm);

            string coverageStatus = (nearbyShelters.Count == 0 || (openRequestsInZone > 0 && availableBeds < 10 && nearbyDepots == 0))
                ? "CriticalGap"
                : (availableBeds < 30 || openRequestsInZone > 2 ? "Strained" : "WellCovered");

            return new
            {
                AreaId = area.Id,
                area.ZoneName,
                area.District,
                area.RiskLevel,
                area.CoverageRadiusKm,
                area.EstimatedAffectedPopulation,
                OpenRequestsCount = openRequestsInZone,
                NearbySheltersCount = nearbyShelters.Count,
                AvailableShelterBeds = availableBeds,
                NearbyDepotsCount = nearbyDepots,
                ServiceCentresCount = serviceCentres,
                CoverageStatus = coverageStatus
            };
        }).ToList();

        return Ok(new
        {
            TotalOperationalZones = zoneReports.Count,
            CriticalGapZonesCount = zoneReports.Count(z => z.CoverageStatus == "CriticalGap"),
            Zones = zoneReports
        });
    }

    [HttpGet("admin/metrics")]
    [Authorize]
    public async Task<ActionResult<OperationalKpiMetricsDto>> GetMetrics(CancellationToken cancellationToken)
    {
        var metrics = await _opsService.GetOperationalMetricsAsync(cancellationToken);

        var snapshots = await _unitOfWork.OperationalKpiSnapshots.GetAllAsync(cancellationToken);
        var latest = snapshots.OrderByDescending(s => s.CapturedAtUtc).FirstOrDefault();
        if (latest == null || (DateTime.UtcNow - latest.CapturedAtUtc).TotalMinutes >= 15)
        {
            await _unitOfWork.OperationalKpiSnapshots.AddAsync(new OperationalKpiSnapshot
            {
                TotalRequests = metrics.TotalRequests,
                UnresolvedCasesCount = metrics.UnresolvedCasesCount,
                CriticalOpenCasesCount = metrics.CriticalOpenCasesCount,
                AverageResponseTimeMinutes = metrics.AverageResponseTimeMinutes,
                ResourceUtilisationPercentage = metrics.ResourceUtilisationPercentage,
                ShelterOccupancyPercentage = metrics.ShelterOccupancyPercentage,
                TotalDonationsCollectedUsd = metrics.TotalDonationsCollectedUsd,
                CapturedAtUtc = DateTime.UtcNow
            }, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return Ok(metrics);
    }

    [HttpGet("admin/metrics/history")]
    [Authorize]
    public async Task<ActionResult> GetMetricsHistory(CancellationToken cancellationToken)
    {
        var snapshots = await _unitOfWork.OperationalKpiSnapshots.GetAllAsync(cancellationToken);
        return Ok(snapshots.OrderBy(s => s.CapturedAtUtc));
    }

    [HttpGet("admin/audit-logs")]
    [Authorize(Roles = "SystemAdmin,OrganizationAdmin,EmergencyCoordinator")]
    public async Task<ActionResult> GetAuditLogs(CancellationToken cancellationToken)
    {
        var logs = await _unitOfWork.AuditEvents.GetAllAsync(cancellationToken);
        return Ok(logs);
    }

    [HttpGet("admin/resilience")]
    [Authorize]
    public ActionResult<ResilienceStatusDto> GetResilienceStatus()
    {
        return Ok(_resilienceMonitor.GetStatus());
    }

    [HttpPost("admin/resilience/toggle")]
    [Authorize(Roles = "SystemAdmin,OrganizationAdmin,EmergencyCoordinator")]
    public async Task<ActionResult<ResilienceStatusDto>> ToggleResilienceSimulation(
        [FromQuery] string service = "AI",
        [FromQuery] bool simulateFailure = false,
        CancellationToken cancellationToken = default)
    {
        if (service.Equals("AI", StringComparison.OrdinalIgnoreCase))
        {
            _resilienceMonitor.SimulateExternalAiFailure = simulateFailure;
        }
        else if (service.Equals("Mapping", StringComparison.OrdinalIgnoreCase))
        {
            _resilienceMonitor.SimulateExternalMappingFailure = simulateFailure;
        }
        else if (service.Equals("Notification", StringComparison.OrdinalIgnoreCase))
        {
            _resilienceMonitor.SimulateExternalNotificationFailure = simulateFailure;
        }

        await _unitOfWork.AuditEvents.AddAsync(new AuditEventRecord
        {
            EventCategory = "ResilienceSimulation",
            ActionName = $"ToggleExternalFailure_{service}",
            EntityType = "ExternalServiceCircuitBreaker",
            EntityId = service,
            ActorUserName = User.FindFirstValue(ClaimTypes.Name) ?? "SystemAdmin",
            ActorRole = User.FindFirstValue(ClaimTypes.Role) ?? "SystemAdmin",
            DetailsJson = JsonSerializer.Serialize(new { service, simulateFailure })
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(_resilienceMonitor.GetStatus());
    }
}
