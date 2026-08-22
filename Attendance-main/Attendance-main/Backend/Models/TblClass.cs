using System;
using System.Collections.Generic;

namespace AttendanceBehaviour_Backend.Models;

public partial class TblClass
{
    public long Id { get; set; }

    public string ClassName { get; set; } = null!;

    public long GradeId { get; set; }
    public Status ?Status { get; set; }

    public long StatusId { get; set; }
    public Grade ?Grade { get; set; } 
    public ICollection<StudentExtension> ?studentExtensions { get; set; }
    
}
