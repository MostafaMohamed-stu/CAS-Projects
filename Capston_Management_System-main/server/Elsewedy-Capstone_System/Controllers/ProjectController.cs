using Microsoft.AspNetCore.Mvc;
using Elsewedy_Capstone_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectController : ControllerBase
    {
        private readonly IProjectService _projectService;

        public ProjectController(IProjectService projectService)
        {
            _projectService = projectService;
        }

        [HttpGet("My")]
        public async Task<IActionResult> GetMyTeamProject()
        {
            try
            {
                if (!long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                    return Forbid();
                var result = await _projectService.GetMyTeamProjectAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("ByTeam/{teamId}")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> GetProjectByTeam(long teamId)
        {
            try
            {
                var result = await _projectService.GetProjectByTeamAsync(teamId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("My")]
        public async Task<IActionResult> UpsertMyTeamProject([FromBody] ProjectUpsertDto request)
        {
            try
            {
                if (!long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                    return Forbid();
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                var (result, error) = await _projectService.UpsertMyTeamProjectAsync(userId, role, request.NameEn, request.NameAr, request.CompanyName, request.AdditionalInformation, request.ProjectDescription, (int)request.StatusId);
                if (error != null)
                {
                    if (error == "No team found" || error == "Not authorized") return Forbid();
                    return BadRequest(new { message = error });
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class ProjectUpsertDto
        {
            public string? NameEn { get; set; }
            public string? NameAr { get; set; }
            public string? CompanyName { get; set; }
            public string? AdditionalInformation { get; set; }
            public string? ProjectDescription { get; set; }
            public long StatusId { get; set; }
        }
    }
}
