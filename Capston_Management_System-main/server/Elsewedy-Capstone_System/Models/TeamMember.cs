using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Models;

[Table("TeamMember")]
public partial class TeamMember
{
    [Key]
    public long Id { get; set; }

    public long TeamId { get; set; }

    public long TeamMemberAccountId { get; set; }

    public string? TeamMemberDescription { get; set; }

    public long StatusId { get; set; }

    [ForeignKey("StatusId")]
    [InverseProperty("TeamMembers")]
    public virtual Status Status { get; set; } = null!;

    [ForeignKey("TeamId")]
    [InverseProperty("TeamMembers")]
    public virtual Team Team { get; set; } = null!;

    [ForeignKey("TeamMemberAccountId")]
    [InverseProperty("TeamMembers")]
    public virtual Account TeamMemberAccount { get; set; } = null!;
}
