using CAS_Login_Back_End.Models.Common;
using CAS_Login_Back_End.Models.Requests;
using CAS_Login_Back_End.Services.Interfaces;
using CAS_Login_Back_End.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CAS_Login_Back_End.Controllers;

/// <summary>
/// Authentication controller for login, token exchange, validation, and logout.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Authenticates a user and returns both the SSO token and the System JWT.
    /// Supports business entity ID or Name via route, header, or query.
    /// </summary>
    [HttpPost("login/{businessEntityIdOrName?}")]
    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status429TooManyRequests)]
    [EnableRateLimiting("login")]
    public async Task<ActionResult<ApiResponse<dynamic>>> LoginAsync(
        [FromRoute] string? businessEntityIdOrName,
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        var (entityId, entityName) = GetBusinessEntityFromRequest(businessEntityIdOrName);

        var result = await _authService.LoginAsync(
            request.Email,
            request.Password,
            entityId,
            entityName,
            cancellationToken);

        return Ok(ApiResponse<dynamic>.SuccessResponse(
            result,
            "Login successful."));
    }

    /// <summary>
    /// Exchanges a valid SSO or System token for a System JWT belonging to another Business Entity.
    /// Supports business entity ID or Name via header or JSON body.
    /// </summary>
    [HttpPost("switch")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<dynamic>>> ExchangeTokenAsync(
        [FromBody] ExchangeTokenRequest? request,
        CancellationToken cancellationToken = default)
    {
        var token = GetBearerToken();
        var (entityId, entityName) = GetBusinessEntityFromRequest(null, request?.BusinessEntityId, request?.BusinessEntityName);

        var result = await _authService.ExchangeTokenAsync(
            token,
            entityId,
            entityName,
            cancellationToken);

        return Ok(ApiResponse<dynamic>.SuccessResponse(
            result,
            "Token exchanged successfully."));
    }

    /// <summary>
    /// Validates an SSO or System JWT.
    /// </summary>
    [HttpPost("validate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<dynamic>>> ValidateTokenAsync(
        CancellationToken cancellationToken = default)
    {
        var token = GetBearerToken();

        var result = await _authService.ValidateTokenAsync(
            token,
            cancellationToken);

        return Ok(ApiResponse<dynamic>.SuccessResponse(
            result,
            "Token validation completed successfully."));
    }

    /// <summary>
    /// Logs out a system JWT selected by business entity ID and optionally revokes its SSO token.
    /// Other System JWTs remain valid.
    /// </summary>
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object?>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<dynamic>>> LogoutAsync(
        [FromQuery] bool revokeSso = false,
        CancellationToken cancellationToken = default)
    {
        var systemToken = GetBearerToken();

        var result = await _authService.LogoutAsync(
            systemToken,
            revokeSso,
            cancellationToken);

        return Ok(ApiResponse<dynamic>.SuccessResponse(
            result,
            "System logged out successfully."));
    }

    /// <summary>
    /// Extracts the Bearer token from the Authorization header.
    /// </summary>
    private string GetBearerToken()
    {
        if (!Request.Headers.TryGetValue("Authorization", out var authorizationHeader))
            throw new UnauthorizedException("Authorization header is missing.");

        const string bearerPrefix = "Bearer ";

        var header = authorizationHeader.ToString();

        if (!header.StartsWith(bearerPrefix, StringComparison.OrdinalIgnoreCase))
            throw new UnauthorizedException("Invalid Authorization header.");

        var token = header[bearerPrefix.Length..].Trim();

        return token;
    }

    private (long? id, string? name) GetBusinessEntityFromRequest(
        string? routeParam = null,
        long? requestBodyId = null,
        string? requestBodyName = null)
    {
        long? id = requestBodyId;
        string? name = requestBodyName;

        if (Request.Headers.TryGetValue("X-Business-Entity-Name", out var headerVal) ||
            Request.Headers.TryGetValue("BusinessEntityName", out headerVal) ||
            Request.Headers.TryGetValue("BusinessEntity", out headerVal) ||
            Request.Headers.TryGetValue("X-System-Name", out headerVal))
        {
            var headerStr = headerVal.ToString().Trim();
            if (long.TryParse(headerStr, out var parsedIdFromHeader))
                id = parsedIdFromHeader;
            else
                name = headerStr;
        }

        if (Request.Headers.TryGetValue("X-Business-Entity-Id", out var idHeader) ||
            Request.Headers.TryGetValue("BusinessEntityId", out idHeader))
        {
            if (long.TryParse(idHeader.ToString(), out var parsedId))
                id = parsedId;
        }

        if (!id.HasValue && string.IsNullOrWhiteSpace(name) && !string.IsNullOrWhiteSpace(routeParam))
        {
            if (long.TryParse(routeParam, out var parsed))
                id = parsed;
            else
                name = routeParam.Trim();
        }

        return (id, name);
    }
}
