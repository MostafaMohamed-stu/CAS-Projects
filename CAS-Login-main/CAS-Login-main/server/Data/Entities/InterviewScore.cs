using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class InterviewScore
{
    public long Id { get; set; }

    public long AccountId { get; set; }

    public long InterviewerId { get; set; }

    public decimal Score { get; set; }

    public virtual Account Account { get; set; } = null!;

    public virtual Account Interviewer { get; set; } = null!;
}
