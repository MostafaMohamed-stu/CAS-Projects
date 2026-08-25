using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Models;

[Table("Team")]
public partial class Team
{
    [Key]
    public long Id { get; set; }

    public string TeamName { get; set; } = null!;

    public long? TeamLeaderAccountId { get; set; }

    public long ClassId { get; set; }

    public long? SupervisorAccountId { get; set; }

    public long? ProjectId { get; set; }

    public long StatusId { get; set; }

    [ForeignKey("ClassId")]
    [InverseProperty("Teams")]
    public virtual TblClass Class { get; set; } = null!;

    [ForeignKey("ProjectId")]
    [InverseProperty("Teams")]
    public virtual Project? Project { get; set; }

    [ForeignKey("StatusId")]
    [InverseProperty("Teams")]
    public virtual Status Status { get; set; } = null!;

    [ForeignKey("SupervisorAccountId")]
    [InverseProperty("TeamSupervisorAccounts")]
    public virtual Account? SupervisorAccount { get; set; }

    [ForeignKey("TeamLeaderAccountId")]
    [InverseProperty("TeamTeamLeaderAccounts")]
    public virtual Account? TeamLeaderAccount { get; set; }

    [InverseProperty("Team")]
    public virtual ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();

    [InverseProperty("Team")]
    public virtual ICollection<TaskSubmission> TaskSubmissions { get; set; } = new List<TaskSubmission>();
}
