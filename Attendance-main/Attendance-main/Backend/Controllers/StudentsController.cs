// Controllers/StudentsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AttendanceBehaviour_Backend.Data;
using AttendanceBehaviour_Backend.Models;

[Route("api/[controller]")]
[ApiController]
public class StudentsController : ControllerBase
{
    private readonly ElsewedySchoolContext _context;

    public StudentsController(ElsewedySchoolContext context)
    {
        _context = context;
    }

    // GET: api/students/{classId}
    [HttpGet("{classId}")]
    public async Task<ActionResult<IEnumerable<StudentExtension>>> GetStudentsByClass(int classId)
    {
        var students = await _context.StudentExtensions
                                     .Where(s => s.TblClassId.HasValue && s.TblClassId.Value == classId)
                                     .ToListAsync();

        if (students == null || !students.Any())
        {
            return NotFound("No students found for this class.");
        }

        return Ok(students);
    }

    // GET: api/students/by-class-name
    [HttpGet("by-class-name")]
    public async Task<ActionResult> GetStudentsByClassName([FromQuery] string gradeName, [FromQuery] string className)
    {
        var students = await _context.StudentExtensions
            .Include(s => s.Account)
            .Include(s => s.TblClass)
                .ThenInclude(c => c.Grade)
            .Where(s => s.TblClass.Grade.GradeName == gradeName && s.TblClass.ClassName == className && s.StatusId == 1)
            .Select(s => new
            {
                id = s.AccountId,
                name = s.Account.FullNameEn,
                nameAr = s.Account.FullNameAr
            })
            .ToListAsync();

        return Ok(students);
    }

    // GET: api/students/all
    [HttpGet("all")]
    public async Task<ActionResult> GetAllStudents()
    {
        var students = await _context.StudentExtensions
            .Include(s => s.Account)
            .Where(s => s.StatusId == 1)
            .Select(s => new
            {
                id = s.AccountId,
                name = s.Account.FullNameEn,
                nameAr = s.Account.FullNameAr
            })
            .OrderBy(s => s.name)
            .ToListAsync();

        return Ok(students);
    }
}
