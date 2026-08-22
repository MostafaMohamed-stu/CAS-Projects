namespace CAS_Login_Back_End.Models.Requests;

/// <summary>
/// Request model for profile update.
/// </summary>
public class UpdateProfileRequest
{
    public string FullNameEn { get; set; } = string.Empty;

    public string FullNameAr { get; set; } = string.Empty;

    public string? Phone { get; set; }

    public string? City { get; set; }
}
