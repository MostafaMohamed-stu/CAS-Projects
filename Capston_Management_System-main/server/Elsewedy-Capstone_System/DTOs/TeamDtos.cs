namespace Elsewedy_Capstone_System.DTOs
{
    public class TeamCreateDto
    {
        public string TeamName { get; set; }
        public long TeamLeaderAccountId { get; set; }
        public long ClassId { get; set; }
        public long? SupervisorAccountId { get; set; }
        public long? ProjectId { get; set; }
        public long StatusId { get; set; }
    }

    public class AssignTeamLeaderRequest
    {
        public long TeamLeaderId { get; set; }
    }
}


