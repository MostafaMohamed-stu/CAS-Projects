using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class AccountTemp
{
    public long Id { get; set; }

    public string NationalId { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    public string? City { get; set; }

    public string? FullNameEn { get; set; }

    public string? FullNameAr { get; set; }

    public DateOnly? CreatedAt { get; set; }

    public bool IsActive { get; set; }

    public long StatusId { get; set; }
}
