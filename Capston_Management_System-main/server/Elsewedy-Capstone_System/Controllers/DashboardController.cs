using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Elsewedy_Capstone_System.Services.Interfaces;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("Student/{studentId}")]
        public async Task<IActionResult> GetStudentDashboard(long studentId)
        {
            try
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var currentUserId);
                var result = await _dashboardService.GetStudentDashboardAsync(studentId, role, currentUserId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("Board/Statistics")]
        [Authorize(Roles = "Board,SuperAdmin,StaffAdmin,CapstoneLead")]
        public async Task<IActionResult> GetBoardStatistics()
        {
            try
            {
                var result = await _dashboardService.GetBoardStatisticsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("Board/EngineersByClass")]
        [Authorize(Roles = "Board,SuperAdmin,StaffAdmin,CapstoneLead")]
        public async Task<IActionResult> GetEngineersByClass()
        {
            try
            {
                var result = await _dashboardService.GetEngineersByClassAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("Board/TeamsProgress")]
        [Authorize(Roles = "Board,SuperAdmin,StaffAdmin,CapstoneLead")]
        public async Task<IActionResult> GetTeamsProgress()
        {
            try
            {
                var result = await _dashboardService.GetTeamsProgressAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("Board/TaskCompletionByStatus")]
        [Authorize(Roles = "Board,SuperAdmin,StaffAdmin,CapstoneLead")]
        public async Task<IActionResult> GetTaskCompletionByStatus()
        {
            try
            {
                var result = await _dashboardService.GetTaskCompletionByStatusAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("Board/TeamsByGrade")]
        [Authorize(Roles = "Board,SuperAdmin,StaffAdmin,CapstoneLead")]
        public async Task<IActionResult> GetTeamsByGrade()
        {
            try
            {
                var result = await _dashboardService.GetTeamsByGradeAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("Board/TeamsCompletedAllTasks")]
        [Authorize(Roles = "Board,SuperAdmin,StaffAdmin,CapstoneLead")]
        public async Task<IActionResult> GetTeamsCompletedAllTasks()
        {
            try
            {
                var result = await _dashboardService.GetTeamsCompletedAllTasksAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
