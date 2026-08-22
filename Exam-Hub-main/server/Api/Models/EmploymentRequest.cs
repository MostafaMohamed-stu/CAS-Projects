using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class EmploymentRequest
{
    public long Id { get; set; }

    public string CompanyName { get; set; } = null!;

    public string LinkedInUrl { get; set; } = null!;

    public string CompanyEmail { get; set; } = null!;

    public string CompanyPhone { get; set; } = null!;

    public string Address { get; set; } = null!;

    public string Specialization { get; set; } = null!;

    public string Amount { get; set; } = null!;

    public string OwnerName { get; set; } = null!;

    public string OwnerPhone { get; set; } = null!;

    public string OwnerEmail { get; set; } = null!;

    public string EmploymentType { get; set; } = null!;

    public long StatusId { get; set; }

    public DateTime RequestDate { get; set; }

    public virtual Status Status { get; set; } = null!;
}
