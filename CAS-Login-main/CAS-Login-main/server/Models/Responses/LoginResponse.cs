namespace CAS_Login_Back_End.Models.Responses;

public sealed class LoginResponse
{
    public string SsoToken { get; init; } = string.Empty;

    public string JwtToken { get; init; } = string.Empty;

    public long AccountId { get; init; }

    public string Email { get; init; } = string.Empty;

    public string FullNameEn { get; init; } = string.Empty;

    public string FullNameAr { get; init; } = string.Empty;

    public string Role { get; init; } = string.Empty;

    public long BusinessEntityId { get; init; }

    public string BusinessEntityName { get; init; } = string.Empty;

    public string RedirectUrl { get; init; } = string.Empty;

    public DateTime SsoExpiresAt { get; init; }

    /// <summary>
    /// UTC time at which the system JWT was issued.
    /// </summary>
    public DateTime JwtCreatedAt { get; init; }

    public DateTime JwtExpiresAt { get; init; }
}
