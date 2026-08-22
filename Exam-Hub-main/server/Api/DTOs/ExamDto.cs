namespace QuizesApi.DTOs
{
    public class ExamDto
    {
        public int Id { get; set; }
        public string Title { get; set; }

        public ICollection<ExamQuestionBankDto> QuestionBanks { get; set; }
    }

    public class ExamQuestionBankDto
    {
        public int Id { get; set; }
        public string Question { get; set; }

    }
}
