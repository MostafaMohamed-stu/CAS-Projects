using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Models;

[Table("StudentExtension")]
public partial class StudentExtension
{
    [Key]
    public long AccountId { get; set; }

    public bool IsLeader { get; set; }

    public long? ClassId { get; set; }

    public long StatusId { get; set; }

    [ForeignKey("AccountId")]
    [InverseProperty("StudentExtension")]
    public virtual Account Account { get; set; } = null!;

    [ForeignKey("ClassId")]
    [InverseProperty("StudentExtensions")]
    public virtual TblClass? Class { get; set; }

    [ForeignKey("StatusId")]
    [InverseProperty("StudentExtensions")]
    public virtual Status Status { get; set; } = null!;
}
