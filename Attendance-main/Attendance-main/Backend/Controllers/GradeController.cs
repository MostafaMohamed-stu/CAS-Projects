using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AttendanceBehaviour_Backend.Interfaces;
using AttendanceBehaviour_Backend.Data;

namespace AttendanceBehaviour_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GradeController : ControllerBase
    {
        private readonly IGradeRepository _repo;
        private readonly ElsewedySchoolContext _context;

        public GradeController(IGradeRepository repo, ElsewedySchoolContext context)
        {
            _repo = repo;
            _context = context;
        }

        // GET /api/Grade - Get all available grades
        [HttpGet]
        public async Task<IActionResult> GetAllGrades()
        {
            try
            {
                var grades = await _context.Grades
                    .Where(g => g.StatusId == 1) // Only active grades
                    .Select(g => new
                    {
                        id = g.Id,
                        gradeName = g.GradeName
                    })
                    .OrderBy(g => g.gradeName)
                    .ToListAsync();

                return Ok(grades);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to fetch grades: {ex.Message}" });
            }
        }

        // GET /api/Grade/students-by-selection
        [HttpGet("students-by-selection")]
        public async Task<IActionResult> GetStudents([FromQuery] string grade, [FromQuery] string className, [FromQuery] int session)
        {
            var students = await _repo.GetStudentsByGradeClassSessionAsync(grade, className, session);

            return Ok(students);
        }
    }
}
