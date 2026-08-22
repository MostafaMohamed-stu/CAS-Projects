using System.ComponentModel.DataAnnotations;

namespace SchoolAdmission.DTOs
{
    public class SubmitAnswersDTO
    {
        [Required]
        public string NationalId { get; set; } = string.Empty;
        [Required]
        public List<AnswerDTO> Answers { get; set; } = new List<AnswerDTO>();
    }

    public class AnswerDTO
    {
        [Required]
        public long QuestionId { get; set; }
        [Required]
        public string ChosenAnswer { get; set; } = string.Empty;
    }
}
