using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Models;

[Table("Account")]
[Index("Email", Name = "UQ__Account__A9D10534A971903E", IsUnique = true)]
[Index("NationalId", Name = "UQ__Account__E9AA32FA935D371E", IsUnique = true)]
public partial class Account
{
    [Key]
    public long Id { get; set; }

    [StringLength(50)]
    public string NationalId { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    [StringLength(100)]
    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    public long RoleId { get; set; }

    [Column("FullNameEN")]
    public string FullNameEn { get; set; } = null!;

    [Column("FullNameAR")]
    public string FullNameAr { get; set; } = null!;

    public string? ResetToken { get; set; }

    public DateTime? ResetTokenExpiry { get; set; }

    [Column("Created_at")]
    public DateTime? CreatedAt { get; set; }

    public bool IsActive { get; set; }

    public long StatusId { get; set; }

    [InverseProperty("AdminAccount")]
    public virtual ICollection<Grade> Grades { get; set; } = new List<Grade>();

    [InverseProperty("Account")]
    public virtual ICollection<Login> Logins { get; set; } = new List<Login>();

    [InverseProperty("SupervisorAccount")]
    public virtual ICollection<Project> Projects { get; set; } = new List<Project>();

    [InverseProperty("SubmitterAccount")]
    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();

    [InverseProperty("Account")]
    public virtual ReviewerSupervisorExtension? ReviewerSupervisorExtension { get; set; }

    [InverseProperty("Account")]
    public virtual CapstoneSupervisorExtension? CapstoneSupervisorExtension { get; set; }

    [ForeignKey("StatusId")]
    [InverseProperty("Accounts")]
    public virtual Status Status { get; set; } = null!;

    [InverseProperty("Account")]
    public virtual StudentExtension? StudentExtension { get; set; }

    [InverseProperty("StudentAccount")]
    public virtual ICollection<StudentTask> StudentTasks { get; set; } = new List<StudentTask>();

    [InverseProperty("Account")]
    public virtual SuperAdminExtension? SuperAdminExtension { get; set; }

    [InverseProperty("AdminAccount")]
    public virtual ICollection<TblTask> TblTasks { get; set; } = new List<TblTask>();

    [InverseProperty("TeamMemberAccount")]
    public virtual ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();

    [InverseProperty("SupervisorAccount")]
    public virtual ICollection<Team> TeamSupervisorAccounts { get; set; } = new List<Team>();

    [InverseProperty("TeamLeader")]
    public virtual ICollection<TaskSubmission> TaskSubmissions { get; set; } = new List<TaskSubmission>();

    [InverseProperty("TeamLeaderAccount")]
    public virtual ICollection<Team> TeamTeamLeaderAccounts { get; set; } = new List<Team>();
}
