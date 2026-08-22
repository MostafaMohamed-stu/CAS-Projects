using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AttendanceBehaviour_Backend.Models
{
    public class Class
    {
        [Key]
        public long Id { get; set; }

        [Required]
        public string ClassName { get; set; } = string.Empty;

        public long GradeId { get; set; }

        public long? StatusId { get; set; }

        [ForeignKey("GradeId")]
        public virtual Grade? Grade { get; set; }

        public virtual ICollection<StudentProfile>? Students { get; set; }
        public virtual ICollection<Attendance>? Attendances { get; set; }
        public virtual ICollection<AbsenceRecord>? AbsenceRecords { get; set; }
    }
}