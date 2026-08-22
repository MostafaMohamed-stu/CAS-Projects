namespace AttendanceBehaviour_Backend.DTOs
{
    public class AbsenceRecordDto
    {
        public long Id { get; set; }
        public long StudentId { get; set; }
        public string StudentName { get; set; }
        public string? StudentNameAr { get; set; }
        public DateTime Date { get; set; }
        public DateTime DateOfAbsence { get; set; }
        public int Session { get; set; }
        public long ClassId { get; set; }
        
        // Use PascalCase for C# - JSON serializer will convert to camelCase automatically
        public string Class { get; set; }  
        public string Grade { get; set; }
        
        public int? AbsenceTypeId { get; set; }
        public long? LectuerId { get; set; } // Added to fix teacher filtering

        public string? LecturerName { get; set; }
        public string? LecturerNameAr { get; set; }

        public DateTime RecordedAt { get; set; }
    }
    
    public class CreateAbsenceRecordDto
    {
        public long StudentId { get; set; }
        public long ClassId { get; set; }
        public DateTime DateOfAbsence { get; set; }
        public long lectuerID { get; set; }
        public long SessionID { get; set; }
        public int? AbsenceTypeId { get; set; }
    }
}