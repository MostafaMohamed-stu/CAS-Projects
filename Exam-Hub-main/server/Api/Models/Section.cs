using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class Section
{
    public long Id { get; set; }

    public string SectionName { get; set; } = null!;
}
