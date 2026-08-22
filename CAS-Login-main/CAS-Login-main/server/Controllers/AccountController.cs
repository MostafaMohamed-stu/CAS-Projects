using CAS_Login_Back_End.Models.Common;
using CAS_Login_Back_End.Models.Requests;
using CAS_Login_Back_End.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CAS_Login_Back_End.Controllers;

/// <summary>
/// Account controller for user registration, profile management, and password operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AccountController : ControllerBase
{
    private readonly IAccountService _accountService;
    private readonly IAccountIdentityService _accountIdentityService;
    private readonly ILogger<AccountController> _logger;

    public AccountController(
        IAccountService accountService,
        IAccountIdentityService accountIdentityService,
        ILogger<AccountController> logger)
    {
        _accountService = accountService;
        _accountIdentityService = accountIdentityService;
        _logger = logger;
    }

    /// <summary>
    /// Registers a new user account.
    /// </summary>
    /// <remarks>
    /// POST /api/account/register
    /// </remarks>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<dynamic>>> RegisterAsync(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _accountService.RegisterAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetProfileAsync), new { }, 
                ApiResponse<dynamic>.SuccessResponse(result, "Account registered successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration error");
            throw;
        }
    }

    /// <summary>
    /// Retrieves current user profile.
    /// </summary>
    /// <remarks>
    /// GET /api/account/profile
    /// Authorization: Bearer {SSO_OR_SYSTEM_TOKEN}
    /// </remarks>
    [HttpGet("profile")]
    [Authorize(Policy = "CasToken")]
    public async Task<ActionResult<ApiResponse<dynamic>>> GetProfileAsync(
        CancellationToken cancellationToken = default)
    {
        try
        {
            var accountId = await _accountIdentityService.ResolveAccountIdAsync(User, cancellationToken);
            if (!accountId.HasValue || accountId.Value > int.MaxValue)
            {
                return Unauthorized(ApiResponse<dynamic>.FailureResponse("Unauthorized."));
            }

            var result = await _accountService.GetProfileAsync((int)accountId.Value, cancellationToken);
            return Ok(ApiResponse<dynamic>.SuccessResponse(result, "Profile retrieved successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get profile error");
            throw;
        }
    }

    /// <summary>
    /// Updates current user profile.
    /// </summary>
    /// <remarks>
    /// PUT /api/account/profile
    /// Authorization: Bearer {TOKEN}
    /// </remarks>
    [HttpPut("profile")]
    [Authorize(Policy = "CasToken")]
    public async Task<ActionResult<ApiResponse<dynamic>>> UpdateProfileAsync(
        [FromBody] UpdateProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var accountId = await _accountIdentityService.ResolveAccountIdAsync(User, cancellationToken);
            if (!accountId.HasValue || accountId.Value > int.MaxValue)
            {
                return Unauthorized(ApiResponse<dynamic>.FailureResponse("Unauthorized."));
            }

            var result = await _accountService.UpdateProfileAsync((int)accountId.Value, request, cancellationToken);
            return Ok(ApiResponse<dynamic>.SuccessResponse(result, "Profile updated successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Update profile error");
            throw;
        }
    }

    /// <summary>
    /// Changes password for current user.
    /// </summary>
    /// <remarks>
    /// POST /api/account/change-password
    /// Authorization: Bearer {TOKEN}
    /// </remarks>
    [HttpPost("change-password")]
    [Authorize(Policy = "CasToken")]
    public async Task<ActionResult<ApiResponse<dynamic>>> ChangePasswordAsync(
        [FromBody] ChangePasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var accountId = await _accountIdentityService.ResolveAccountIdAsync(User, cancellationToken);
            if (!accountId.HasValue || accountId.Value > int.MaxValue)
            {
                return Unauthorized(ApiResponse<dynamic>.FailureResponse("Unauthorized."));
            }

            await _accountService.ChangePasswordAsync((int)accountId.Value, request, cancellationToken);
            return Ok(ApiResponse<dynamic>.SuccessResponse(null, "Password changed successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Change password error");
            throw;
        }
    }

}
