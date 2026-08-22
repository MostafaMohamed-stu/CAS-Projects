// --- File: Repos/JwtService.cs ---

using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using AttendanceBehaviour_Backend.Interfaces;
using AttendanceBehaviour_Backend.Models;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AttendanceBehaviour_Backend.Repos
{
    public class JwtService : IJwtService
    {
        // This holds the secret key string from your configuration.
        private readonly string _key;

        // The key is injected here when JwtService is created.
        // The comment "?? ????? ??????? ?? ??? Configuration ?? ?????? ?? ??? Startup"
        // confirms it comes from your configuration (e.g., appsettings.json).
        public JwtService(string key)
        {
            _key = key;
        }

        // This is your primary method for creating the JWT.
        public string GenerateToken(Account user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();

            // --- FIXED: Use UTF8 encoding consistently ---
            var key = Encoding.UTF8.GetBytes(_key);

            // These are the claims (the token's payload).
            // This section looks good and defines the user's identity.
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.NameId, user.Id.ToString()), // Standard claim for User ID
                new Claim("fullName", user.FullNameEn), // Custom claim for the user's full name
                new Claim(ClaimTypes.Email, user.Email), // Standard claim for Email
                new Claim(ClaimTypes.Role, user.AccountRoles.Roles.RoleName) // Standard claim for Role
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7),

                // --- FIXED: Use UTF8 encoding consistently ---
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
