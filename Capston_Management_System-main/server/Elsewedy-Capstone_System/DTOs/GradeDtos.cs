namespace Elsewedy_Capstone_System.DTOs
{
    public class ReadGradeDto
    {
        public long Id { get; set; }
        public string GradeName { get; set; }
        public long? ParentGradeId { get; set; }
        public long? AdminAccountId { get; set; }
        public long StatusId { get; set; }
    }

    public class CreateGradeDto
    {
        public string GradeName { get; set; }
        public long? ParentGradeId { get; set; }
        public long? AdminAccountId { get; set; }
        public long StatusId { get; set; }
    }

    public class UpdateGradeDto
    {
        public string GradeName { get; set; }
        public long? ParentGradeId { get; set; }
        public long? AdminAccountId { get; set; }
        public long StatusId { get; set; }
    }
}


