//using V6.Models;
//using V6.Models;

namespace AttendanceBehaviour_Backend.DTOs
{
    public class LoginResponseDTO
    {
        public class LoginResponseDto
        {
            public bool IsSuccess { get; set; }
            public string Message { get; set; }
            public string? Token { get; set; } // Nullable in case of failure
           // public Account? User { get; set; } 
        }
    }
}
