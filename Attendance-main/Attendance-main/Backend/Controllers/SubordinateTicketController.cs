using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AttendanceBehaviour_Backend.Data;
using AttendanceBehaviour_Backend.Models;
using AttendanceBehaviour_Backend.DTOs;

namespace AttendanceBehaviour_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubordinateTicketController : ControllerBase
    {
        private readonly ElsewedySchoolContext _context;

        public SubordinateTicketController(ElsewedySchoolContext context)
        {
            _context = context;
        }

        // POST /api/SubordinateTicket - Create session and class assignments for students
        [HttpPost]
        public async Task<ActionResult> CreateSubordinateTicket([FromBody] CreateSubordinateTicketDto dto)
        {
            try
            {
                // Validate the student account exists
                var studentAccount = await _context.Accounts.FindAsync(dto.StudentAccountId);
                if (studentAccount == null)
                {
                    return BadRequest(new { message = "Student account not found." });
                }

                // Validate the class exists
                var classEntity = await _context.TblClasses.Include(c => c.Grade).FirstOrDefaultAsync(c => c.Id == dto.ClassId);
                if (classEntity == null)
                {
                    return BadRequest(new { message = "Tbl_Class not found." });
                }

                // Validate the session exists
                var session = await _context.Sessions.FindAsync(dto.SessionId);
                if (session == null)
                {
                    return BadRequest(new { message = "Session not found." });
                }

                // Check if the relationship already exists
                var existingTicket = await _context.SubordinateTickets
                    .FirstOrDefaultAsync(st => 
                        st.SubordinateAccountId == dto.StudentAccountId &&
                        st.ClassId == dto.ClassId &&
                        st.SessionId == dto.SessionId &&
                        st.StatusId == 1);

                if (existingTicket != null)
                {
                    return BadRequest(new { message = "Student is already assigned to this class and session." });
                }

                // Create the SubordinateTicket
                var subordinateTicket = new SubordinateTicket
                {
                    SupervisorAccountId = dto.SupervisorAccountId ?? 3, // Default teacher supervisor
                    GradeId = classEntity.GradeId,
                    ClassId = dto.ClassId,
                    SessionId = dto.SessionId,
                    SubordinateAccountId = dto.StudentAccountId,
                    TicketTypeId = 1, // Default ticket type (usually 'Absence')
                    StatusId = 1 // Active status
                };

                _context.SubordinateTickets.Add(subordinateTicket);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Student assigned to session successfully.",
                    ticketId = subordinateTicket.Id,
                    studentId = dto.StudentAccountId,
                    classId = dto.ClassId,
                    sessionId = dto.SessionId,
                    className = classEntity.ClassName,
                    gradeName = classEntity.Grade?.GradeName
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Assignment failed: {ex.Message}" });
            }
        }

        // GET /api/SubordinateTicket/student/{studentId} - Get student's session and class assignments
        [HttpGet("student/{studentId}")]
        public async Task<ActionResult> GetStudentAssignments(long studentId)
        {
            try
            {
                var assignments = await _context.SubordinateTickets
                    .Include(st => st.Class)
                        .ThenInclude(c => c.Grade)
                    .Include(st => st.Session)
                    .Where(st => st.SubordinateAccountId == studentId && st.StatusId == 1)
                    .Select(st => new
                    {
                        id = st.Id,
                        classId = st.ClassId,
                        className = st.Class != null ? st.Class.ClassName : "Unknown",
                        gradeId = st.GradeId,
                        gradeName = st.Class != null && st.Class.Grade != null ? st.Class.Grade.GradeName : "Unknown",
                        sessionId = st.SessionId,
                        sessionNo = st.Session != null ? st.Session.SessionNo : null,
                        sessionName = st.Session != null ? $"Session {st.Session.SessionNo}" : "Unknown"
                    })
                    .ToListAsync();

                return Ok(assignments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to get assignments: {ex.Message}" });
            }
        }

        // POST /api/SubordinateTicket/assign-all-sessions - Assign student to all sessions for their class
        [HttpPost("assign-all-sessions")]
        public async Task<ActionResult> AssignStudentToAllSessions([FromBody] AssignAllSessionsDto dto)
        {
            try
            {
                // Validate the student account exists
                var studentAccount = await _context.Accounts.FindAsync(dto.StudentAccountId);
                if (studentAccount == null)
                {
                    return BadRequest(new { message = "Student account not found." });
                }

                // Validate the class exists
                var classEntity = await _context.TblClasses.Include(c => c.Grade).FirstOrDefaultAsync(c => c.Id == dto.ClassId);
                if (classEntity == null)
                {
                    return BadRequest(new { message = "Tbl_Class not found." });
                }

                // Get all active sessions
                var allSessions = await _context.Sessions.Where(s => s.StatusId == 1).ToListAsync();
                if (!allSessions.Any())
                {
                    return BadRequest(new { message = "No active sessions found." });
                }

                var createdTickets = new List<SubordinateTicket>();

                foreach (var session in allSessions)
                {
                    // Check if the relationship already exists
                    var existingTicket = await _context.SubordinateTickets
                        .FirstOrDefaultAsync(st => 
                            st.SubordinateAccountId == dto.StudentAccountId &&
                            st.ClassId == dto.ClassId &&
                            st.SessionId == session.Id &&
                            st.StatusId == 1);

                    if (existingTicket == null)
                    {
                        var subordinateTicket = new SubordinateTicket
                        {
                            SupervisorAccountId = dto.SupervisorAccountId ?? 3, // Default teacher supervisor
                            GradeId = classEntity.GradeId,
                            ClassId = dto.ClassId,
                            SessionId = session.Id,
                            SubordinateAccountId = dto.StudentAccountId,
                            TicketTypeId = 1, // Default ticket type
                            StatusId = 1 // Active status
                        };

                        _context.SubordinateTickets.Add(subordinateTicket);
                        createdTickets.Add(subordinateTicket);
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Student assigned to {createdTickets.Count} sessions successfully.",
                    studentId = dto.StudentAccountId,
                    classId = dto.ClassId,
                    className = classEntity.ClassName,
                    gradeName = classEntity.Grade?.GradeName,
                    assignedSessions = createdTickets.Count,
                    totalSessions = allSessions.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Bulk assignment failed: {ex.Message}" });
            }
        }

        // DELETE /api/SubordinateTicket/{id} - Remove a session assignment
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteSubordinateTicket(long id)
        {
            try
            {
                var ticket = await _context.SubordinateTickets.FindAsync(id);
                if (ticket == null)
                {
                    return NotFound(new { message = "Assignment not found." });
                }

                _context.SubordinateTickets.Remove(ticket);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Assignment removed successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Deletion failed: {ex.Message}" });
            }
        }
    }
}
