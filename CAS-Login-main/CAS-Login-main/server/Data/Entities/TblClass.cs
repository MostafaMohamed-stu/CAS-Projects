using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class TblClass
{
    public long Id { get; set; }

    public string ClassName { get; set; } = null!;

    public long GradeId { get; set; }

    public long StatusId { get; set; }
}
