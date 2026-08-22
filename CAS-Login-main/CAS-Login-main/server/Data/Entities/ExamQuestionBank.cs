using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

/// <summary>
/// IN Exam Hub it links an Exam to its childern questions.
/// IN Genz_coders it links a courseRound to its childern questions.
/// </summary>
public partial class ExamQuestionBank
{
    public int Id { get; set; }

    public long? ExamId { get; set; }

    public long? QuestionId { get; set; }

    public long? CourseRoundId { get; set; }
}
