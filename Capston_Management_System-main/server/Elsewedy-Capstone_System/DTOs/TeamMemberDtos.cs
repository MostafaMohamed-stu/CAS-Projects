namespace Elsewedy_Capstone_System.DTOs
{
    public class TeamMemberReadDto
    {
        public long Id { get; set; }
        public long TeamId { get; set; }
        public long TeamMemberAccountId { get; set; }
        public string TeamMemberDescription { get; set; }
        public long StatusId { get; set; }
        public string TeamName { get; set; }
        public string TeamMemberName { get; set; }
        public string StatusName { get; set; }
    }

    public class CreateTeamMemberDto
    {
        public long TeamId { get; set; }
        public long TeamMemberAccountId { get; set; }
        public string TeamMemberDescription { get; set; }
        public long StatusId { get; set; }
    }

    public class UpdateTeamMemberDto
    {
        public string TeamMemberDescription { get; set; }
        public long StatusId { get; set; }
    }
}


