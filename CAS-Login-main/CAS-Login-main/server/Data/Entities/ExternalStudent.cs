using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class ExternalStudent
{
    public long Id { get; set; }

    public long? AccountId { get; set; }

    public string FullName { get; set; } = null!;

    public DateOnly? Dob { get; set; }

    public long? GenderStatesId { get; set; }

    public string? PhoneNumber { get; set; }

    public long? StatusId { get; set; }

    public long? GovernoratesId { get; set; }

    public DateTime RegistrationDate { get; set; }

    public string? Email { get; set; }

    public string? Password { get; set; }
}
