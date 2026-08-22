using System;
using System.Collections.Generic;

namespace AttendanceBehaviour_Backend.Models;

public partial class ExamQuestionBank
{
    public int Id { get; set; }

    public long? ExamId { get; set; }

    public long? QuestionId { get; set; }
}
