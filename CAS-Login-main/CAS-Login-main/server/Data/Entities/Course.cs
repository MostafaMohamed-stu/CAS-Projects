using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class Course
{
    public long Id { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public long? LevelStatusId { get; set; }

    public long? DurationHours { get; set; }

    public string? BusinessEntity { get; set; }

    public long? GradeId { get; set; }
}
