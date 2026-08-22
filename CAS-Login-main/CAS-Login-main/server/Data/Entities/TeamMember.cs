using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class TeamMember
{
    public long Id { get; set; }

    public long TeamId { get; set; }

    public long TeamMemberAccountId { get; set; }

    public string? TeamMemberDescription { get; set; }

    public long StatusId { get; set; }

    public virtual Status Status { get; set; } = null!;

    public virtual Team Team { get; set; } = null!;

    public virtual Account TeamMemberAccount { get; set; } = null!;
}
