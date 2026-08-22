namespace CAS_Login_Back_End.Models.Authentication;

public sealed class SystemTokenDescriptor
{
    public long AccountId { get; init; }

    public string Email { get; init; } = string.Empty;

    public string NationalId { get; init; } = string.Empty;

    public string? Phone { get; init; }

    public string? City { get; init; }

    public string FullNameEn { get; init; } = string.Empty;

    public string FullNameAr { get; init; } = string.Empty;

    public DateOnly? AccountCreatedAt { get; init; }

    /// <summary>
    /// UTC time at which this system JWT is issued.
    /// </summary>
    public DateTime CreatedAt { get; init; }

    public bool IsActive { get; init; }

    public long StatusId { get; init; }

    public long? GovernoratesId { get; init; }

    /// <summary>
    /// Identifier of the SSO token from which this system token was issued.
    /// </summary>
    public string SsoTokenId { get; init; } = string.Empty;

    public long BusinessEntityId { get; init; }

    public string BusinessEntityName { get; init; } = string.Empty;

    public string RedirectUrl { get; init; } = string.Empty;

    public string Role { get; init; } = string.Empty;

}
