using System.ComponentModel.DataAnnotations;

namespace AttendanceBehaviour_Backend.DTOs
{
    public class RegisterDto
    {
        //[Required]
        public string FullName { get; set; } = null;

        [ EmailAddress]
        public string Email { get; set; } = null!;

        [ MaxLength(14)]
        public string NationalId  { get; set; }

        [RegularExpression(@"^(?=.*[A-Z])(?=.*\d).+$")]
        [ MinLength(6)]
        public string Password { get; set; } = null!;

        //[Required]
        public long RoleId { get; set; } // Changed to long to match Role model
        
        // Added phone field
        public string? Phone { get; set; }
    }
}
