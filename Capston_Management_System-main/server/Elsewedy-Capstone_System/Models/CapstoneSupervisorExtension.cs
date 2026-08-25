using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Models;

[Table("CapstoneSupervisorExtension")]
public partial class CapstoneSupervisorExtension
{
    [Key]
    public long AccountId { get; set; }

    public long StatusId { get; set; }

    [ForeignKey("AccountId")]
    [InverseProperty("CapstoneSupervisorExtension")]
    public virtual Account Account { get; set; } = null!;

    [ForeignKey("StatusId")]
    [InverseProperty("CapstoneSupervisorExtensions")]
    public virtual Status Status { get; set; } = null!;
}
