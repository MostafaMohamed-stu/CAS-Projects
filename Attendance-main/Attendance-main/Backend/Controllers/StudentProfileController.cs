using AttendanceBehaviour_Backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AttendanceBehaviour_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class StudentProfileController : ControllerBase
{
    private readonly ElsewedySchoolContext _context;

    public StudentProfileController(ElsewedySchoolContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Returns basic profile data for any account by its ID.
    /// Used by the Attendance frontend ProfilePage.
    /// </summary>
    [HttpGet("account/{accountId}")]
    public async Task<IActionResult> GetByAccountId(long accountId)
    {
        var account = await _context.Accounts
            .AsNoTracking()
            .Include(a => a.Role)
            .FirstOrDefaultAsync(a => a.Id == accountId);

        if (account == null)
            return NotFound(new { message = "Profile not found." });

        return Ok(new
        {
            id         = account.Id,
            profileId  = account.Id,
            name       = account.FullNameEn,
            nameAr     = account.FullNameAr,
            email      = account.Email,
            phoneNumber = account.Phone,
            joinDate   = account.CreatedAt,
            role       = account.Role?.RoleName,
            isActive   = account.IsActive,
            // imageP is not stored in Account; return null so the frontend falls back to placeholder
            imageP     = (string?)null
        });
    }
}
