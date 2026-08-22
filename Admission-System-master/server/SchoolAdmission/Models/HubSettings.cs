using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace SchoolAdmission.Models;

[Table("HUB_Settings")]
public class HubSettings
{
    public long Id { get; set; }
    public int VersionNumber { get; set; }
    public string VersionName { get; set; } = string.Empty;
    
    [Column("Setting_StatusID")]
    public int SettingStatusId { get; set; }

    public decimal SchoolExamWeight { get; set; }
    public decimal InterviewWeight { get; set; }
    public decimal PreparatoryCertificateWeight { get; set; }
    public decimal MinistryExamWeight { get; set; }

    public decimal ArabicWeight { get; set; }
    public decimal EnglishWeight { get; set; }
    public decimal MathWeight { get; set; }
    public decimal SoftwareWeight { get; set; }
    public decimal IqWeight { get; set; }

    public int QuestionsPerSection { get; set; }
    public int RequireFullQuestionSet { get; set; }
    public int ExamDurationMinutes { get; set; }

    public DateTime CreatedAtUtc { get; set; }
    public long? CreatedByAccountId { get; set; }
}
