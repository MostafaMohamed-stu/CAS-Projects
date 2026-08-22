using System;
using System.Collections.Generic;

namespace AttendanceBehaviour_Backend.Models;

public partial class ExamQuestion
{
    public long Id { get; set; }

    public string QuestionTitle { get; set; } = null!;

    public string Choice1 { get; set; } = null!;

    public string Choice2 { get; set; } = null!;

    public string Choice3 { get; set; } = null!;

    public string Choice4 { get; set; } = null!;

    public string CorrectAnswer { get; set; } = null!;

    public long SectionId { get; set; }

    public virtual ICollection<StudentExamAnswer> StudentExamAnswers { get; set; } = new List<StudentExamAnswer>();
}
