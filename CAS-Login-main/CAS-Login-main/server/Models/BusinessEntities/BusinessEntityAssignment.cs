namespace CAS_Login_Back_End.Models.BusinessEntities;

/// <summary>
/// The business-entity context assigned to an account.
/// </summary>
public sealed record BusinessEntityAssignment(
    long Id,
    string Name,
    string RedirectUrl,
    long? RoleId,
    string RoleDescription,
    string RoleName);
