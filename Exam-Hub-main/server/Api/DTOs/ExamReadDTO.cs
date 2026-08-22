using System.Collections.Generic;

namespace QuizesApi.DTOs
{
    public class ExamReadDto
    {
        public long ExamId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? SubjectName { get; set; }
        public string ExamDescription { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public long? GradeId { get; set; }
        public long? SubjectId { get; set; }
        public string? ClassId { get; set; }

        public List<QuestionBankReadDto> Questions { get; set; } = new();
        public decimal TotalMarks { get; set; }
    }
}