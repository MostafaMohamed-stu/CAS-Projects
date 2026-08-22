using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class StudentTask
{
    public long Id { get; set; }

    public long StudentAccountId { get; set; }

    public long TaskId { get; set; }

    public bool IsCompleted { get; set; }

    public DateTime? CompletedAt { get; set; }

    public long StatusId { get; set; }

    public virtual Status Status { get; set; } = null!;

    public virtual Account StudentAccount { get; set; } = null!;

    public virtual TblTask Task { get; set; } = null!;
}
