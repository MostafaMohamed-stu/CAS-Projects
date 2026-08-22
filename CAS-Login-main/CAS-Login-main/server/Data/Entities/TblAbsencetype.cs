using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class TblAbsencetype
{
    public int Id { get; set; }

    public int OrderNumber { get; set; }

    public string AbsenceType { get; set; } = null!;
}
