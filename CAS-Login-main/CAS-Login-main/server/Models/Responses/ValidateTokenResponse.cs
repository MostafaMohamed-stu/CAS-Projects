namespace CAS_Login_Back_End.Models.Responses;

public sealed class ValidateTokenResponse
{
    public bool IsValid { get; init; }

    public bool IsExpired { get; init; }

    public string TokenType { get; init; } = string.Empty;

    public long AccountId { get; init; }

    /// <summary>
    /// UTC time at which the system JWT was issued. SSO tokens do not contain this claim.
    /// </summary>
    public DateTime? CreatedAt { get; init; }
}
