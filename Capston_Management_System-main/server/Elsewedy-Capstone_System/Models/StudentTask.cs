using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Models;

[Table("StudentTask")]
public partial class StudentTask
{
    [Key]
    public long Id { get; set; }

    public long StudentAccountId { get; set; }

    public long TaskId { get; set; }

    public bool IsCompleted { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? CompletedAt { get; set; }

    public long StatusId { get; set; }

    [ForeignKey("StatusId")]
    [InverseProperty("StudentTasks")]
    public virtual Status Status { get; set; } = null!;

    [ForeignKey("StudentAccountId")]
    [InverseProperty("StudentTasks")]
    public virtual Account StudentAccount { get; set; } = null!;

    [ForeignKey("TaskId")]
    [InverseProperty("StudentTasks")]
    public virtual TblTask Task { get; set; } = null!;
}
