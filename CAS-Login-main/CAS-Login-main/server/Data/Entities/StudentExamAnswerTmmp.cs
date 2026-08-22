using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class StudentExamAnswerTmmp
{
    public long Id { get; set; }

    public long AccountId { get; set; }

    public long ExamId { get; set; }

    public string ChoosedAnswer { get; set; } = null!;

    public bool Score { get; set; }

    public long? QuestionbankId { get; set; }

    public long? ExamDetailsId { get; set; }

    public virtual Account Account { get; set; } = null!;
}
