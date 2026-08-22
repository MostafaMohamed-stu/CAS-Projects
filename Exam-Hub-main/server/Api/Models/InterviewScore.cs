using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class InterviewScore
{
    public long Id { get; set; }

    public long AccountId { get; set; }

    public long InterviewerId { get; set; }

    public decimal Score { get; set; }

    public virtual Account Account { get; set; } = null!;

    public virtual Account Interviewer { get; set; } = null!;
}
