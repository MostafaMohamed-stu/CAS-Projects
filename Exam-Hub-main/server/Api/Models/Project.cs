using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class Project
{
    public long Id { get; set; }

    public string? NameAr { get; set; }

    public string NameEn { get; set; } = null!;

    public string CompanyName { get; set; } = null!;

    public string? AdditionalInformation { get; set; }

    public DateTime DateOfCreation { get; set; }

    public string ProjectDescription { get; set; } = null!;

    public long StatusId { get; set; }

    public long SupervisorAccountId { get; set; }

    public virtual Status Status { get; set; } = null!;

    public virtual Account SupervisorAccount { get; set; } = null!;

    public virtual ICollection<Team> Teams { get; set; } = new List<Team>();
}
