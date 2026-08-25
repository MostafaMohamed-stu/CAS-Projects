namespace Elsewedy_Capstone_System.DTOs
{
    public class SuperAdminExtensionReadDto
    {
        public long AccountId { get; set; }
        public long StatusId { get; set; }
    }

    public class SuperAdminExtensionCreateDto
    {
        public long AccountId { get; set; }
        public long StatusId { get; set; }
    }

    public class SuperAdminExtensionUpdateDto
    {
        public long StatusId { get; set; }
    }
}


