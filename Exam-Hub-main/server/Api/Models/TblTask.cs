using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class TblTask
{
    public long Id { get; set; }

    public string TaskName { get; set; } = null!;

    public string? TaskDescription { get; set; }

    public long? AssignedToId { get; set; }

    public long? AssignedById { get; set; }

    public DateOnly? DueDate { get; set; }

    public DateOnly? CreatedAt { get; set; }

    public DateTime TaskDeadline { get; set; }

    public long? GradeId { get; set; }

    public long? AdminAccountId { get; set; }

    public long StatusId { get; set; }

    public int? ClassId { get; set; }

    public int? TeamId { get; set; }

    public int WeekNumber { get; set; }

    public virtual Account? AdminAccount { get; set; }

    public virtual Grade? Grade { get; set; }

    public virtual Status Status { get; set; } = null!;

    public virtual ICollection<StudentTask> StudentTasks { get; set; } = new List<StudentTask>();

    public virtual ICollection<TaskSubmission> TaskSubmissions { get; set; } = new List<TaskSubmission>();
}
