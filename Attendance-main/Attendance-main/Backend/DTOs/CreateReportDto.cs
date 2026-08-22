using System.ComponentModel.DataAnnotations;

namespace AttendanceBehaviour_Backend.DTOs
{
    public class CreateReportDto
    {
        [Required]
        public string StudentName { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        public string SpecialistSignature { get; set; }
    }
}
