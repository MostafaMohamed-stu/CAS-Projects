using System.ComponentModel.DataAnnotations.Schema;

namespace QuizesApi.Models;

public partial class ExamQuestionBank
{
    [NotMapped]
    public virtual QuestionBank Question { get; set; }

    [NotMapped]
    public virtual ExamDetail Exam { get; set; }
}
