using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Elsewedy_Capstone_System.Services.Interfaces;
using Elsewedy_Capstone_System.Models;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api")]
    [Authorize]
    public class TeamController : ControllerBase
    {
        private readonly ITeamService _teamService;

        public TeamController(ITeamService teamService)
        {
            _teamService = teamService;
        }

        [HttpGet("Teams")]
        public async Task<IActionResult> GetTeams()
        {
            try
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var result = await _teamService.GetTeamsAsync(role, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("Teams/{id}")]
        public async Task<IActionResult> GetTeam(long id)
        {
            try
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var result = await _teamService.GetTeamAsync(id, role, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("Teams/ByLeader/{leaderAccountId}")]
        public async Task<IActionResult> GetTeamByLeader(long leaderAccountId)
        {
            try
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var currentUserId);
                var result = await _teamService.GetTeamByLeaderAsync(leaderAccountId, role, currentUserId);
                if (result == null) return Forbid();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("TeamMembers")]
        public async Task<IActionResult> GetTeamMembers()
        {
            try
            {
                var result = await _teamService.GetTeamMembersAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("TeamMembers")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> CreateTeamMember([FromBody] CreateTeamMemberDto request)
        {
            try
            {
                var (member, error) = await _teamService.CreateTeamMemberAsync(request.TeamId, request.TeamMemberAccountId, request.TeamMemberDescription, request.StatusId);
                if (error != null) return BadRequest(new { message = error });
                return CreatedAtAction(nameof(GetTeamMembers), new { id = member!.Id }, member);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("TeamMembers/{id}")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> DeleteTeamMember(long id)
        {
            try
            {
                var (success, error) = await _teamService.DeleteTeamMemberAsync(id);
                if (!success) return NotFound(error);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("Teams/{teamId}/AssignLeader")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> AssignTeamLeader(long teamId, [FromBody] AssignTeamLeaderRequest request)
        {
            try
            {
                var (success, error) = await _teamService.AssignTeamLeaderAsync(teamId, request.TeamLeaderId);
                if (!success)
                {
                    if (error == "Team not found" || error == "Leader account not found" || error == "Not a team member") return BadRequest(new { message = error });
                }
                return Ok(new { message = "Team leader assigned successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("Teams/WithDetails")]
        public async Task<IActionResult> GetTeamsWithDetails()
        {
            try
            {
                var result = await _teamService.GetTeamsWithDetailsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("Teams/ByEngineer/{engineerAccountId}")]
        public async Task<IActionResult> GetTeamsByEngineer(long engineerAccountId)
        {
            try
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var currentUserId);
                var result = await _teamService.GetTeamsByEngineerAsync(engineerAccountId, role, currentUserId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("Teams/Create")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> CreateTeam([FromBody] CreateTeamRequest request)
        {
            try
            {
                var (team, error) = await _teamService.CreateTeamAsync(request.teamName, request.classId);
                if (error != null) return BadRequest(new { message = error });
                return Ok(new { id = team!.Id, teamName = team.TeamName, classId = team.ClassId, message = "Team created successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("Teams/{id}")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> UpdateTeam(long id, [FromBody] UpdateTeamRequest request)
        {
            try
            {
                var (success, error) = await _teamService.UpdateTeamAsync(id, request.TeamName, request.ClassId, request.SupervisorAccountId, request.TeamLeaderAccountId);
                if (!success) return NotFound(error);
                return Ok(new { message = "Team updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("Teams/{id}")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> DeleteTeam(long id)
        {
            try
            {
                var (success, error) = await _teamService.DeleteTeamAsync(id);
                if (!success) return NotFound(error);
                return Ok(new { message = "Team deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("Teams/Assignments")]
        public async Task<IActionResult> GetEngineerAssignments()
        {
            try
            {
                var result = await _teamService.GetEngineerAssignmentsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class CreateTeamRequest { public string teamName { get; set; } = string.Empty; public long classId { get; set; } }
        public class UpdateTeamRequest { public string TeamName { get; set; } = string.Empty; public long ClassId { get; set; } public long? SupervisorAccountId { get; set; } public long? TeamLeaderAccountId { get; set; } }
        public class CreateTeamMemberDto { public long TeamId { get; set; } public long TeamMemberAccountId { get; set; } public string? TeamMemberDescription { get; set; } public int StatusId { get; set; } = 1; }
        public class AssignTeamLeaderRequest { public long TeamLeaderId { get; set; } }
    }
}
