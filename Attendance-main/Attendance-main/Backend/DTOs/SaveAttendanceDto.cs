namespace AttendanceBehaviour_Backend.DTOs
{
    public class SaveAttendanceDto
    {
        public long ClassId { get; set; }
        public long StudentId { get; set; }
        public DateTime? Date { get; set; } // Make it nullable to match the model
        public int SessionNumber { get; set; }
        public bool IsPresent { get; set; }
        public long? NoteId { get; set; }
        //public List<StudentAttendanceDto> Students { get; set; }
    }
}
