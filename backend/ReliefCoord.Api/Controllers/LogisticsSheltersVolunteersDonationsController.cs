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
