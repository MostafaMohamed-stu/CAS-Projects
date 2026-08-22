using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class AbsenceRecord
{
    public long Id { get; set; }

    public long StudentId { get; set; }

    public long ClassId { get; set; }

    public DateOnly DateOfAbsence { get; set; }

    public long? LectuerId { get; set; }

    public long? SessionId { get; set; }

    public int? AbsenceTypeId { get; set; }
}
