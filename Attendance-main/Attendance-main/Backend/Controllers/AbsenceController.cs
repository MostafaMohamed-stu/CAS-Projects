using Microsoft.AspNetCore.Mvc;
using AttendanceBehaviour_Backend.DTOs;
using AttendanceBehaviour_Backend.Interfaces;

namespace AttendanceBehaviour_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AbsenceController : ControllerBase
    {
        private readonly IAbsenceRepository _repo;
        public AbsenceController(IAbsenceRepository repo)
        {
            _repo = repo;
        }

        [HttpGet("GetAllAbsenceRecords")]
        public async Task<IActionResult> GetAll()
        {
            var absences = await _repo.GetAllAsync();
            return Ok(absences);
        }

        [HttpGet("GetAbsenceRecordById/{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var absence = await _repo.GetByIdAsync(id);
            if (absence == null) return NotFound();
            return Ok(absence);
        }

        [HttpPost("AddAbsenceRecord")]
        public async Task<IActionResult> Add([FromBody] CreateAbsenceRecordDto dto)
        {
            await _repo.AddAsync(dto);
            return Ok(new { message = "Absence record added." });
        }

        [HttpDelete("DeleteAbsenceRecord/{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            await _repo.DeleteAsync(id);
            return Ok(new { message = "Absence record deleted." });
        }

        [HttpPut("UpdateAbsenceType/{id}")]
        public async Task<IActionResult> UpdateAbsenceType(int id, [FromBody] UpdateAbsenceTypeDto dto)
        {
            await _repo.UpdateAbsenceTypeAsync(id, dto.AbsenceTypeId);
            return Ok(new { message = "Absence type updated." });
        }

        [HttpGet("GetFilteredAbsences")]
        public async Task<IActionResult> GetFiltered(
            [FromQuery] string? gradeName,
            [FromQuery] string? className,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            var absences = await _repo.GetFilteredAbsencesAsync(gradeName, className, fromDate, toDate);
            return Ok(absences);
        }

        [HttpGet("GetLowAttendanceStudents")]
        public async Task<IActionResult> GetLowAttendanceStudents([FromQuery] int minAbsences = 5, [FromQuery] int maxAbsences = 100)
        {
            var students = await _repo.GetLowAttendanceStudentsAsync(minAbsences, maxAbsences);
            return Ok(students);
        }

        [HttpGet("GetAttendanceStatistics")]
        public async Task<IActionResult> GetStatistics(
            [FromQuery] string? gradeName,
            [FromQuery] string? className,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            var statistics = await _repo.GetAttendanceStatisticsAsync(gradeName, className, fromDate, toDate);
            return Ok(statistics);
        }
    }
}
