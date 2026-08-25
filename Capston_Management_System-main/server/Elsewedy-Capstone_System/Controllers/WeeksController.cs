using Microsoft.AspNetCore.Mvc;
using Elsewedy_Capstone_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WeeksController : ControllerBase
    {
        private readonly IWeekService _weekService;

        public WeeksController(IWeekService weekService)
        {
            _weekService = weekService;
        }

        [HttpGet]
        public async Task<IActionResult> GetWeeks([FromQuery] string? businessEntityName)
        {
            try
            {
                var result = await _weekService.GetWeeksAsync(businessEntityName);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
