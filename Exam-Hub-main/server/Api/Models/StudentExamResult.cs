using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class StudentExamResult
{
    public long AccountId { get; set; }

    public int ExamArabicScore { get; set; }

    public int ExamEnglishScore { get; set; }

    public int ExamMathScore { get; set; }

    public int ExamSoftwareScore { get; set; }

    public virtual Account Account { get; set; } = null!;
}
