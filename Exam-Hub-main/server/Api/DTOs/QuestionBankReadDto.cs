namespace QuizesApi.DTOs;

public class QuestionBankReadDto
{
    public long QuestionId { get; set; }
    public string QuestionTitle { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string? OptionC { get; set; }
    public string? OptionD { get; set; }
    public string? OptionE { get; set; }
    public string? OptionF { get; set; }
    public string? OptionG { get; set; }
    public string? OptionH { get; set; }
    public int UsedOptions { get; set; }
    public string CorrectAnswer { get; set; } = string.Empty;
    public string QuestionSubject { get; set; } = string.Empty;
    public decimal Mark { get; set; }
    public string? BankTitle { get; set; }
    public string? BankDescription { get; set; }
    public string? BankKey { get; set; }
    public long? GradeId { get; set; }
    public long? AccountId { get; set; }
    public long? ClassId { get; set; }
}