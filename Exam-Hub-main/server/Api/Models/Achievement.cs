using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class Achievement
{
    public long Id { get; set; }

    public string? Title { get; set; }

    public string Description { get; set; } = null!;

    public string ImageUrl { get; set; } = null!;
}
