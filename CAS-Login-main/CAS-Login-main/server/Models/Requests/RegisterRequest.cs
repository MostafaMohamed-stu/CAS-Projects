namespace CAS_Login_Back_End.Models.Requests;

/// <summary>
/// Request model for user registration.
/// </summary>
public class RegisterRequest
{
    public string NationalId { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string ConfirmPassword { get; set; } = string.Empty;

    public string FullNameEn { get; set; } = string.Empty;

    public string FullNameAr { get; set; } = string.Empty;
}
