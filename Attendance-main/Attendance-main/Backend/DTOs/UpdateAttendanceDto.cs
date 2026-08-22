using System.ComponentModel.DataAnnotations;

namespace AttendanceBehaviour_Backend.DTOs
{
    public class UpdateAttendanceDto
    {
        [Required]
        public bool IsPresent { get; set; }

        public string Note { get; set; }

        public DateTime? Date { get; set; } // Make it nullable to match the model

        public int SessionNumber { get; set; }
    }
}
