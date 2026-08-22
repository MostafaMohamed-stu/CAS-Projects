using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AttendanceBehaviour_Backend.Models
{
    public class Attendance
    {
        [Key]
        public long Id { get; set; }

        [Required]
        public long StudentId { get; set; }

        [Required]
        public long ClassId { get; set; }

        public DateTime? Date { get; set; }

        public int SessionNumber { get; set; }

        public bool? IsPresent { get; set; }

        public long? NoteId { get; set; }

        [ForeignKey("StudentId")]
        public virtual Account? Student { get; set; }

        [ForeignKey("ClassId")]
        public virtual TblClass? Class { get; set; }

        [ForeignKey("NoteId")]
        public virtual BehaviorNote? Note { get; set; }
    }
}