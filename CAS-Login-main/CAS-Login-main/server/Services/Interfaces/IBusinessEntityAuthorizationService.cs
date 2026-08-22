using CAS_Login_Back_End.Models.BusinessEntities;

namespace CAS_Login_Back_End.Services.Interfaces;

/// <summary>
/// Resolves and authorizes an account's access to a business entity.
/// </summary>
public interface IBusinessEntityAuthorizationService
{
    Task<BusinessEntityAssignment> GetAuthorizedAsync(
        long accountId,
        long businessEntityId,
        CancellationToken cancellationToken = default);
}
