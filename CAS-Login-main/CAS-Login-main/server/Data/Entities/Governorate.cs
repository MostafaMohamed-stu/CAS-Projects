using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class Governorate
{
    public long Id { get; set; }

    public string GovernorateNameAr { get; set; } = null!;

    public string GovernorateNameEn { get; set; } = null!;
}
