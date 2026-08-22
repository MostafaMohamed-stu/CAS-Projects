using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class Application
{
    public long Id { get; set; }

    public long CourseRoundId { get; set; }

    public DateTime ApplicationDate { get; set; }

    public long StatusId { get; set; }

    public string? Answer1 { get; set; }

    public string? Answer2 { get; set; }

    public string? Answer3 { get; set; }

    public string? Answer4 { get; set; }

    public string? Answer5 { get; set; }

    public string? Answer6 { get; set; }

    public string? Answer7 { get; set; }

    public string? Answer8 { get; set; }

    public string? Answer9 { get; set; }

    public string? Answer10 { get; set; }

    public long AccountId { get; set; }

    public virtual Account Account { get; set; } = null!;
}
