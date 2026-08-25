using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Elsewedy_Capstone_System.Models;

namespace Elsewedy_Capstone_System.Services
{
    public interface IJwtService
    {
        Task<string> GenerateAccessTokenAsync(Account account);
        string GenerateRefreshToken(Account account);
        ClaimsPrincipal? ValidateAccessToken(string token);
        ClaimsPrincipal? ValidateRefreshToken(string token);
        string GetUserIdFromToken(string token);
    }

    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;
        private readonly SymmetricSecurityKey _accessTokenKey;
        private readonly SymmetricSecurityKey _refreshTokenKey;
        private readonly RoleService _roleService;

        public JwtService(IConfiguration configuration, RoleService roleService)
        {
            _configuration = configuration;
            _roleService = roleService;
            
            // Access token key (15 minutes) - stored in memory only
            var accessTokenSecret = _configuration["Jwt:AccessTokenSecret"] ?? "your-super-secret-access-token-key-here-make-it-long-and-secure";
            _accessTokenKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(accessTokenSecret));
            
            // Refresh token key (7 days) - stored in HttpOnly cookies
            var refreshTokenSecret = _configuration["Jwt:RefreshTokenSecret"] ?? "your-super-secret-refresh-token-key-here-make-it-long-and-secure";
            _refreshTokenKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(refreshTokenSecret));
        }

        public async Task<string> GenerateAccessTokenAsync(Account account)
        {
            // Resolve role via AccountRoles (CapstoneProject). If not found, do not issue a token.
            var roleName = await _roleService.GetAccountRoleNameAsync(account.Id, "CapstoneProject");
            if (string.IsNullOrWhiteSpace(roleName) || roleName == "Unknown")
            {
                throw new InvalidOperationException("User has no assigned role in CapstoneProject");
            }
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, account.Id.ToString()),
                new Claim(ClaimTypes.Email, account.Email),
                new Claim(ClaimTypes.Name, account.FullNameEn ?? account.FullNameAr ?? "Unknown"),
                // IMPORTANT: role must use ClaimTypes.Role for [Authorize(Roles=...)]
                new Claim(ClaimTypes.Role, roleName),
                new Claim("tokenType", "access"),
                new Claim("uniqueId", Guid.NewGuid().ToString()), // Add unique identifier
                new Claim("timestamp", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString()), // Add timestamp
                new Claim("iat", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()),
                new Claim("exp", DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds().ToString()) // 15 minutes
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(15), // 15 minutes
                SigningCredentials = new SigningCredentials(_accessTokenKey, SecurityAlgorithms.HmacSha256Signature),
                Issuer = _configuration["Jwt:Issuer"] ?? "ElsewedyCapstoneSystem",
                Audience = _configuration["Jwt:Audience"] ?? "ElsewedyCapstoneSystem"
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public string GenerateRefreshToken(Account account)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, account.Id.ToString()),
                new Claim("tokenType", "refresh"),
                new Claim("iat", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()),
                new Claim("exp", DateTimeOffset.UtcNow.AddDays(7).ToUnixTimeSeconds().ToString())
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7), // 7 days - stored in HttpOnly cookies
                SigningCredentials = new SigningCredentials(_refreshTokenKey, SecurityAlgorithms.HmacSha256Signature),
                Issuer = _configuration["Jwt:Issuer"] ?? "ElsewedyCapstoneSystem",
                Audience = _configuration["Jwt:Audience"] ?? "ElsewedyCapstoneSystem"
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public ClaimsPrincipal? ValidateAccessToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = _accessTokenKey,
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["Jwt:Issuer"] ?? "ElsewedyCapstoneSystem",
                    ValidateAudience = true,
                    ValidAudience = _configuration["Jwt:Audience"] ?? "ElsewedyCapstoneSystem",
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
                
                // Verify it's an access token
                var tokenType = principal.FindFirst("tokenType")?.Value;
                if (tokenType != "access")
                {
                    return null;
                }

                return principal;
            }
            catch
            {
                return null;
            }
        }

        public ClaimsPrincipal? ValidateRefreshToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = _refreshTokenKey,
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["Jwt:Issuer"] ?? "ElsewedyCapstoneSystem",
                    ValidateAudience = true,
                    ValidAudience = _configuration["Jwt:Audience"] ?? "ElsewedyCapstoneSystem",
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
                
                // Verify it's a refresh token
                var tokenType = principal.FindFirst("tokenType")?.Value;
                if (tokenType != "refresh")
                {
                    return null;
                }

                return principal;
            }
            catch
            {
                return null;
            }
        }

        public string GetUserIdFromToken(string token)
        {
            try
            {
                var principal = ValidateAccessToken(token);
                return principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            }
            catch
            {
                return null;
            }
        }

    }
}
