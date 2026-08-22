using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AttendanceBehaviour_Backend.Models
{
    public class StudentProfile
    {
        [Key]
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

        public string? GoodNotesJson { get; set; }

        public string? BadNotesJson { get; set; }

        public DateTime CreatedAt { get; set; }

        public string? FullNameEn { get; set; }

        public string? Grade { get; set; }

        public long ClassId { get; set; }

        [ForeignKey("ClassId")]
        public virtual Class? Class { get; set; }

        public virtual ICollection<Attendance>? Attendances { get; set; }
        public virtual ICollection<BehaviorNote>? BehaviorNotes { get; set; }
    }
}
