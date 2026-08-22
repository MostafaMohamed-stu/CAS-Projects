using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace AttendanceBehaviour_Backend.Models
{
    public partial class AbsenceRecord
    {
        public long Id { get; set; }

        [ForeignKey(nameof(Studentextension))]
        public long StudentId { get; set; }

        public long ClassId { get; set; }

        public DateOnly DateOfAbsence { get; set; }

        [ForeignKey(nameof(Lecturer))]
        public long? LectuerId { get; set; }

        [ForeignKey(nameof(Session))]
        public long? SessionId { get; set; }

        public int? AbsenceTypeId { get; set; }

        // Navigation properties
        public virtual StudentExtension? Studentextension { get; set; }
        public virtual Session? Session { get; set; }
        public virtual Account? Lecturer { get; set; }
    }
}
