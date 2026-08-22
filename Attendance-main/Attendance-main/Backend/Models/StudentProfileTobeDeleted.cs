using System;
using System.Collections.Generic;

namespace AttendanceBehaviour_Backend.Models;

public partial class StudentProfileTobeDeleted
{
    public long Id { get; set; }

    public string? Name { get; set; }

    public string? Email { get; set; }

    public string? PhoneNumber { get; set; }

    public int? Age { get; set; }

    public string? City { get; set; }

    public string? Country { get; set; }

    public int? DaysAbsent { get; set; }

    public string? GoodNotesJson { get; set; }

    public string? BadNotesJson { get; set; }

    public DateTime? CreatedAt { get; set; }

    public long? ClassId { get; set; }
}
