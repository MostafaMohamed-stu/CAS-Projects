using AttendanceBehaviour_Backend.Models;

namespace AttendanceBehaviour_Backend.Interfaces
{
    public interface IUserRepository
    {
        Task<Account?> GetUserByEmailAsync(string email);
        Task<Account?> GetUserByResetTokenAsync(string token);
        Task AddUserAsync(Account user);
        Task SaveChangesAsync();
        Task<Role?> GetRoleByIdAsync(int id);
        // Add delete account method
        Task<bool> DeleteAccountAsync(long accountId);
    }
}
