public class ExamUpdateDto
{
    public string Title { get; set; }
    public long? SubjectId { get; set; }
    public string? ExamSubject { get; set; } // For backward compatibility - accepts subject name
    public string? ExamDescription { get; set; }
    public long? GradeId { get; set; }
    public string? Grade { get; set; } // For backward compatibility - accepts grade name
    public long? ClassId { get; set; } // Keep for backward compatibility
    public string? Class { get; set; } // For backward compatibility - accepts class name
    public List<long> ClassIds { get; set; } = new(); // Multiple classes support
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public long CreatedBy_AccID { get; set; }
    public long? CreatedBy { get; set; } // For backward compatibility

    // Question IDs to link from QuestionBank
    public List<long> QuestionIds { get; set; } = new();
}