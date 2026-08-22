using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class TaskSubmission
{
    public long TaskSubmissionId { get; set; }

    public long TeamId { get; set; }

    public long TeamLeaderId { get; set; }

    public long TaskId { get; set; }

    public long? GradeId { get; set; }

    public string? Glink { get; set; }

    public string? Note { get; set; }

    public long StatusId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public string? Feedback { get; set; }

    public string? ReviewerId { get; set; }

    public virtual Grade? Grade { get; set; }

    public virtual TblTask Task { get; set; } = null!;

    public virtual Team Team { get; set; } = null!;

    public virtual Account TeamLeader { get; set; } = null!;
}
