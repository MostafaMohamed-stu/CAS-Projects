namespace CAS_Login_Back_End.Models.Responses;

/// <summary>
/// Response model for token information.
/// Does NOT expose the actual token value; tokens are returned at top level.
/// </summary>
public class TokenResponse
{
    public string AccessToken { get; set; } = string.Empty;

    public int ExpiresIn { get; set; }

    public string TokenType { get; set; } = "Bearer";
}
