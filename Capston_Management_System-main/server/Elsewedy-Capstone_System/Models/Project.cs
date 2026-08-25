using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Models;

[Table("Project")]
public partial class Project
{
    [Key]
    public long Id { get; set; }

    [Column("NameAR")]
    public string? NameAr { get; set; }

    [Column("NameEN")]
    public string NameEn { get; set; } = null!;

    public string CompanyName { get; set; } = null!;

    public string? AdditionalInformation { get; set; }

    public DateTime DateOfCreation { get; set; }

    public string ProjectDescription { get; set; } = null!;

    public long StatusId { get; set; }

    public long SupervisorAccountId { get; set; }

    [ForeignKey("StatusId")]
    [InverseProperty("Projects")]
    public virtual Status Status { get; set; } = null!;

    [ForeignKey("SupervisorAccountId")]
    [InverseProperty("Projects")]
    public virtual Account SupervisorAccount { get; set; } = null!;

    [InverseProperty("Project")]
    public virtual ICollection<Team> Teams { get; set; } = new List<Team>();
}
