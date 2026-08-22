using System.ComponentModel.DataAnnotations;

namespace AttendanceBehaviour_Backend.DTOs
{
    public class StudentProfileDto
    {
        public long Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        [EmailAddress]
        public string? Email { get; set; }
        [Phone]
        public string? PhoneNumber { get; set; }

        public int Age { get; set; }

        public string? City { get; set; }

        public string? Country { get; set; }

        public int DaysAbsent { get; set; }

        public List<string> GoodNotes { get; set; } = new();

        public List<string> BadNotes { get; set; } = new();

        public DateTime CreatedAt { get; set; }
        public long ClassId { get; set; }
        public string? ClassName { get; set; }
        public string? GradeName { get; set; }
    }
}
