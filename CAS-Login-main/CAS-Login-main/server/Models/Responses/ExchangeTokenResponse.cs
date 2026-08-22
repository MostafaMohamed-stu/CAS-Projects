namespace CAS_Login_Back_End.Models.Responses;

public sealed class ExchangeTokenResponse
{
    public string JwtToken { get; init; } = string.Empty;

    public string Role { get; init; } = string.Empty;

    public long BusinessEntityId { get; init; }

    public string BusinessEntityName { get; init; } = string.Empty;

    public string RedirectUrl { get; init; } = string.Empty;

    public DateTime JwtExpiresAt { get; init; }

    /// <summary>
    /// UTC time at which the replacement system JWT was issued.
    /// </summary>
    public DateTime JwtCreatedAt { get; init; }
}
