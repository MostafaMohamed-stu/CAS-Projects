using System.Collections.Generic;

namespace AttendanceBehaviour_Backend.DTOs
{
    public class StudentAttendanceDto
    {
        public long StudentId { get; set; }
        public bool IsPresent { get; set; }
        public List<BehaviorNoteDto> Notes { get; set; }
        public long NoteId { get; set; }
    }
}
