using CAS_Login_Back_End.Models.Requests;
using CAS_Login_Back_End.Models.Responses;

namespace CAS_Login_Back_End.Services.Interfaces;

/// <summary>
/// Service for account management operations.
/// Handles registration, profile updates, and password management.
/// </summary>
public interface IAccountService
{
    /// <summary>
    /// Registers a new account with email, password, and profile information.
    /// Creates Account, Login, and AccountRole records.
    /// </summary>
    Task<ProfileResponse> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves current user profile information.
    /// </summary>
    Task<ProfileResponse> GetProfileAsync(
        int accountId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates user profile information (full names).
    /// </summary>
    Task<ProfileResponse> UpdateProfileAsync(
        int accountId,
        UpdateProfileRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Changes password for current user (requires current password verification).
    /// </summary>
    Task ChangePasswordAsync(
        int accountId,
        ChangePasswordRequest request,
        CancellationToken cancellationToken = default);

}
