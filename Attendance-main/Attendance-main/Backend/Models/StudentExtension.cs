using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace AttendanceBehaviour_Backend.Models;

public partial class StudentExtension
{
    public long AccountId { get; set; }

    public bool IsLeader { get; set; }

    [ForeignKey(nameof(TblClass))]
    [Column("ClassId")] // match DB column name
    public long? TblClassId { get; set; }


    public long StatusId { get; set; }

    public virtual Account Account { get; set; } = null!;

    public virtual Status Status { get; set; } = null!;

    [ForeignKey("TblClassId")]
    [InverseProperty("StudentExtensions")]
    public virtual TblClass? TblClass { get; set; }
}
