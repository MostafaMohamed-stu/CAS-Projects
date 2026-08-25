using System;

namespace Elsewedy_Capstone_System.Models.DTOs
{
    public class ReadTaskDto
    {
        public long Id { get; set; }
        public string TaskName { get; set; }
        public string TaskDescription { get; set; }
        public DateTime? TaskDeadline { get; set; }
        public string GithubLink { get; set; }
        public long? GradeId { get; set; }
        public long? AdminAccountId { get; set; }
        public long StatusId { get; set; }
    }

    public class CreateTaskDto
    {
        public string TaskName { get; set; }
        public string TaskDescription { get; set; }
        public DateTime? TaskDeadline { get; set; }
        public string GithubLink { get; set; }
        public long? GradeId { get; set; }
        public long? AdminAccountId { get; set; }
        public long StatusId { get; set; }
    }

    public class UpdateTaskDto
    {
        public long Id { get; set; }
        public string TaskName { get; set; }
        public string TaskDescription { get; set; }
        public DateTime? TaskDeadline { get; set; }
        public string GithubLink { get; set; }
        public long? GradeId { get; set; }
        public long? AdminAccountId { get; set; }
        public long StatusId { get; set; }
    }
}


