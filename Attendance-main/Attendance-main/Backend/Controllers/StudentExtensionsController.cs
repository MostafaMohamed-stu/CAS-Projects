using AttendanceBehaviour_Backend.Data;
using AttendanceBehaviour_Backend.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AttendanceBehaviour_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StudentExtensionController  : ControllerBase
    {
        private readonly ElsewedySchoolContext _context;
        private readonly ILogger<StudentExtensionController> _logger;

        public StudentExtensionController(ElsewedySchoolContext context, ILogger<StudentExtensionController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("FetchStudentsForAbsence")]
        public async Task<IActionResult> FetchStudentsForAbsenceAsync([FromQuery] long classId, [FromQuery] long gradeId)
        {
            _logger.LogInformation("Fetching students for ClassId: {ClassId}, GradeId: {GradeId}", classId, gradeId);

            var result = await _context.StudentExtensions
                .Include(x => x.Account)
                .Include(x => x.TblClass)
                .ThenInclude(c => c.Grade)
                .Where(x => x.TblClassId == classId 
                            && x.TblClass != null 
                            && x.TblClass.Grade != null 
                            && x.TblClass.GradeId == gradeId 
                            && x.Account != null)
                .Select(x => new StudentExtensionDto
                {
                    StudentId = x.Account!.Id,
                    StudentName = x.Account.FullNameEn ?? string.Empty,
                    StudentNameAr = x.Account.FullNameAr ?? string.Empty
                })
                .ToListAsync();

            _logger.LogInformation("Found {Count} students.", result.Count);

            return Ok(result);
        }
    }
}