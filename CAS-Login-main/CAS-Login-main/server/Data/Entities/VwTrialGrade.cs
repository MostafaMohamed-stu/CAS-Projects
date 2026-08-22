using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class VwTrialGrade
{
    public long AccountId { get; set; }

    public long CourseRoundId { get; set; }

    public string TrialGrade { get; set; } = null!;
}
