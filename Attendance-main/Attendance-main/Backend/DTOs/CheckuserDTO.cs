using System.ComponentModel.DataAnnotations;

namespace AttendanceBehaviour_Backend.DTOs
{
    public class CheckuserDTO
    {
      
        //public string FullName { get; set; } = string.Empty;
        [Required, MaxLength(14)]
        public string NationalID { get; set; }
    }
}
