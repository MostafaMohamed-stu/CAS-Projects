using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using AttendanceBehaviour_Backend.DTOs;
using AttendanceBehaviour_Backend.Interfaces;
using AttendanceBehaviour_Backend.Models;


namespace AttendanceBehaviour_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AttendanceController : ControllerBase
    {
        private readonly IAttendanceRepository _repo;
        private readonly ILogger<AttendanceController> _logger;

        public AttendanceController(IAttendanceRepository repo, ILogger<AttendanceController> logger)
        {
            _repo = repo;
            _logger = logger;
        }

        [HttpPost("save")]
        public async Task<IActionResult> SaveAttendance([FromBody] SaveAttendanceDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { 
                        message = "Invalid request data.", 
                        errors = ModelState.Select(x => new { 
                            field = x.Key, 
                            errors = x.Value.Errors.Select(e => e.ErrorMessage) 
                        }) 
                    });
                }

                // Log the incoming data for debugging
                _logger.LogInformation("Saving attendance for StudentId: {StudentId}, ClassId: {ClassId}, Date: {Date}, Session: {SessionNumber}, IsPresent: {IsPresent}", 
                    dto.StudentId, dto.ClassId, dto.Date, dto.SessionNumber, dto.IsPresent);

                var attendanceRecord = await _repo.SaveAttendanceAsync(dto);
                
                if (attendanceRecord == null)
                {
                    _logger.LogWarning("Attendance save returned null for {StudentId}", dto.StudentId);
                    return StatusCode(500, new { 
                        message = "Failed to save attendance record.",
                        error = "Save operation returned null"
                    });
                }

                _logger.LogInformation("Attendance saved successfully for {StudentId} with ID {AttendanceId}", 
                    dto.StudentId, attendanceRecord.Id);

                return Ok(new { 
                    message = "Attendance saved successfully.",
                    attendanceId = attendanceRecord.Id,
                    studentId = attendanceRecord.StudentId,
                    classId = attendanceRecord.ClassId,
                    date = attendanceRecord.Date,
                    sessionNumber = attendanceRecord.SessionNumber,
                    isPresent = attendanceRecord.IsPresent
                });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Validation error saving attendance for {StudentId}", dto?.StudentId);
                return BadRequest(new { 
                    message = "Validation error occurred while saving attendance.",
                    error = ex.Message 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving attendance for {StudentId}", dto?.StudentId);
                return StatusCode(500, new { 
                    message = "An error occurred while saving attendance.",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpPost("add-note")]
        public async Task<IActionResult> AddNote([FromBody] NoteInputModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { 
                        message = "Invalid request data.", 
                        errors = ModelState.Select(x => new { 
                            field = x.Key, 
                            errors = x.Value.Errors.Select(e => e.ErrorMessage) 
                        }) 
                    });
                }

                await _repo.AddNoteAsync(model);
                _logger.LogInformation("Note added successfully for {StudentId}", model.StudentId);

                return Ok(new { message = "Note added successfully." });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Validation error adding note for {StudentId}", model?.StudentId);
                return BadRequest(new { 
                    message = "Validation error occurred while adding the note.",
                    error = ex.Message 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding note for {StudentId}", model?.StudentId);
                return StatusCode(500, new { 
                    message = "An error occurred while adding the note.",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpGet("{studentId}/history")]
        public async Task<IActionResult> GetAttendanceHistory(int studentId, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            try
            {
                var history = await _repo.GetAttendanceHistoryAsync(studentId, fromDate, toDate);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving attendance history for student {StudentId}", studentId);
                return StatusCode(500, new { 
                    message = "An error occurred while retrieving attendance history.",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpGet("daily-report")]
        public async Task<IActionResult> GetDailyAttendanceReport([FromQuery] DateTime date)
        {
            try
            {
                var report = await _repo.GetDailyAttendanceReportAsync(date.Date); // Use only the date part
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating daily attendance report for {Date}", date);
                return StatusCode(500, new { 
                    message = "An error occurred while generating the report.",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpPut("{attendanceId}")]
        public async Task<IActionResult> UpdateAttendance(int attendanceId, [FromBody] UpdateAttendanceDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { 
                        message = "Invalid request data.", 
                        errors = ModelState.Select(x => new { 
                            field = x.Key, 
                            errors = x.Value.Errors.Select(e => e.ErrorMessage) 
                        }) 
                    });
                }

                var success = await _repo.UpdateAttendanceAsync(attendanceId, dto);
                if (!success)
                {
                    return NotFound(new { message = "Attendance record not found." });
                }

                _logger.LogInformation("Attendance updated successfully for ID {AttendanceId}", attendanceId);
                return Ok(new { message = "Attendance updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating attendance for ID {AttendanceId}", attendanceId);
                return StatusCode(500, new { 
                    message = "An error occurred while updating attendance.",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpGet("by-class-session")]
        public async Task<IActionResult> GetAttendanceByClassSession([FromQuery] long classId, [FromQuery] int sessionNumber, [FromQuery] DateTime date)
        {
            try
            {
                var attendance = await _repo.GetAttendanceByClassSessionDateAsync(classId, sessionNumber, date.Date); // Use only the date part
                return Ok(attendance);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving attendance for class {ClassId}, session {SessionNumber}, date {Date}", classId, sessionNumber, date);
                return StatusCode(500, new { 
                    message = "An error occurred while retrieving attendance data.",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpGet("notes/{studentId}")]
        public async Task<IActionResult> GetStudentNotes(long studentId, [FromQuery] DateTime date)
        {
            try
            {
                var notes = await _repo.GetBehaviorNotesByStudentDateAsync(studentId, date.Date); // Use only the date part
                return Ok(notes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notes for student {StudentId}, date {Date}", studentId, date);
                return StatusCode(500, new { 
                    message = "An error occurred while retrieving notes.",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        // Add this endpoint to get all absent records
        [HttpGet("absent-records")]
        public async Task<IActionResult> GetAllAbsentRecords()
        {
            try
            {
                var absentRecords = await _repo.GetAllAbsentRecordsAsync();
                return Ok(absentRecords);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving absent records");
                return StatusCode(500, new { 
                    message = "An error occurred while retrieving absent records.",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        // Add this endpoint to get attendance trends
        [HttpGet("trends")]
        public async Task<IActionResult> GetAttendanceTrends([FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
        {
            try
            {
                var trends = await _repo.GetAttendanceTrendsAsync(fromDate.Date, toDate.Date); // Use only the date parts
                return Ok(trends);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving attendance trends from {FromDate} to {ToDate}", fromDate, toDate);
                return StatusCode(500, new { 
                    message = "An error occurred while retrieving attendance trends.",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        // Add this endpoint to get class performance data
        [HttpGet("class-performance")]
        public async Task<IActionResult> GetClassPerformance()
        {
            try
            {
                var performance = await _repo.GetClassPerformanceAsync();
                return Ok(performance);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving class performance data");
                return StatusCode(500, new { 
                    message = "An error occurred while retrieving class performance data.",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        // Add this endpoint to get at-risk students
        [HttpGet("at-risk-students")]
        public async Task<IActionResult> GetAtRiskStudents()
        {
            try
            {
                var students = await _repo.GetAtRiskStudentsAsync();
                return Ok(students);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving at-risk students");
                return StatusCode(500, new { 
                    message = "An error occurred while retrieving at-risk students.",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpGet("verify/{studentId}/{classId}/{date}/{sessionNumber}")]
        public async Task<IActionResult> VerifyAttendance(long studentId, long classId, DateTime date, int sessionNumber)
        {
            try
            {
                _logger.LogInformation("Verifying attendance for StudentId: {StudentId}, ClassId: {ClassId}, Date: {Date}, Session: {SessionNumber}", 
                    studentId, classId, date, sessionNumber);

                var attendanceRecord = await _repo.GetAttendanceByClassSessionDateAsync(classId, sessionNumber, date);
                
                if (attendanceRecord == null)
                {
                    return NotFound(new { message = "No attendance record found for the specified criteria." });
                }

                var records = attendanceRecord.ToList();
                var studentRecord = records.FirstOrDefault(r => {
                    var record = r as dynamic;
                    return record.StudentId == studentId;
                });

                if (studentRecord == null)
                {
                    return NotFound(new { message = "No attendance record found for the specified student." });
                }

                return Ok(new { 
                    message = "Attendance record found.",
                    record = studentRecord
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying attendance for StudentId: {StudentId}, ClassId: {ClassId}, Date: {Date}, Session: {SessionNumber}", 
                    studentId, classId, date, sessionNumber);
                return StatusCode(500, new { 
                    message = "An error occurred while verifying attendance.",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }
    }
}
