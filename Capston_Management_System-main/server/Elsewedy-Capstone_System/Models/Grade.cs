using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Models;

[Table("Grade")]
public partial class Grade
{
    [Key]
    public long Id { get; set; }

    public string GradeName { get; set; } = null!;

    public long? ParentGradeId { get; set; }

    public long? AdminAccountId { get; set; }

    public long StatusId { get; set; }

    [ForeignKey("AdminAccountId")]
    [InverseProperty("Grades")]
    public virtual Account? AdminAccount { get; set; }

    [ForeignKey("StatusId")]
    [InverseProperty("Grades")]
    public virtual Status Status { get; set; } = null!;

    [InverseProperty("Grade")]
    public virtual ICollection<TblClass> TblClasses { get; set; } = new List<TblClass>();

    [InverseProperty("Grade")]
    public virtual ICollection<TblTask> TblTasks { get; set; } = new List<TblTask>();

    [InverseProperty("Grade")]
    public virtual ICollection<TaskSubmission> TaskSubmissions { get; set; } = new List<TaskSubmission>();
}
