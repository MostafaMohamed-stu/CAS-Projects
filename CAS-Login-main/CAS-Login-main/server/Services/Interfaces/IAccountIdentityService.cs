using System.Security.Claims;

namespace CAS_Login_Back_End.Services.Interfaces;

/// <summary>
/// Resolves the active account represented by a validated token.
/// </summary>
public interface IAccountIdentityService
{
    Task<long?> ResolveAccountIdAsync(
        ClaimsPrincipal principal,
        CancellationToken cancellationToken = default);
}
