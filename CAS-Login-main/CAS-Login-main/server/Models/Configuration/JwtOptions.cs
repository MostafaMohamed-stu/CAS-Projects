namespace CAS_Login_Back_End.Models.Configuration;

/// <summary>
/// JWT settings supplied by the <c>JWT</c> configuration section.
/// </summary>
public sealed class JwtOptions
{
    public const string SectionName = "JWT";

    public string Key { get; init; } = string.Empty;
    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public int ExpirationMinutes { get; init; } = 60;
    public int SsoExpirationHours { get; init; } = 8;
}
