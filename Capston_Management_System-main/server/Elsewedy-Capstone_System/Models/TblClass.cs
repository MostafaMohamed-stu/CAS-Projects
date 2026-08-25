using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Models;

[Table("Tbl_Class")]
public partial class TblClass
{
    [Key]
    public long Id { get; set; }

    public string ClassName { get; set; } = null!;

    public long GradeId { get; set; }

    public long StatusId { get; set; }

    [ForeignKey("GradeId")]
    [InverseProperty("TblClasses")]
    public virtual Grade Grade { get; set; } = null!;

    [InverseProperty("AssignedClass")]
    public virtual ICollection<ReviewerSupervisorExtension> ReviewerSupervisorExtensions { get; set; } = new List<ReviewerSupervisorExtension>();

    [ForeignKey("StatusId")]
    [InverseProperty("TblClasses")]
    public virtual Status Status { get; set; } = null!;

    [InverseProperty("Class")]
    public virtual ICollection<StudentExtension> StudentExtensions { get; set; } = new List<StudentExtension>();

    [InverseProperty("Class")]
    public virtual ICollection<Team> Teams { get; set; } = new List<Team>();
}
