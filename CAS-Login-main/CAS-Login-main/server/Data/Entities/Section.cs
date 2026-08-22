using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class Section
{
    public long Id { get; set; }

    public string SectionName { get; set; } = null!;
}
