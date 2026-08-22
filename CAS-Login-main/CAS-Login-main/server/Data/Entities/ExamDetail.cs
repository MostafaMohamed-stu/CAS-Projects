using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class ExamDetail
{
    public long ExamId { get; set; }

    public string? Title { get; set; }

    public string? ExamSubject { get; set; }

    public string? ExamDescription { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public long CreatedByAccId { get; set; }

    public string? ClassId { get; set; }

    public long? GradeId { get; set; }

    public long? SubjectId { get; set; }
}
