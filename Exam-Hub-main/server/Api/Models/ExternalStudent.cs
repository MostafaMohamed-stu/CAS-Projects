using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class ExternalStudent
{
    public long Id { get; set; }

    public long AccountId { get; set; }

    public string FullName { get; set; } = null!;

    public DateOnly? Dob { get; set; }

    public long? GenderId { get; set; }

    public string? PhoneNumber { get; set; }

    public long? EducationalLevelId { get; set; }

    public long? GovernoratesId { get; set; }

    public DateTime RegistrationDate { get; set; }
}
