using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Models;

[Table("ReviewerSupervisorExtension")]
public partial class ReviewerSupervisorExtension
{
    [Key]
    public long AccountId { get; set; }

    public long? AssignedClassId { get; set; }

    public long StatusId { get; set; }

    [ForeignKey("AccountId")]
    [InverseProperty("ReviewerSupervisorExtension")]
    public virtual Account Account { get; set; } = null!;

    [ForeignKey("AssignedClassId")]
    [InverseProperty("ReviewerSupervisorExtensions")]
    public virtual TblClass? AssignedClass { get; set; }

    [ForeignKey("StatusId")]
    [InverseProperty("ReviewerSupervisorExtensions")]
    public virtual Status Status { get; set; } = null!;
}
