using System.ComponentModel.DataAnnotations;

namespace AttendanceBehaviour_Backend.DTOs
{
    public class CreateStudentProfileDto
    {
        [Required]
        public string Name { get; set; } = null!;
        
        [EmailAddress]
        public string? Email { get; set; }
        
        [Phone]
        public string? PhoneNumber { get; set; }

        public int Age { get; set; } = 18;

        public string? City { get; set; }

        public string? Country { get; set; }

        public int DaysAbsent { get; set; } = 0;

        public List<string> GoodNotes { get; set; } = new();

        public List<string> BadNotes { get; set; } = new();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public long ClassId { get; set; }
    }
}
