using System;
using System.Collections.Generic;

namespace AttendanceBehaviour_Backend.Models;

public partial class AccountRole
{
    public long Id { get; set; }

    public long? RoleId { get; set; }

    public long? AccountId { get; set; }

    public string? BusinessEntityName { get; set; }
    public virtual Role ?Roles { get; set; }   
}
