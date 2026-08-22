using CAS_Login_Back_End.Models.Responses;

namespace CAS_Login_Back_End.Services.Interfaces;

/// <summary>
/// Service for business entity management operations.
/// </summary>
public interface IBusinessEntityService
{
    /// <summary>
    /// Retrieves all active business entities accessible to a user.
    /// </summary>
    Task<IEnumerable<BusinessEntityResponse>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves a specific business entity by ID.
    /// </summary>
    Task<BusinessEntityResponse> GetByIdAsync(long businessEntityId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves all business entities accessible to a specific account.
    /// </summary>
    Task<IEnumerable<BusinessEntityResponse>> GetAccountBusinessEntitiesAsync(
        int accountId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Response model for business entity information.
/// </summary>
public class BusinessEntityResponse
{
    public long Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string RedirectUrl { get; set; } = string.Empty;

    public bool IsActive { get; set; }
}
