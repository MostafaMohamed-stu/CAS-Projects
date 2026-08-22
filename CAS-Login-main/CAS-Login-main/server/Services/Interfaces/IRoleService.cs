using CAS_Login_Back_End.Models.Responses;

namespace CAS_Login_Back_End.Services.Interfaces;

/// <summary>
/// Service for role management operations.
/// </summary>
public interface IRoleService
{
    /// <summary>
    /// Retrieves all active roles.
    /// </summary>
    Task<IEnumerable<RoleResponse>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves a role by ID.
    /// </summary>
    Task<RoleResponse> GetByIdAsync(int roleId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves the role for a specific account in a business entity.
    /// </summary>
    Task<RoleResponse> GetAccountRoleAsync(
        int accountId,
        long businessEntityId,
        CancellationToken cancellationToken = default);
}
