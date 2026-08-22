using System.ComponentModel.DataAnnotations;

namespace AttendanceBehaviour_Backend.DTOs
{
    public class ResetPasswordDto
    {
        [Required]
        [MinLength(5, ErrorMessage = "Password must be at least 5 characters long.")]
        [RegularExpression(@"^(?=.*[A-Z])(?=.*\d).+$", ErrorMessage = "Password must contain at least one uppercase letter and one number.")]
        public string NewPassword { get; set; }

        [Required]
        [RegularExpression(@"^(?=.*[A-Z])(?=.*\d).+$", ErrorMessage = "Password must contain at least one uppercase letter and one number.")]
        public string ConfirmPassword { get; set; }
    }
}
