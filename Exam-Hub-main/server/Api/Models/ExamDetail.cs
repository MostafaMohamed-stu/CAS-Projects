using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class ExamDetail
{
    public long ExamId { get; set; }

    public string? Title { get; set; }

    public string? ExamSubject { get; set; }

    public string? ExamDescription { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public long? GradeId { get; set; }

    public string? ClassId { get; set; }

    public long? CreatedBy_AccId { get; set; }

    public long? SubjectId { get; set; }

    public virtual Status? Subject { get; set; }
    public virtual ICollection<StudentExamAnswer> StudentExamAnswers { get; set; } = new List<StudentExamAnswer>();
}
