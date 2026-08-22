using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class Staff
{
    public long Id { get; set; }

    public string EmployeeName { get; set; } = null!;

    public string Department { get; set; } = null!;

    public string Status { get; set; } = null!;

    public DateTime? CheckInTime { get; set; }

    public string CheckInMethod { get; set; } = null!;

    public DateTime DateStaff { get; set; }

    public long? AccountId { get; set; }

    public long? RoleId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
