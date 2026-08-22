namespace CAS_Login_Back_End.Models.Responses;

/// <summary>
/// Describes the tokens invalidated by a scoped logout request.
/// </summary>
public sealed class LogoutResponse
{
    public long BusinessEntityId { get; init; }

    public bool SsoTokenRevoked { get; init; }

    public bool JwtTokenRevoked { get; init; }
}
