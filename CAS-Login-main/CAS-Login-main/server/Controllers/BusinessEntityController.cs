using CAS_Login_Back_End.Models.Common;
using CAS_Login_Back_End.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CAS_Login_Back_End.Controllers;

/// <summary>
/// Business entity controller for business entity management.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "CasToken")]
public class BusinessEntityController : ControllerBase
{
    private readonly IBusinessEntityService _businessEntityService;
    private readonly IAccountIdentityService _accountIdentityService;
    private readonly ILogger<BusinessEntityController> _logger;

    public BusinessEntityController(
        IBusinessEntityService businessEntityService,
        IAccountIdentityService accountIdentityService,
        ILogger<BusinessEntityController> logger)
    {
        _businessEntityService = businessEntityService;
        _accountIdentityService = accountIdentityService;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves all active business entities.
    /// </summary>
    /// <remarks>
    /// GET /api/businessentity
    /// Authorization: Bearer {TOKEN}
    /// </remarks>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<dynamic>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _businessEntityService.GetAllAsync(cancellationToken);
            return Ok(ApiResponse<dynamic>.SuccessResponse(result, "Business entities retrieved successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get all business entities error");
            throw;
        }
    }

    /// <summary>
    /// Retrieves a specific business entity by ID.
    /// </summary>
    /// <remarks>
    /// GET /api/businessentity/{id}
    /// Authorization: Bearer {TOKEN}
    /// </remarks>
    [HttpGet("{id:long}")]
    public async Task<ActionResult<ApiResponse<dynamic>>> GetByIdAsync(
        long id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _businessEntityService.GetByIdAsync(id, cancellationToken);
            return Ok(ApiResponse<dynamic>.SuccessResponse(result, "Business entity retrieved successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get business entity by ID error");
            throw;
        }
    }

    /// <summary>
    /// Retrieves all business entities accessible to the current user.
    /// </summary>
    /// <remarks>
    /// GET /api/businessentity/my-entities
    /// Authorization: Bearer {TOKEN}
    /// </remarks>
    [HttpGet("my-entities")]
    public async Task<ActionResult<ApiResponse<dynamic>>> GetMyEntitiesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var accountId = await _accountIdentityService.ResolveAccountIdAsync(User, cancellationToken);
            if (!accountId.HasValue || accountId.Value > int.MaxValue)
            {
                return Unauthorized(ApiResponse<dynamic>.FailureResponse("Unauthorized."));
            }

            var result = await _businessEntityService.GetAccountBusinessEntitiesAsync((int)accountId.Value, cancellationToken);
            return Ok(ApiResponse<dynamic>.SuccessResponse(result, "Business entities retrieved successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get account business entities error");
            throw;
        }
    }
}
