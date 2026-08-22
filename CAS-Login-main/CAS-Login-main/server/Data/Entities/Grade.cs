using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class Grade
{
    public long Id { get; set; }

    public string GradeName { get; set; } = null!;

    public long? ParentGradeId { get; set; }

    public long? AdminAccountId { get; set; }

    public long StatusId { get; set; }

    public virtual Account? AdminAccount { get; set; }

    public virtual Status Status { get; set; } = null!;

    public virtual ICollection<TaskSubmission> TaskSubmissions { get; set; } = new List<TaskSubmission>();

    public virtual ICollection<TblTask> TblTasks { get; set; } = new List<TblTask>();
}
