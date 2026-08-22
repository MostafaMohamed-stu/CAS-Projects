using AttendanceBehaviour_Backend.DTOs;
using AttendanceBehaviour_Backend.Models;

namespace AttendanceBehaviour_Backend.Interfaces
{
    public interface IAuthService
    {
        Task<object> CheckUserAsync( string nationalId);
        Task<string?> ForgotPasswordAsync(ForgotPasswordDto dto);
        Task<string?> ResetPasswordAsync(string token, ResetPasswordDto dto);
        Task<string?> LoginAsync(LoginDto dto);
        Task<string?> SignupAsync(RegisterDto dto);
        Task<(string?, long?)> SignupAsyncWithId(RegisterDto dto);
    }
}
