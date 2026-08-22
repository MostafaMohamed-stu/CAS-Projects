using AttendanceBehaviour_Backend.Models;

namespace AttendanceBehaviour_Backend.DTOs
{
    public class StudentExtensionDto
    {
        public long StudentId { get; set; } 
        public string ?StudentName { get; set; }        
        public string ?StudentNameAr { get; set; }
    }
    
}
