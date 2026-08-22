using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class StudentProfile
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public int? Age { get; set; }

    public string? Grade { get; set; }
}
