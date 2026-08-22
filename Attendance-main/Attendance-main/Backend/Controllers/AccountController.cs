using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AttendanceBehaviour_Backend.Data;
using AttendanceBehaviour_Backend.Models;
using AttendanceBehaviour_Backend.DTOs;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace AttendanceBehaviour_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Require authentication for all endpoints
    public class AccountController : ControllerBase
    {
        private readonly ElsewedySchoolContext _context;

        public AccountController(ElsewedySchoolContext context)
        {
            _context = context;
        }

        // PUT /api/Account/password - Update user password
        [HttpPut("password")]
        public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordDto dto)
        {
            try
            {
                // Get the authenticated user's ID
                var accountIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(accountIdStr) || !long.TryParse(accountIdStr, out long accountId))
                {
                    return Unauthorized(new { message = "User not authenticated." });
                }

                // Find the account
                var account = await _context.Accounts.FindAsync(accountId);
                if (account == null)
                {
                    return NotFound(new { message = "Account not found." });
                }

                // Verify current password
                if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, account.PasswordHash))
                {
                    return BadRequest(new { message = "Current password is incorrect." });
                }

                // Update password
                account.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                
                // Clear reset token if it exists
                account.ResetToken = null;
                account.ResetTokenExpiry = null;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Password updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to update password: {ex.Message}" });
            }
        }

        // PUT /api/Account/profile - Update user profile
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            try
            {
                // Get the authenticated user's ID
                var accountIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(accountIdStr) || !long.TryParse(accountIdStr, out long accountId))
                {
                    return Unauthorized(new { message = "User not authenticated." });
                }

                // Find the account
                var account = await _context.Accounts.FindAsync(accountId);
                if (account == null)
                {
                    return NotFound(new { message = "Account not found." });
                }

                // Update profile information
                account.FullNameEn = dto.FullName;
                account.Email = dto.Email?.ToLower();
                account.Phone = dto.Phone;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Profile updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to update profile: {ex.Message}" });
            }
        }
    }
}
