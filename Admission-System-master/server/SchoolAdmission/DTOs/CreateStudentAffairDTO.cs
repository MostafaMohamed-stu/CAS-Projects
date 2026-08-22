namespace SchoolAdmission.DTOs;

public class CreateStudentAffairDTO
{
    public string FullNameEn { get; set; } = null!;
    public string FullNameAr { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
}
