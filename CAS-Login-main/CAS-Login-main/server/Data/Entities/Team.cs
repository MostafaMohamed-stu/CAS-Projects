using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class Team
{
    public long Id { get; set; }

    public string TeamName { get; set; } = null!;

    public long? TeamLeaderAccountId { get; set; }

    public long ClassId { get; set; }

    public long? SupervisorAccountId { get; set; }

    public long? ProjectId { get; set; }

    public long StatusId { get; set; }

    public int? TeamCode { get; set; }

    public string? BusinessEntity { get; set; }

    public virtual Project? Project { get; set; }

    public virtual Status Status { get; set; } = null!;

    public virtual Account? SupervisorAccount { get; set; }

    public virtual ICollection<TaskSubmission> TaskSubmissions { get; set; } = new List<TaskSubmission>();

    public virtual Account? TeamLeaderAccount { get; set; }

    public virtual ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();
}
