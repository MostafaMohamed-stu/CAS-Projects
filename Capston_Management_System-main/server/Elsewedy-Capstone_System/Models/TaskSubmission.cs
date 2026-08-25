using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Models;

[Table("TaskSubmission")]
public partial class TaskSubmission
{
    [Key]
    [Column("TaskSubmission_ID")]
    public long TaskSubmissionId { get; set; }

    [Column("Team_ID")]
    public long TeamId { get; set; }

    [Column("TeamLeader_ID")]
    public long TeamLeaderId { get; set; }

    [Column("Grade_ID")]
    public long GradeId { get; set; }

    [Column("Task_ID")]
    public long? TaskId { get; set; }

    [Column("GLink")]
    [StringLength(255)]
    public string? Glink { get; set; }

    [Column("Note")]
    public string? Note { get; set; }

    [Column("Feedback")]
    public string? Feedback { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    [Column("status_id")]
    public long StatusId { get; set; }

    [ForeignKey("GradeId")]
    [InverseProperty("TaskSubmissions")]
    [JsonIgnore]

    public virtual Grade? Grade { get; set; } = null!;

    [ForeignKey("TeamId")]
    [InverseProperty("TaskSubmissions")]
    [JsonIgnore]
    public virtual Team? Team { get; set; } = null!;

    [ForeignKey("TeamLeaderId")]
    [InverseProperty("TaskSubmissions")]
    [JsonIgnore]

    public virtual Account? TeamLeader { get; set; } = null!;
}
