using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class Session
{
    public long Id { get; set; }

    public int? SessionNo { get; set; }

    public TimeOnly? FromDate { get; set; }

    public TimeOnly? ToDate { get; set; }

    public long StatusId { get; set; }

    public string? Note { get; set; }
}
