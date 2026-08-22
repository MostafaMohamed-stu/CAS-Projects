using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class AdmissionQuizMath
{
    public string? Question { get; set; }

    public string? A { get; set; }

    public string? B { get; set; }

    public string? C { get; set; }

    public string? D { get; set; }

    public string? Answer { get; set; }

    public string? CorrectAnswerTxt { get; set; }
}
