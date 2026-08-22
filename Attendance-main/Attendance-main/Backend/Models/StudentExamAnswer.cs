using System;
using System.Collections.Generic;

namespace AttendanceBehaviour_Backend.Models;

public partial class StudentExamAnswer
{
    public long Id { get; set; }

    public long AccountId { get; set; }

    public long ExamId { get; set; }

    public string ChoosedAnswer { get; set; } = null!;

    public bool Score { get; set; }

    public virtual Account Account { get; set; } = null!;

    public virtual ExamQuestion Exam { get; set; } = null!;
}
