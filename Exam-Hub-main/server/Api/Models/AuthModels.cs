public class RegisterModel
{
    public string Email { get; set; }
    public string Password { get; set; }
    public string? Role { get; set; } // Admin | Teacher | Student (default Student)
    public string? FullNameEn { get; set; }
    public string? FullNameAr { get; set; }
}

public class LoginModel
{
    public string Email { get; set; }
    public string Password { get; set; }
    public string? BusinessEntity { get; set; }
}

public class SsoTokenModel
{
    public string Email { get; set; } = string.Empty;
    public string? BusinessEntity { get; set; }
}

public class UpdateProfileModel
{
    public string? FullNameEn { get; set; }
    public string? FullNameAr { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
}
