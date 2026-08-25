using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Models;

[Table("Tbl_Task")]
public partial class TblTask
{
    [Key]
    public long Id { get; set; }

    public string TaskName { get; set; } = null!;

    public string? TaskDescription { get; set; }

    [Column("AssignedToID")]
    public long? AssignedToId { get; set; }

    [Column("AssignedByID")]
    public long? AssignedById { get; set; }

    public DateOnly? DueDate { get; set; }

    public DateOnly? CreatedAt { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime TaskDeadline { get; set; }

    public long? GradeId { get; set; }

    public long? AdminAccountId { get; set; }

    public long? StatusId { get; set; }

    [ForeignKey("AdminAccountId")]
    [InverseProperty("TblTasks")]
    public virtual Account? AdminAccount { get; set; }

    [ForeignKey("GradeId")]
    [InverseProperty("TblTasks")]
    public virtual Grade? Grade { get; set; }

    [ForeignKey("StatusId")]
    [InverseProperty("TblTasks")]
    [JsonIgnore]
    public virtual Status? Status { get; set; } = null!;

    [Column("Team_Id")]
    public int? TeamId { get; set; }
    
    [Column("Class_Id")]
    public int? ClassId { get; set; }

    [Column("WeekID")]
    public int WeekId { get; set; }

    // Navigation property removed to avoid type mismatch with DB (int vs bigint)

    [InverseProperty("Task")]
    public virtual ICollection<StudentTask> StudentTasks { get; set; } = new List<StudentTask>();
}
