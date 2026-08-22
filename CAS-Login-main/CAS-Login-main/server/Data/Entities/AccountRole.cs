using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class AccountRole
{
    public long Id { get; set; }

    public long? RoleId { get; set; }

    public long? AccountId { get; set; }

    public string? BusinessEntityName { get; set; }
}
