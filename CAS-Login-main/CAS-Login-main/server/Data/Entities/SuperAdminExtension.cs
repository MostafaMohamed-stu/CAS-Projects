using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class SuperAdminExtension
{
    public long AccountId { get; set; }

    public long StatusId { get; set; }

    public virtual Account Account { get; set; } = null!;

    public virtual Status Status { get; set; } = null!;
}
