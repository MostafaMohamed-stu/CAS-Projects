namespace CAS_Login_Back_End.Models.Requests;

/// <summary>
/// Request model for forgot password flow.
/// </summary>
public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}
