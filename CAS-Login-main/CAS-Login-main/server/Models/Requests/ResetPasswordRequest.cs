namespace CAS_Login_Back_End.Models.Requests;

/// <summary>
/// Request model for password reset.
/// </summary>
public class ResetPasswordRequest
{
    public string Email { get; set; } = string.Empty;

    public string ResetToken { get; set; } = string.Empty;

    public string NewPassword { get; set; } = string.Empty;

    public string ConfirmPassword { get; set; } = string.Empty;
}
