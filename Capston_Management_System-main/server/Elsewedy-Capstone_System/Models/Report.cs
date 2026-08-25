using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Models;

[Table("Report")]
public partial class Report
{
    [Key]
    public long Id { get; set; }

    public string Title { get; set; } = null!;

    [Column(TypeName = "datetime")]
    public DateTime SubmissionDate { get; set; } = DateTime.Now;

    public string ReportMessage { get; set; } = null!;

    public long SubmitterAccountId { get; set; }

    public long StatusId { get; set; }

    [ForeignKey("StatusId")]
    [InverseProperty("Reports")]
    [JsonIgnore]

    public virtual Status? Status { get; set; } = null!;

    [ForeignKey("SubmitterAccountId")]
    [InverseProperty("Reports")]
    [JsonIgnore]
    public virtual Account? SubmitterAccount { get; set; } = null!;
}
