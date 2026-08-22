using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AttendanceBehaviour_Backend.Data;

namespace AttendanceBehaviour_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SessionController : ControllerBase
    {
        private readonly ElsewedySchoolContext _context;

        public SessionController(ElsewedySchoolContext context)
        {
            _context = context;
        }

        // COMMENTED OUT: Not used - we fetch all sessions globally, not filtered by class
        // GET /api/Session/by-class/{classId}
        //[HttpGet("by-class/{classId}")]
        //public async Task<ActionResult> GetSessionsByClass(long classId)
        //{
        //    try
        //    {
        //        var sessions = await _context.SubordinateTickets
        //            .Include(st => st.Session)
        //            .Where(st => st.ClassId == classId && st.Session != null && st.StatusId == 1)
        //            .Select(st => new
        //            {
        //                id = st.Session!.Id,
        //                sessionNo = st.Session.SessionNo,
        //                name = $"Session {st.Session.SessionNo}",
        //                fromDate = st.Session.FromDate,
        //                toDate = st.Session.ToDate
        //            })
        //            .Distinct()
        //            .OrderBy(s => s.sessionNo)
        //            .ToListAsync();

        //        return Ok(sessions);
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = $"Failed to fetch sessions: {ex.Message}" });
        //    }
        //}

        // GET /api/Session
        [HttpGet]
        public async Task<ActionResult> GetAllSessions()
        {
            try
            {
                var sessions = await _context.Sessions
                    .AsNoTracking()
                    .Where(s => s.StatusId == 1)
                    .OrderBy(s => s.SessionNo)
                    .Select(s => new
                    {
                        sessionNo = s.SessionNo ?? 0,
                        displayName = $"Session {s.SessionNo}"
                    })
                    .ToListAsync();

                return Ok(sessions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error: {ex.Message}" });
            }
        }
    }
}
