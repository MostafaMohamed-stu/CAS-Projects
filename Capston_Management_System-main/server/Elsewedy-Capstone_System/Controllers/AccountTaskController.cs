using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Elsewedy_Capstone_System.Services.Interfaces;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AccountTaskController : ControllerBase
    {
        private readonly IAccountTaskService _accountTaskService;

        public AccountTaskController(IAccountTaskService accountTaskService)
        {
            _accountTaskService = accountTaskService;
        }

        [HttpGet("StudentTasks/{studentId}")]
        public async Task<IActionResult> GetStudentTasks(long studentId)
        {
            try
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var currentUserId);
                var result = await _accountTaskService.GetStudentTasksAsync(studentId, role, currentUserId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("ByGrade/{gradeId}")]
        public async Task<IActionResult> GetTasksByGrade(long gradeId)
        {
            try
            {
                var result = await _accountTaskService.GetTasksByGradeAsync(gradeId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAllTasks()
        {
            try
            {
                var result = await _accountTaskService.GetAllTasksAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto request)
        {
            try
            {
                var (task, error) = await _accountTaskService.CreateTaskAsync(
                    request.TaskName, request.TaskDescription, request.TaskDeadline,
                    request.GradeId, request.ClassId, request.TeamId, request.AdminAccountId, request.WeekId, request.AssignedToId);
                if (error != null) return BadRequest(new { message = error });
                return CreatedAtAction(nameof(GetAllTasks), new { id = task!.Id }, task);
            }
            catch (Exception ex)
            {
                var innerMsg = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, new { error = innerMsg });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> UpdateTask(long id, [FromBody] UpdateTaskDto request)
        {
            try
            {
                var (task, error) = await _accountTaskService.UpdateTaskAsync(
                    id, request.TaskName, request.TaskDescription, request.TaskDeadline,
                    request.GradeId, request.ClassId, request.TeamId, request.AdminAccountId, request.WeekId, request.StatusId, request.AssignedToId);
                if (error != null)
                {
                    if (error == "Task not found") return NotFound(error);
                    return BadRequest(new { message = error });
                }
                return Ok(task);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> DeleteTask(long id)
        {
            try
            {
                var (success, error) = await _accountTaskService.DeleteTaskAsync(id);
                if (!success) return NotFound(error);
                return Ok(new { message = $"Task deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class CreateTaskDto
        {
            public string TaskName { get; set; } = string.Empty;
            public string? TaskDescription { get; set; }
            public DateTime TaskDeadline { get; set; }
            public long? GradeId { get; set; }
            public long? ClassId { get; set; }
            public long? TeamId { get; set; }
            public long AdminAccountId { get; set; }
            public int WeekId { get; set; }
            public long? AssignedToId { get; set; }
        }

        public class UpdateTaskDto
        {
            public string TaskName { get; set; } = string.Empty;
            public string? TaskDescription { get; set; }
            public DateTime TaskDeadline { get; set; }
            public long? GradeId { get; set; }
            public long? ClassId { get; set; }
            public long? TeamId { get; set; }
            public long AdminAccountId { get; set; }
            public int WeekId { get; set; }
            public int? StatusId { get; set; }
            public long? AssignedToId { get; set; }
        }
    }
}
