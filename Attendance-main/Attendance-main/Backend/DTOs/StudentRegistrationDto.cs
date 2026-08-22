using System.ComponentModel.DataAnnotations;

namespace AttendanceBehaviour_Backend.DTOs
{
    public class StudentRegistrationDto
    {
        [Required]
        public string FullName { get; set; } = null!;

        [Required, EmailAddress]
        public string Email { get; set; } = null!;

        [Required, MaxLength(14)]
        public string NationalId { get; set; } = null!;

        [RegularExpression(@"^(?=.*[A-Z])(?=.*\d).+$")]
        [Required, MinLength(6)]
        public string Password { get; set; } = null!;

        [Required]
        public long ClassId { get; set; }

        // Optional student profile fields
        public string? PhoneNumber { get; set; }
        public int Age { get; set; } = 18;
        public string? City { get; set; }
        public string? Country { get; set; }
    }
}
