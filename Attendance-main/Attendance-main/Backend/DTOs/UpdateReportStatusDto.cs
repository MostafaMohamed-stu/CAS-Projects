using System.ComponentModel.DataAnnotations;

namespace AttendanceBehaviour_Backend.DTOs
{
    public class UpdateReportStatusDto
    {
        [Required]
        // You can add validation to ensure this is only "Accepted" or "Declined"
        public string Status { get; set; }
    }
}
