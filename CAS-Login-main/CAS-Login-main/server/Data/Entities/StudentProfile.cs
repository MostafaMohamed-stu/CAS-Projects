using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class StudentProfile
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public int? Age { get; set; }

    public string? Grade { get; set; }
}
