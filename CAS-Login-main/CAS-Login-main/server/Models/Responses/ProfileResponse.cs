namespace CAS_Login_Back_End.Models.Responses;

/// <summary>
/// Response model for user profile information.
/// </summary>
public class ProfileResponse
{
    public int AccountId { get; set; }

    public string Email { get; set; } = string.Empty;

    public string NationalId { get; set; } = string.Empty;

    public string? Phone { get; set; }

    public string? City { get; set; }

    public string FullNameEn { get; set; } = string.Empty;

    public string FullNameAr { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public DateOnly? CreatedAt { get; set; }

    public long StatusId { get; set; }

    public string StatusName { get; set; } = string.Empty;

    public long? GovernoratesId { get; set; }

    public string? GovernorateNameEn { get; set; }

    public string? GovernorateNameAr { get; set; }
}
