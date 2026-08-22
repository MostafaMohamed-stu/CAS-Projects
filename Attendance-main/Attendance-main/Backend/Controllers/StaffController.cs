using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AttendanceBehaviour_Backend.Data;
using AttendanceBehaviour_Backend.DTOs;
using AttendanceBehaviour_Backend.Interfaces;

namespace AttendanceBehaviour_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StaffController : ControllerBase
    {
        private readonly IStaffRepository _repo;
        private readonly ILogger<StaffController> _logger;

        public StaffController(IStaffRepository repo, ILogger<StaffController> logger)
        {
            _repo = repo;
            _logger = logger;
        }

        [HttpPost("checkin")]
        public async Task<IActionResult> CheckInStaff([FromBody] CreateStaffAttendanceDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var createdStaff = await _repo.CreateStaffAttendanceAsync(dto);
                _logger.LogInformation("Staff check-in recorded for {EmployeeName}", dto.EmployeeName);

                return CreatedAtAction(nameof(GetStaffAttendanceById),
                    new { id = createdStaff.Id }, createdStaff);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording staff check-in for {EmployeeName}", dto.EmployeeName);
                return StatusCode(500, new { message = "An error occurred while recording check-in." });
            }
        }

        [HttpGet("attendance/{date}")]
        public async Task<IActionResult> GetStaffAttendanceByDate(DateTime date)
        {
            try
            {
                var staffAttendance = await _repo.GetStaffAttendanceByDateAsync(date);
                return Ok(staffAttendance);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving staff attendance for date {Date}", date);
                return StatusCode(500, new { message = "An error occurred while retrieving attendance." });
            }
        }

        [HttpGet("department/{department}")]
        public async Task<IActionResult> GetStaffByDepartment(string department, [FromQuery] DateTime? date = null)
        {
            try
            {
                var staffAttendance = await _repo.GetStaffAttendanceByDepartmentAsync(department, date);
                return Ok(staffAttendance);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving staff attendance for department {Department}", department);
                return StatusCode(500, new { message = "An error occurred while retrieving department attendance." });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetStaffAttendanceById(int id)
        {
            try
            {
                var staff = await _repo.GetStaffAttendanceByIdAsync(id);
                if (staff == null)
                {
                    return NotFound(new { message = "Staff attendance record not found." });
                }

                return Ok(staff);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving staff attendance for ID {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving attendance record." });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStaffAttendance(int id, [FromBody] UpdateStaffAttendanceDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Select(x => new { 
                        Key = x.Key, 
                        Errors = x.Value.Errors.Select(e => e.ErrorMessage) 
                    });
                    return BadRequest(new { 
                        message = "Validation failed", 
                        errors = errors 
                    });
                }

                var success = await _repo.UpdateStaffAttendanceAsync(id, dto);
                if (!success)
                {
                    return NotFound(new { message = "Staff attendance record not found." });
                }

                _logger.LogInformation("Staff attendance updated successfully for ID {Id}", id);
                return Ok(new { message = "Staff attendance updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating staff attendance for ID {Id}", id);
                return StatusCode(500, new { 
                    message = "An error occurred while updating attendance.",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStaffAttendance(int id)
        {
            try
            {
                var success = await _repo.DeleteStaffAttendanceAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Staff attendance record not found." });
                }

                _logger.LogInformation("Staff attendance deleted successfully for ID {Id}", id);
                return Ok(new { message = "Staff attendance deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting staff attendance for ID {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting attendance." });
            }
        }

        [HttpGet("history/{accountId}")]
        public async Task<IActionResult> GetStaffAttendanceHistory(int accountId,
            [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            try
            {
                var history = await _repo.GetStaffAttendanceHistoryAsync(accountId, fromDate, toDate);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving staff attendance history for Account ID {AccountId}", accountId);
                return StatusCode(500, new { message = "An error occurred while retrieving attendance history." });
            }
        }

        [HttpGet("daily-report")]
        public async Task<IActionResult> GetDailyStaffReport([FromQuery] DateTime? date = null)
        {
            try
            {
                var reportDate = date ?? DateTime.Today;
                var staffAttendance = await _repo.GetStaffAttendanceByDateAsync(reportDate);

                var report = new
                {
                    Date = reportDate.Date,
                    TotalStaff = staffAttendance.Count(),
                    Present = staffAttendance.Count(s => s.Status == "Present"),
                    Late = staffAttendance.Count(s => s.Status == "Late"),
                    Absent = staffAttendance.Count(s => s.Status == "Absent"),
                    AttendanceDetails = staffAttendance
                };

                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating daily staff report for date {Date}", date);
                return StatusCode(500, new { message = "An error occurred while generating the report." });
            }
        }

        // NEW: Get all staff members
        [HttpGet]
        public async Task<IActionResult> GetAllStaff()
        {
            try
            {
                // Get all distinct staff members (not just today's attendance)
                // Since we don't have direct access to _context here, we'll need to implement this in the repository
                var staffList = await _repo.GetAllStaffAsync();
                return Ok(staffList);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all staff members");
                return StatusCode(500, new { message = "An error occurred while retrieving staff members." });
            }
        }

        // NEW: Register a new staff member
        [HttpPost("register")]
        public async Task<IActionResult> RegisterStaff([FromBody] RegisterStaffDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // First, we need to ensure the user account exists
                // In a real implementation, you might want to integrate with the Auth service
                // For now, we'll assume the account already exists and we're linking it to a staff record
                
                // Create the initial staff record
                var staffDto = new CreateStaffAttendanceDto
                {
                    EmployeeName = dto.EmployeeName,
                    Department = dto.Department,
                    Status = dto.Status,
                    CheckInTime = dto.CheckInTime,
                    CheckInMethod = dto.CheckInMethod,
                    AccountId = dto.AccountId,
                    RoleId = dto.RoleId
                };

                var createdStaff = await _repo.CreateStaffAttendanceAsync(staffDto);
                _logger.LogInformation("Staff member registered: {EmployeeName}", dto.EmployeeName);

                return CreatedAtAction(nameof(GetStaffAttendanceById),
                    new { id = createdStaff.Id }, createdStaff);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering staff member: {EmployeeName}", dto.EmployeeName);
                return StatusCode(500, new { message = "An error occurred while registering staff member." });
            }
        }

        // NEW: Get all roles
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            try
            {
                var roles = await _repo.GetRolesAsync();
                return Ok(roles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving roles");
                return StatusCode(500, new { message = "An error occurred while retrieving roles." });
            }
        }

        // NEW: Get all departments
        [HttpGet("departments")]
        public async Task<IActionResult> GetDepartments()
        {
            try
            {
                var departments = await _repo.GetDepartmentsAsync();
                return Ok(departments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving departments");
                return StatusCode(500, new { message = "An error occurred while retrieving departments." });
            }
        }
    }
}
