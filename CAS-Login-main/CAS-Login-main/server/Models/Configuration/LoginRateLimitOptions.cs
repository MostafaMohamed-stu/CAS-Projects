namespace CAS_Login_Back_End.Models.Configuration;

/// <summary>
/// Settings for the per-client login request limiter.
/// </summary>
public sealed class LoginRateLimitOptions
{
    public const string SectionName = "LoginRateLimiting";

    public int MaxRequests { get; init; }

    public TimeSpan Window { get; init; }
}
