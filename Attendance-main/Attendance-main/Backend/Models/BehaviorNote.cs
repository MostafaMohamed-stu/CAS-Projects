using System.ComponentModel.DataAnnotations;

namespace AttendanceBehaviour_Backend.Models
{
    public class BehaviorNote
    {
        [Key]
        public long Id { get; set; }

        [Required]
        public long StudentId { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string? NoteType { get; set; }

        public string? ImageUrl { get; set; }

        public DateTime Date { get; set; }

        public string? Gen { get; set; }

        public long AttendanceRecordId { get; set; }

        public virtual AttendanceRecord? AttendanceRecord { get; set; }

        public virtual Account? Student { get; set; }

        public virtual ICollection<Attendance>? Attendances { get; set; }
    }
}
