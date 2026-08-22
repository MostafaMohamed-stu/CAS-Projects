namespace AttendanceBehaviour_Backend.DTOs
{
    public class CreateSubordinateTicketDto
    {
        public long StudentAccountId { get; set; }
        public long ClassId { get; set; }
        public long SessionId { get; set; }
        public long? SupervisorAccountId { get; set; } // Optional, defaults to teacher account
    }

    public class AssignAllSessionsDto
    {
        public long StudentAccountId { get; set; }
        public long ClassId { get; set; }
        public long? SupervisorAccountId { get; set; } // Optional, defaults to teacher account
    }

    public class SubordinateTicketDto
    {
        public long Id { get; set; }
        public long? SupervisorAccountId { get; set; }
        public long? GradeId { get; set; }
        public long? ClassId { get; set; }
        public long? SessionId { get; set; }
        public long? SubordinateAccountId { get; set; }
        public long? TicketTypeId { get; set; }
        public long StatusId { get; set; }
        public string? ClassName { get; set; }
        public string? GradeName { get; set; }
        public string? SessionName { get; set; }
        public int? SessionNo { get; set; }
    }
}
