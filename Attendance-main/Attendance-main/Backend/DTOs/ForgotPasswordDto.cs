using System.ComponentModel.DataAnnotations;
namespace AttendanceBehaviour_Backend.DTOs
{
    public class ForgotPasswordDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
    }
}
