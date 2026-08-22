using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class Level
{
    public long Id { get; set; }

    public string Name { get; set; } = null!;
}
