using System.Collections.Concurrent;
using CAS_Login_Back_End.Services.Interfaces;

namespace CAS_Login_Back_End.Services.Authentication;

/// <summary>
/// In-memory revocation list for tokens that have been explicitly logged out.
/// Entries are retained only until their original JWT expiration.
/// </summary>
public sealed class TokenRevocationService : ITokenRevocationService
{
    private readonly ConcurrentDictionary<string, DateTime> _revokedTokens =
        new(StringComparer.Ordinal);

    public void Revoke(string tokenId, DateTime expiresAt)
    {
        if (string.IsNullOrWhiteSpace(tokenId))
            throw new ArgumentException("Token ID is required.", nameof(tokenId));

        var expiresAtUtc = expiresAt.ToUniversalTime();
        if (expiresAtUtc <= DateTime.UtcNow)
            return;

        RemoveExpiredTokens();
        _revokedTokens[tokenId] = expiresAtUtc;
    }

    public bool IsRevoked(string tokenId)
    {
        if (string.IsNullOrWhiteSpace(tokenId) ||
            !_revokedTokens.TryGetValue(tokenId, out var expiresAtUtc))
        {
            return false;
        }

        if (expiresAtUtc > DateTime.UtcNow)
            return true;

        _revokedTokens.TryRemove(tokenId, out _);
        return false;
    }

    private void RemoveExpiredTokens()
    {
        var now = DateTime.UtcNow;

        foreach (var revokedToken in _revokedTokens)
        {
            if (revokedToken.Value <= now)
                _revokedTokens.TryRemove(revokedToken.Key, out _);
        }
    }
}
