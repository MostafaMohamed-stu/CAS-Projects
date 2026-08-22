using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Data;
using SchoolAdmission.DTOs;
using SchoolAdmission.Repos.IRepos;
using SchoolAdmission.Services;

namespace SchoolAdmission.Controllers;

[ApiController]
[Route("api/admin/settings")]
[Authorize]
public class AdmissionSettingsController : ControllerBase
{
    private readonly AdmissionSettingsService _settingsService;
    private readonly SchoolAdmissionDbContext _db;
    private readonly IAuthRepo _authRepo;

    public AdmissionSettingsController(
        AdmissionSettingsService settingsService,
        SchoolAdmissionDbContext db,
        IAuthRepo authRepo)
    {
        _settingsService = settingsService;
        _db = db;
        _authRepo = authRepo;
    }

    [HttpGet]
    public async Task<IActionResult> GetActiveSettings()
    {
        var authorization = await GetAuthorizedSuperAdminAsync();
        if (authorization == null)
            return StatusCode(403, new { message = "Only SuperAdmin users can manage admission settings." });

        var settings = await _settingsService.GetActiveAsync();
        return Ok(AdmissionSettingsService.ToDto(settings));
    }

    [HttpPost]
    public async Task<IActionResult> SaveSettings([FromBody] UpdateAdmissionSettingsDTO request)
    {
        var admin = await GetAuthorizedSuperAdminAsync();
        if (admin == null)
            return StatusCode(403, new { message = "Only SuperAdmin users can manage admission settings." });

        try
        {
            var settings = await _settingsService.CreateVersionAsync(request, admin.Id);
            return Ok(new
            {
                message = "Settings saved as a new version. Existing student assignments were not changed.",
                settings = AdmissionSettingsService.ToDto(settings)
            });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    private async Task<Models.Account?> GetAuthorizedSuperAdminAsync()
    {
        var email = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("Email")?.Value;

        if (string.IsNullOrWhiteSpace(email) || !await _authRepo.IsSuperAdminAsync(email))
            return null;

        return await _db.Accounts.AsNoTracking().SingleOrDefaultAsync(account => account.Email == email);
    }
}
