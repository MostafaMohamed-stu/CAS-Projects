namespace SchoolAdmission.DTOs;

public class TimeExtensionDTO
{
    public string NationalId { get; set; } = string.Empty;
    public string CoordinatorEmail { get; set; } = string.Empty;
    public string CoordinatorPassword { get; set; } = string.Empty;
    public int ExtensionMinutes { get; set; }
}
