using Microsoft.AspNetCore.Mvc;
using Elsewedy_Capstone_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ClassController : ControllerBase
    {
        private readonly IClassService _classService;

        public ClassController(IClassService classService)
        {
            _classService = classService;
        }

        [HttpGet]
        public async Task<IActionResult> GetClasses()
        {
            try
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var result = await _classService.GetClassesAsync(role, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("ByGrade/{gradeId}")]
        public async Task<IActionResult> GetClassesByGrade(long gradeId)
        {
            try
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var result = await _classService.GetClassesByGradeAsync(gradeId, role, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetClassById(long id)
        {
            try
            {
                var result = await _classService.GetClassByIdAsync(id);
                if (result == null) return NotFound(new { message = "Class not found" });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("ByEngineer/{engineerId}")]
        public async Task<IActionResult> GetClassesByEngineer(long engineerId)
        {
            try
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var result = await _classService.GetClassesByEngineerAsync(engineerId, role, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
