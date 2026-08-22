using System.ComponentModel.DataAnnotations;

namespace AttendanceBehaviour_Backend.Models
{
    public class Grade
    {
        [Key]
        public long Id { get; set; }

        [Required]
        public string GradeName { get; set; } = string.Empty;

        public long StatusId { get; set; }

        public long? AdminAccountId { get; set; }

        public virtual Account? AdminAccount { get; set; }

        public virtual Status Status { get; set; } = null!;

        public virtual ICollection<Class>? Classes { get; set; }

        public virtual ICollection<TaskSubmission> TaskSubmissions { get; set; } = new List<TaskSubmission>();

        public virtual ICollection<TblTask> TblTasks { get; set; } = new List<TblTask>();
    }
}
