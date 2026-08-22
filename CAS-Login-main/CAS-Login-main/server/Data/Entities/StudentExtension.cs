using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class StudentExtension
{
    public long AccountId { get; set; }

    public bool IsLeader { get; set; }

    public long? ClassId { get; set; }

    public long StatusId { get; set; }

    public string? Macaddress { get; set; }

    public long? EducationalLevelStatusId { get; set; }

    public string? HostName { get; set; }

    public virtual Account Account { get; set; } = null!;

    public virtual Status Status { get; set; } = null!;
}
