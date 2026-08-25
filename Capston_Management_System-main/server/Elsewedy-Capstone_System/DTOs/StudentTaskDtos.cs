using System;

namespace Elsewedy_Capstone_System.DTOs
{
    public class StudentTaskReadDto
    {
        public long Id { get; set; }
        public long StudentAccountId { get; set; }
        public string StudentName { get; set; }
        public long TaskId { get; set; }
        public string TaskTitle { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
        public long StatusId { get; set; }
        public string StatusName { get; set; }
    }

    public class CreateStudentTaskDto
    {
        public long StudentAccountId { get; set; }
        public long TaskId { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
        public long StatusId { get; set; }
    }

    public class UpdateStudentTaskDto
    {
        public bool IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
        public long StatusId { get; set; }
    }
}


