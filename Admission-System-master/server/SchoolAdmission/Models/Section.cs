using System;
using System.Collections.Generic;

namespace SchoolAdmission.Models;

public partial class Section
{
    public long Id { get; set; }

    public string SectionName { get; set; } = null!;
    public virtual ICollection<ExamQuestion> ExamQuestions { get; set; } = new List<ExamQuestion>();

}
