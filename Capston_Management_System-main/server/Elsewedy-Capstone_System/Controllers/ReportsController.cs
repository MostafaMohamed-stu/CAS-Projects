using Microsoft.AspNetCore.Mvc;
using Elsewedy_Capstone_System.Services.Interfaces;
using Elsewedy_Capstone_System.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet]
        public async Task<IActionResult> GetReports()
        {
            try
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var result = await _reportService.GetReportsAsync(role, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetReport(long id)
        {
            try
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var result = await _reportService.GetReportAsync(id, role, userId);
                
                if (result is ValueType || result.GetType().GetProperty("error") != null)
                {
                    var error = result.GetType().GetProperty("error")?.GetValue(result) as string;
                    if (error == "Report not found") return NotFound(error);
                    if (error == "Forbidden") return Forbid();
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("ByUser/{submitterAccountId}")]
        public async Task<IActionResult> GetReportsByUser(long submitterAccountId)
        {
            try
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var result = await _reportService.GetReportsByUserAsync(submitterAccountId, role, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] Report report)
        {
            try
            {
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var (result, error) = await _reportService.CreateReportAsync(
                    report.Title ?? string.Empty,
                    report.ReportMessage ?? string.Empty,
                    userId,
                    (int)report.StatusId);

                if (error != null)
                    return BadRequest(new { message = error });

                return CreatedAtAction(nameof(GetReport), new { id = ((Report)result!).Id }, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateReport(long id, [FromBody] Report reportUpdate)
        {
            try
            {
                if (id != reportUpdate.Id)
                    return BadRequest("ID mismatch");

                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

                var (success, error) = await _reportService.UpdateReportAsync(
                    id,
                    reportUpdate.Title,
                    reportUpdate.ReportMessage,
                    (int)reportUpdate.StatusId,
                    userId,
                    role);

                if (!success)
                {
                    if (error == "Report not found") return NotFound(error);
                    if (error == "Forbidden") return Forbid();
                    return BadRequest(new { message = error });
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReport(long id)
        {
            try
            {
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

                var (success, error) = await _reportService.DeleteReportAsync(id, userId, role);

                if (!success)
                {
                    if (error == "Report not found") return NotFound(error);
                    if (error == "Forbidden") return Forbid();
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
