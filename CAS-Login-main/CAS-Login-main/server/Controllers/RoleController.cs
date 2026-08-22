using CAS_Login_Back_End.Models.Common;
using CAS_Login_Back_End.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CAS_Login_Back_End.Controllers;

/// <summary>
/// Role controller for role management.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "CasToken")]
public class RoleController : ControllerBase
{
    private readonly IRoleService _roleService;
    private readonly IAccountIdentityService _accountIdentityService;
    private readonly ILogger<RoleController> _logger;

    public RoleController(
        IRoleService roleService,
        IAccountIdentityService accountIdentityService,
        ILogger<RoleController> logger)
    {
        _roleService = roleService;
        _accountIdentityService = accountIdentityService;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves all active roles.
    /// </summary>
    /// <remarks>
    /// GET /api/role
    /// Authorization: Bearer {TOKEN}
    /// </remarks>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<dynamic>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _roleService.GetAllAsync(cancellationToken);
            return Ok(ApiResponse<dynamic>.SuccessResponse(result, "Roles retrieved successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get all roles error");
            throw;
        }
    }

    /// <summary>
    /// Retrieves a specific role by ID.
    /// </summary>
    /// <remarks>
    /// GET /api/role/{id}
    /// Authorization: Bearer {TOKEN}
    /// </remarks>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<dynamic>>> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _roleService.GetByIdAsync(id, cancellationToken);
            return Ok(ApiResponse<dynamic>.SuccessResponse(result, "Role retrieved successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get role by ID error");
            throw;
        }
    }

    /// <summary>
    /// Retrieves the role of the current user in a business entity.
    /// </summary>
    /// <remarks>
    /// GET /api/role/account/{businessEntityId}
    /// Authorization: Bearer {TOKEN}
    /// </remarks>
    [HttpGet("account/{businessEntityId:long}")]
    public async Task<ActionResult<ApiResponse<dynamic>>> GetAccountRoleAsync(
        long businessEntityId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var accountId = await _accountIdentityService.ResolveAccountIdAsync(User, cancellationToken);
            if (!accountId.HasValue || accountId.Value > int.MaxValue)
            {
                return Unauthorized(ApiResponse<dynamic>.FailureResponse("Unauthorized."));
            }

            var result = await _roleService.GetAccountRoleAsync((int)accountId.Value, businessEntityId, cancellationToken);
            return Ok(ApiResponse<dynamic>.SuccessResponse(result, "Role retrieved successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get account role error");
            throw;
        }
    }
}
