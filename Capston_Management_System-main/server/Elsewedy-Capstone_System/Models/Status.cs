using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Models;

[Table("Status")]
public partial class Status
{
    [Key]
    public long Id { get; set; }

    public string StatusName { get; set; } = null!;

    public string? BusinessEntity { get; set; }

    public int? OrderNo { get; set; }

    [InverseProperty("Status")]
    public virtual ICollection<Account> Accounts { get; set; } = new List<Account>();

    [InverseProperty("Status")]
    public virtual ICollection<Grade> Grades { get; set; } = new List<Grade>();

    [InverseProperty("Status")]
    public virtual ICollection<Login> Logins { get; set; } = new List<Login>();

    [InverseProperty("Status")]
    public virtual ICollection<Project> Projects { get; set; } = new List<Project>();

    [InverseProperty("Status")]
    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();

    [InverseProperty("Status")]
    public virtual ICollection<ReviewerSupervisorExtension> ReviewerSupervisorExtensions { get; set; } = new List<ReviewerSupervisorExtension>();

    [InverseProperty("Status")]
    public virtual ICollection<CapstoneSupervisorExtension> CapstoneSupervisorExtensions { get; set; } = new List<CapstoneSupervisorExtension>();

    [InverseProperty("Status")]
    public virtual ICollection<StudentExtension> StudentExtensions { get; set; } = new List<StudentExtension>();

    [InverseProperty("Status")]
    public virtual ICollection<StudentTask> StudentTasks { get; set; } = new List<StudentTask>();

    [InverseProperty("Status")]
    public virtual ICollection<SuperAdminExtension> SuperAdminExtensions { get; set; } = new List<SuperAdminExtension>();

    [InverseProperty("Status")]
    public virtual ICollection<TblClass> TblClasses { get; set; } = new List<TblClass>();

    [InverseProperty("Status")]
    public virtual ICollection<TblTask> TblTasks { get; set; } = new List<TblTask>();

    [InverseProperty("Status")]
    public virtual ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();

    [InverseProperty("Status")]
    public virtual ICollection<Team> Teams { get; set; } = new List<Team>();
}
