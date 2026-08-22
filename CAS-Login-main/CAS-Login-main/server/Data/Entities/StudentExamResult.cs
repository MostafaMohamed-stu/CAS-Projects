using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class StudentExamResult
{
    public long AccountId { get; set; }

    public int ExamArabicScore { get; set; }

    public int ExamEnglishScore { get; set; }

    public int ExamMathScore { get; set; }

    public int ExamSoftwareScore { get; set; }

    public int? ExamIqscore { get; set; }

    public DateTime? ExamStartedAtUtc { get; set; }

    public int? ExtensionMinutes { get; set; }

    public virtual Account Account { get; set; } = null!;
}
