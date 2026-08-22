using System.Security.Claims;
using CAS_Login_Back_End.Models.Authentication;

namespace CAS_Login_Back_End.Services.Interfaces;

/// <summary>
/// Generates and validates JWT tokens used by the CAS.
/// </summary>
public interface ITokenService
{
    /// <summary>
    /// Generates the identity SSO token.
    /// </summary>
    string GenerateSsoToken(long accountId, string nationalId);

    /// <summary>
    /// Generates a system JWT containing the user's identity and role
    /// for a single Business Entity.
    /// </summary>
    string GenerateSystemToken(SystemTokenDescriptor descriptor);

    /// <summary>
    /// Validates a JWT.
    /// </summary>
    bool ValidateToken(string token);

    /// <summary>
    /// Returns a validated ClaimsPrincipal.
    /// Throws if the token is invalid.
    /// </summary>
    ClaimsPrincipal GetPrincipal(string token);

    long? ReadAccountId(string token);

    string? ReadTokenType(string token);

    DateTime? ReadExpiration(string token);
}
