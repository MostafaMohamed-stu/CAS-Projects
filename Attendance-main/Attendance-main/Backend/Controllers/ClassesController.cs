using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AttendanceBehaviour_Backend.Data;

namespace AttendanceBehaviour_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClassesController : ControllerBase
    {
        private readonly ElsewedySchoolContext _context;

        public ClassesController(ElsewedySchoolContext context)
        {
            _context = context;
        }

        // GET /api/Classes
        [HttpGet]
        public async Task<IActionResult> GetAllClasses()
        {
            try
            {
                var classes = await _context.TblClasses
                    .Include(c => c.Grade).Include(s=>s.Status)
                    .Where(c => c.StatusId == 1) // Only active classes
                    .Select(c => new
                    {
                        id = c.Id,
                        name = c.ClassName,
                        gradeId = c.GradeId,
                    })
                    .OrderBy(c => c.gradeId)
                    .ThenBy(c => c.name)
                    .ToListAsync();

                return Ok(classes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to fetch classes: {ex.Message}" });
            }
        }

        // GET /api/Classes/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult> GetClassById(long id)
        {
            try
            {
                var classEntity = await _context.TblClasses
                    .Include(c => c.Grade)
                    .Where(c => c.Id == id && c.StatusId == 1)
                    .Select(c => new
                    {
                        id = c.Id,
                        name = c.ClassName,
                        className = c.ClassName,
                        gradeId = c.GradeId,
                        gradeName = c.Grade.GradeName
                    })
                    .FirstOrDefaultAsync();

                if (classEntity == null)
                {
                    return NotFound(new { message = "Tbl_Class not found." });
                }

                return Ok(classEntity);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to fetch class: {ex.Message}" });
            }
        }

        // GET /api/Classes/by-grade - Get classes for a specific grade name
        [HttpGet("by-grade")]
        public async Task<ActionResult> GetClassesByGradeName([FromQuery] string gradeName)
        {
            try
            {
                if (string.IsNullOrEmpty(gradeName))
                {
                    return BadRequest(new { message = "Grade name is required." });
                }

                var classes = await _context.TblClasses
                    .Include(c => c.Grade)
                    .Where(c => c.Grade.GradeName == gradeName && c.StatusId == 1)
                    .Select(c => new
                    {
                        id = c.Id,
                        className = c.ClassName,
                        gradeId = c.GradeId,
                        gradeName = c.Grade.GradeName
                    })
                    .OrderBy(c => c.className)
                    .ToListAsync();

                return Ok(classes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to fetch classes: {ex.Message}" });
            }
        }

        // GET /api/Classes/by-grade/{gradeId} - Get classes for a specific grade ID
        [HttpGet("by-grade/{gradeId}")]
        public async Task<ActionResult> GetClassesByGradeId(long gradeId)
        {
            try
            {
                var classes = await _context.TblClasses
                    .Where(c => c.GradeId == gradeId && c.StatusId == 1)
                    .Select(c => new
                    {
                        id = c.Id,
                        className = c.ClassName
                    })
                    .OrderBy(c => c.className)
                    .ToListAsync();

                return Ok(classes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to fetch classes: {ex.Message}" });
            }
        }
    }
}
