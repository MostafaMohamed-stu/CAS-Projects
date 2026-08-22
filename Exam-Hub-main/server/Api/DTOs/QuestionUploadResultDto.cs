
using System.Collections.Generic;

namespace QuizesApi.DTOs
{
    public class QuestionUploadResultDto
    {
        public int TotalProcessed { get; set; }
        public int SuccessCount { get; set; }
        public int FailureCount { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public List<QuestionBankReadDto> AddedQuestions { get; set; } = new List<QuestionBankReadDto>();
    }
}
