namespace CAS_Login_Back_End.Services.Interfaces;

/// <summary>
/// Tracks JWTs that have been explicitly logged out before their natural expiry.
/// </summary>
public interface ITokenRevocationService
{
    /// <summary>
    /// Marks a token ID as invalid until the token's original expiry time.
    /// </summary>
    void Revoke(string tokenId, DateTime expiresAt);

    /// <summary>
    /// Returns whether a token ID has been explicitly revoked.
    /// </summary>
    bool IsRevoked(string tokenId);
}
