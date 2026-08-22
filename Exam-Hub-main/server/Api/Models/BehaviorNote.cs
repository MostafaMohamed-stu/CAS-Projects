using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class BehaviorNote
{
    public long Id { get; set; }

    public long AttendanceRecordId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public string NoteType { get; set; } = null!;

    public string? Gen { get; set; }

    public virtual AttendanceRecord AttendanceRecord { get; set; } = null!;
}
