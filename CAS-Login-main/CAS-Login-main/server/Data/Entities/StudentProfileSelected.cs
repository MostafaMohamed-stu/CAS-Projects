using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class StudentProfileSelected
{
    public int? Id { get; set; }

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

    public string? ClassName { get; set; }
}
