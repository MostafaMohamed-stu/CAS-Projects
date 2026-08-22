using Microsoft.EntityFrameworkCore;
using AttendanceBehaviour_Backend.Data;
using AttendanceBehaviour_Backend.Data;
using AttendanceBehaviour_Backend.Interfaces;
using AttendanceBehaviour_Backend.Models;

namespace AttendanceBehaviour_Backend.Repos
{
    public class UserRepository : IUserRepository
    {
        private readonly ElsewedySchoolContext _context;

        public UserRepository(ElsewedySchoolContext context)
        {
            _context = context;
        }

        public async Task<Account?> GetUserByEmailAsync(string email)
        {
            return await _context.Accounts
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        }

        public async Task<Account?> GetUserByResetTokenAsync(string token)
        {
            return await _context.Accounts.FirstOrDefaultAsync(u => u.ResetToken == token && u.ResetTokenExpiry > DateTime.UtcNow);
        }

        public async Task AddUserAsync(Account user)
        {
            await _context.Accounts.AddAsync(user);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<Role?> GetRoleByIdAsync(int id)
        {
            return await _context.Roles.FindAsync(id);
        }

        public async Task<bool> DeleteAccountAsync(long accountId)
        {
            var account = await _context.Accounts.FindAsync(accountId);
            if (account == null) return false;

            _context.Accounts.Remove(account);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
