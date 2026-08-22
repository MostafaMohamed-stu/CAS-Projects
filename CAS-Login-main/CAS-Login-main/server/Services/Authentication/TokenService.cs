using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CAS_Login_Back_End.Models.Authentication;
using CAS_Login_Back_End.Models.Configuration;
using CAS_Login_Back_End.Services.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CAS_Login_Back_End.Services.Authentication;

public sealed class TokenService : ITokenService
{
    private readonly JwtOptions _jwtOptions;
    private readonly ITokenRevocationService _tokenRevocationService;
    private readonly JwtSecurityTokenHandler _tokenHandler = new();

    public TokenService(
        IOptions<JwtOptions> jwtOptions,
        ITokenRevocationService tokenRevocationService)
    {
        _jwtOptions = jwtOptions.Value;
        _tokenRevocationService = tokenRevocationService
            ?? throw new ArgumentNullException(nameof(tokenRevocationService));
    }

    public string GenerateSsoToken(long accountId, string nationalId)
    {
        var claims = new List<Claim>
        {
            new("AccountId", accountId.ToString()),
            new("NationalId", nationalId),
            new("TokenType", "SSO")
        };

        return GenerateToken(claims, DateTime.UtcNow.AddHours(_jwtOptions.SsoExpirationHours));
    }

    public string GenerateSystemToken(SystemTokenDescriptor descriptor)
    {
        var createdAt = descriptor.CreatedAt == default ? DateTime.UtcNow : descriptor.CreatedAt;

        var claims = new List<Claim>
        {
            new("AccountId", descriptor.AccountId.ToString()),
            new("Email", descriptor.Email),
            new("NationalId", descriptor.NationalId),
            new("Phone", descriptor.Phone ?? string.Empty),
            new("City", descriptor.City ?? string.Empty),

            new("FullNameEn", descriptor.FullNameEn),
            new("FullNameAr", descriptor.FullNameAr),
            new("CreatedAt", createdAt.ToString("O")),
            new("AccountCreatedAt", descriptor.AccountCreatedAt?.ToString("O") ?? string.Empty),
            new("IsActive", descriptor.IsActive.ToString()),
            new("StatusId", descriptor.StatusId.ToString()),
            new("GovernoratesId", descriptor.GovernoratesId?.ToString() ?? string.Empty),
            new("SsoTokenId", descriptor.SsoTokenId),

            new("BusinessEntityId", descriptor.BusinessEntityId.ToString()),
            new("BusinessEntityName", descriptor.BusinessEntityName),
            new("RedirectUrl", descriptor.RedirectUrl),

            new("Role", descriptor.Role),

            new("TokenType", "System")
        };

        return GenerateToken(claims, DateTime.UtcNow.AddMinutes(_jwtOptions.ExpirationMinutes));
    }

    public bool ValidateToken(string token)
    {
        try
        {
            GetPrincipal(token);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public ClaimsPrincipal GetPrincipal(string token)
    {
        var principal = _tokenHandler.ValidateToken(
            token,
            new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = GetSigningKey(),

                ValidateIssuer = true,
                ValidIssuer = _jwtOptions.Issuer,

                ValidateAudience = true,
                ValidAudience = _jwtOptions.Audience,

                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            },
            out _);

        var tokenId = GetTokenId(principal);
        if (!string.IsNullOrWhiteSpace(tokenId) && _tokenRevocationService.IsRevoked(tokenId))
            throw new SecurityTokenException("Token has been revoked.");

        return principal;
    }

    public long? ReadAccountId(string token)
    {
        var claim = GetPrincipal(token)
            .FindFirst("AccountId");

        if (claim is null)
            return null;

        return long.TryParse(claim.Value, out var accountId)
            ? accountId
            : null;
    }

    public string? ReadTokenType(string token)
    {
        return GetPrincipal(token)
            .FindFirst("TokenType")
            ?.Value;
    }

    public DateTime? ReadExpiration(string token)
    {
        var jwt = _tokenHandler.ReadJwtToken(token);
        return jwt.ValidTo;
    }

    private string GenerateToken(IEnumerable<Claim> claims, DateTime expires)
    {
        var tokenClaims = claims.Append(new Claim(
            JwtRegisteredClaimNames.Jti,
            Guid.NewGuid().ToString("N")));

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: tokenClaims,
            expires: expires,
            signingCredentials: new SigningCredentials(
                GetSigningKey(),
                SecurityAlgorithms.HmacSha256));

        return _tokenHandler.WriteToken(token);
    }

    private SymmetricSecurityKey GetSigningKey()
    {
        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Key));
    }

    private static string? GetTokenId(ClaimsPrincipal principal) =>
        principal.FindFirst(JwtRegisteredClaimNames.Jti)?.Value
        ?? principal.FindFirst(ClaimTypes.SerialNumber)?.Value;
}
