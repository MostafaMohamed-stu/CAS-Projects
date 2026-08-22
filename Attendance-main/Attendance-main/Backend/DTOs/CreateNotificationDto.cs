using System.ComponentModel.DataAnnotations;

namespace AttendanceBehaviour_Backend.DTOs
{
    public class CreateNotificationDto
    {
        [Required]
        public string Title { get; set; } = null!;
        
        [Required]
        public string Message { get; set; } = null!;
        
        public long? AccountId { get; set; }
    }
}
