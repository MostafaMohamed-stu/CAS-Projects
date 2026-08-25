using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using Elsewedy_Capstone_System.Services.Interfaces;
using Elsewedy_Capstone_System.Models;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TaskSubmissionsController : ControllerBase
    {
        private readonly ITaskSubmissionService _taskSubmissionService;

        public TaskSubmissionsController(ITaskSubmissionService taskSubmissionService)
        {
            _taskSubmissionService = taskSubmissionService;
        }

        [HttpGet]
        public async Task<IActionResult> GetTaskSubmissions()
        {
            try
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var result = await _taskSubmissionService.GetTaskSubmissionsAsync(role, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTaskSubmission(int id)
        {
            try
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var result = await _taskSubmissionService.GetTaskSubmissionAsync(id, role, userId);
                if (result == null) return NotFound();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        [EnableRateLimiting("submissions")]
        public async Task<IActionResult> PostTaskSubmission([FromBody] TaskSubmissionDto request)
        {
            try
            {
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                var (submission, result, error) = await _taskSubmissionService.CreateSubmissionAsync(request.TeamId, userId, role, request.TaskId, request.Glink, request.Note);
                if (error != null)
                {
                    if (error == "Forbidden") return Forbid();
                    return BadRequest(new { message = error });
                }
                return CreatedAtAction(nameof(GetTaskSubmission), new { id = submission!.TaskSubmissionId }, result);
            }
            catch (Exception ex)
            {
                var detail = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, new { error = detail });
            }
        }

        [HttpPost("{id}/review")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> MarkReviewed(int id, [FromBody] ReviewRequest? request)
        {
            try
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var (success, result, error) = await _taskSubmissionService.MarkReviewedAsync(id, request?.Feedback, role, userId);
                if (!success) return NotFound(error);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("{id}/reject")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> RejectTask(int id)
        {
            try
            {
                var (success, error) = await _taskSubmissionService.RejectTaskAsync(id);
                if (!success) return NotFound(error);
                return Ok(new { message = "Task rejected", submissionId = id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("{id}/feedback")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> AddFeedback(int id, [FromBody] FeedbackRequest? request)
        {
            try
            {
                var (success, error) = await _taskSubmissionService.AddFeedbackAsync(id, request?.Feedback);
                if (!success) return NotFound(error);
                return Ok(new { message = "Feedback added successfully", submissionId = id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [EnableRateLimiting("submissions")]
        public async Task<IActionResult> PutTaskSubmission(int id, [FromBody] TaskSubmissionUpdateDto request)
        {
            try
            {
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                var (success, error) = await _taskSubmissionService.UpdateSubmissionAsync(id, request.TeamId, userId, role, request.Glink, request.Note, request.StatusId);
                if (!success)
                {
                    if (error == "Not found") return NotFound();
                    if (error == "Forbidden") return Forbid();
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [EnableRateLimiting("submissions")]
        public async Task<IActionResult> DeleteTaskSubmission(int id)
        {
            try
            {
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                var (success, error) = await _taskSubmissionService.DeleteSubmissionAsync(id, userId, role);
                if (!success)
                {
                    if (error == "Not found") return NotFound();
                    if (error == "Forbidden") return Forbid();
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class ReviewRequest { public string? Feedback { get; set; } }
        public class FeedbackRequest { public string? Feedback { get; set; } }
        public class TaskSubmissionDto
        {
            public long TeamId { get; set; }
            public long TaskId { get; set; }
            public string? Glink { get; set; }
            public string? Note { get; set; }
        }
        public class TaskSubmissionUpdateDto
        {
            public long TeamId { get; set; }
            public string? Glink { get; set; }
            public string? Note { get; set; }
            public int StatusId { get; set; }
        }
    }
}
