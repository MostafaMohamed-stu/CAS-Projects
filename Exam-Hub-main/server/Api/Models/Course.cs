using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class Course
{
    public long Id { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public long LevelId { get; set; }

    public long DurationHours { get; set; }

    public long? MaxStudents { get; set; }

    public decimal? Price { get; set; }
}
