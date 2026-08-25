using Microsoft.AspNetCore.Mvc;
using Elsewedy_Capstone_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GradesController : ControllerBase
    {
        private readonly IGradeService _gradeService;

        public GradesController(IGradeService gradeService)
        {
            _gradeService = gradeService;
        }

        [HttpGet]
        public async Task<IActionResult> GetGrades()
        {
            try
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);
                var result = await _gradeService.GetGradesAsync(role, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
