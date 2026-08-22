using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class CourseRoundInstructor
{
    public long Id { get; set; }

    public long CourseRoundId { get; set; }

    public long InstructorAccountId { get; set; }

    public DateOnly AssignedDate { get; set; }

    public long? CourseRoundInstructorSubRoleStatusId { get; set; }

    public virtual Account InstructorAccount { get; set; } = null!;
}
