namespace CAS_Login_Back_End.Models.Requests;

/// <summary>
/// Request model for user login.
/// </summary>
public class LoginRequest
{
    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public long BusinessEntityId { get; set; }
}
