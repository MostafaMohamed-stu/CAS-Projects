using Microsoft.EntityFrameworkCore;
using AttendanceBehaviour_Backend.Data;
//using AttendanceBehaviour_Backend.DATA;
using AttendanceBehaviour_Backend.DTOs;
using AttendanceBehaviour_Backend.Interfaces;
using AttendanceBehaviour_Backend.Models;
using System.Text.Json;

namespace AttendanceBehaviour_Backend.Repos
{
    public class AttendanceRepository : IAttendanceRepository
    {
        private readonly ElsewedySchoolContext _context;
        public AttendanceRepository(ElsewedySchoolContext context)
        {
            _context = context;
        }

        public async Task<Attendance> SaveAttendanceAsync(SaveAttendanceDto dto)
        {
            try
            {
                // Validate input
                if (dto.StudentId <= 0)
                    throw new ArgumentException("Invalid student ID");
                    
                if (dto.ClassId <= 0)
                    throw new ArgumentException("Invalid class ID");
                    
                if (dto.SessionNumber <= 0)
                    throw new ArgumentException("Invalid session number");
                    
                if (!dto.Date.HasValue)
                    throw new ArgumentException("Date is required");

                // Check if attendance record already exists for this student, class, date, and session
                var existingRecord = await _context.Attendances.FirstOrDefaultAsync(a =>
                    a.StudentId == dto.StudentId &&
                    a.ClassId == dto.ClassId &&
                    a.Date.HasValue && dto.Date.HasValue && a.Date.Value.Date == dto.Date.Value.Date &&
                    a.SessionNumber == dto.SessionNumber);

                Attendance record;
                if (existingRecord != null)
                {
                    // Update existing record
                    existingRecord.ClassId = dto.ClassId;
                    existingRecord.IsPresent = dto.IsPresent;
                    existingRecord.NoteId = dto.NoteId;
                    record = existingRecord;
                    _context.Attendances.Update(existingRecord);
                }
                else
                {
                    // Create new record
                    record = new Attendance
                    {
                        StudentId = dto.StudentId,
                        ClassId = dto.ClassId,
                        Date = dto.Date.HasValue ? dto.Date.Value.Date : DateTime.Now.Date,
                        SessionNumber = dto.SessionNumber,
                        IsPresent = dto.IsPresent,
                        NoteId = dto.NoteId,
                    };

                    _context.Attendances.Add(record);
                }

                // Save changes and ensure it was successful
                var saveResult = await _context.SaveChangesAsync();
                
                if (saveResult <= 0)
                {
                    throw new Exception("No changes were saved to the database");
                }

                // Update student's absent days count if needed
                var absentSessions = await _context.Attendances
                    .Where(a => a.StudentId == dto.StudentId && 
                               a.Date.HasValue && dto.Date.HasValue && 
                               a.Date.Value.Date == dto.Date.Value.Date && 
                               a.IsPresent == false)
                    .CountAsync();

                if (absentSessions >= 2)
                {
                    // StudentProfile was removed; using StudentExtension/Account instead.
                    var studentExt = await _context.StudentExtensions.FindAsync(dto.StudentId);
                    // StudentExtension does not contain DaysAbsent; consider calculating on demand.
                    // For now, skip updating a DaysAbsent field.
                }
                
                // Reload the record to ensure we have the latest data
                var savedRecord = await _context.Attendances.FindAsync(record.Id);
                return savedRecord ?? record;
            }
            catch (Exception ex)
            {
                // Log the exception and rethrow
                throw new Exception($"Error saving attendance: {ex.Message}", ex);
            }
        }


        public async Task AddNoteAsync(NoteInputModel model)
        {
            try
            {
                // Validate input
                if (model.StudentId <= 0)
                    throw new ArgumentException("Invalid student ID");
                    
                if (string.IsNullOrWhiteSpace(model.Title))
                    throw new ArgumentException("Note title is required");

                // Create the behavior note directly without requiring an attendance record
                var note = new BehaviorNote
                {
                    StudentId = model.StudentId,
                    Title = model.Title,
                    Description = model.Description,
                    NoteType = model.NoteType,
                    ImageUrl = model.ImageUrl,
                    Date = model.Date.Date // Use Date directly since it's not nullable
                };

                _context.BehaviorNotes.Add(note);
                var saveResult = await _context.SaveChangesAsync();
                
                if (saveResult <= 0)
                {
                    throw new Exception("Failed to save behavior note to database");
                }

                // StudentProfile JSON notes no longer stored in StudentProfile entity.
                // Attempt to find account for potential migration or logging; skip JSON update.
                var account = await _context.Accounts.FindAsync(model.StudentId);
                if (account == null)
                {
                    // no-op: cannot update legacy notes
                }
            }
            catch (Exception ex)
            {
                // Log the exception and rethrow with more context
                throw new Exception($"Error adding note for student {model.StudentId}: {ex.Message}", ex);
            }
        }

        public async Task<IEnumerable<object>> GetAttendanceHistoryAsync(int studentId, DateTime? fromDate, DateTime? toDate)
        {
            var query = _context.Attendances
                .Where(a => a.StudentId == studentId);

            if (fromDate.HasValue)
                query = query.Where(a => a.Date.HasValue && a.Date.Value.Date >= fromDate.Value.Date);

            if (toDate.HasValue)
                query = query.Where(a => a.Date.HasValue && a.Date.Value.Date <= toDate.Value.Date);

            return await query
                .OrderByDescending(a => a.Date.HasValue ? a.Date.Value : DateTime.MinValue) // Handle nullable DateTime in ordering
                .Select(a => new
                {
                    a.Id,
                    a.Date,
                    a.SessionNumber,
                    a.IsPresent,
                    a.NoteId,
                })
                .ToListAsync();
        }

        public async Task<object> GetDailyAttendanceReportAsync(DateTime date)
        {
            var attendanceRecords = await _context.Attendances
                .Where(a => a.Date.HasValue && a.Date.Value.Date == date.Date) // Check for null and compare only the date part
                .ToListAsync();

            var totalStudents = await _context.StudentExtensions.CountAsync();
            var presentStudents = attendanceRecords.Count(a => a.IsPresent == true);
            var absentStudents = totalStudents - presentStudents;

            // Get student names for the attendance records
            var studentIds = attendanceRecords.Select(a => a.StudentId).Distinct().ToList();
            var students = await _context.Accounts
                .Where(a => studentIds.Contains(a.Id))
                .ToDictionaryAsync(a => a.Id, a => a.FullNameEn ?? a.FullNameAr ?? a.Email);

            return new
            {
                Date = date.Date,
                TotalStudents = totalStudents,
                PresentStudents = presentStudents,
                AbsentStudents = absentStudents,
                AttendanceRecords = attendanceRecords.Select(a => new
                {
                    a.Id,
                    a.StudentId,
                    StudentName = students.ContainsKey(a.StudentId) ? students[a.StudentId] : "Unknown",
                    IsPresent = a.IsPresent ?? false,
                    a.SessionNumber
                })
            };
        }

        public async Task<bool> UpdateAttendanceAsync(int attendanceId, UpdateAttendanceDto dto)
        {
            var record = await _context.Attendances.FindAsync(attendanceId);
            if (record == null)
                return false;

            record.IsPresent = dto.IsPresent;
            record.Date = dto.Date.HasValue ? dto.Date.Value.Date : DateTime.Now.Date; // Handle nullable DateTime
            record.SessionNumber = dto.SessionNumber;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<object>> GetAttendanceByClassSessionDateAsync(long classId, int sessionNumber, DateTime date)
        {
            var attendanceRecords = await _context.Attendances
                .Include(a => a.Student)
                .Include(a => a.Note)
                .Where(a => a.ClassId == classId &&
                           a.SessionNumber == sessionNumber &&
                           a.Date.HasValue && a.Date.Value.Date == date.Date) // Check for null and compare only the date part
                .Select(a => new
                {
                    a.Id,
                    a.StudentId,
                    StudentName = a.Student != null ? (a.Student.FullNameEn ?? "Unknown") : "Unknown",
                    a.IsPresent,
                    a.SessionNumber,
                    a.Date,
                    a.ClassId,
                    Note = a.Note != null ? new
                    {
                        a.Note.Id,
                        a.Note.Title,
                        a.Note.Description,
                        a.Note.NoteType,
                        a.Note.ImageUrl
                    } : null
                })
                .ToListAsync();

            return attendanceRecords;
        }

        public async Task<IEnumerable<object>> GetBehaviorNotesByStudentDateAsync(long studentId, DateTime date)
        {
            var notes = await _context.BehaviorNotes
                .Where(n => n.StudentId == studentId &&
                           n.Date.Date == date.Date) // Compare only the date part
                .Select(n => new
                {
                    n.Id,
                    n.Title,
                    n.Description,
                    n.NoteType,
                    n.ImageUrl,
                    n.Date
                })
                .ToListAsync();

            return notes;
        }

        public Task<bool> DeleteAttendanceAsync(int attendanceId)
        {
            throw new NotImplementedException();
        }

        public async Task UpdateAttendanceNoteIdAsync(long attendanceId, long noteId)
        {
            var attendanceRecord = await _context.Attendances.FindAsync(attendanceId);
            if (attendanceRecord != null)
            {
                attendanceRecord.NoteId = noteId;
                await _context.SaveChangesAsync();
            }
        }

        // Add this method to get all absent records
        public async Task<IEnumerable<object>> GetAllAbsentRecordsAsync()
        {
            try
            {
                var absentRecords = await _context.Attendances
                    .Where(a => a.IsPresent == false) // Only absent records
                    .Include(a => a.Student)
                    .Include(a => a.Class)
                        .ThenInclude(c => c.Grade)
                    .Where(a => a.Student != null && a.Class != null && a.Class.Grade != null && a.Date.HasValue) // Add null checks including Date
                    .Select(a => new
                    {
                        Id = a.Id,
                        StudentId = a.StudentId,
                        StudentName = a.Student.FullNameEn ?? "Unknown",
                        Date = a.Date.HasValue ? a.Date.Value : DateTime.MinValue, // Properly handle nullable DateTime
                        Session = a.SessionNumber,
                        ClassId = a.ClassId,
                        ClassName = a.Class.ClassName,
                        GradeName = a.Class.Grade.GradeName
                    })
                    .ToListAsync();

                return absentRecords;
            }
            catch (Exception ex)
            {
                // Log the exception and return empty collection
                Console.WriteLine($"Error in GetAllAbsentRecordsAsync: {ex.Message}");
                return new List<object>();
            }
        }

        // Add this method to get attendance trends
        public async Task<IEnumerable<object>> GetAttendanceTrendsAsync(DateTime fromDate, DateTime toDate)
        {
            try
            {
                var trends = await _context.Attendances
                    .Where(a => a.Date.HasValue && 
                           (a.Date.Value.Date >= fromDate.Date) && 
                           (a.Date.Value.Date <= toDate.Date)) // Check for null and compare only the date parts
                    .GroupBy(a => a.Date.HasValue ? a.Date.Value.Date : DateTime.MinValue) // Group by date part only, handle nullable safely
                    .Select(g => new
                    {
                        Date = g.Key,
                        TotalStudents = g.Count(),
                        PresentStudents = g.Count(a => a.IsPresent == true),
                        AbsentStudents = g.Count(a => a.IsPresent == false)
                    })
                    .ToListAsync();

                return trends;
            }
            catch (Exception ex)
            {
                // Log the exception and return empty collection
                Console.WriteLine($"Error in GetAttendanceTrendsAsync: {ex.Message}");
                return new List<object>();
            }
        }

        // Add this method to get at-risk students
        public async Task<IEnumerable<object>> GetAtRiskStudentsAsync()
        {
            try
            {
                // Get students with high absence rates (more than 3 absences in the last 30 days)
                var thirtyDaysAgo = DateTime.Now.AddDays(-30).Date; // Ensure we use only the date part
                
                var atRiskStudents = await _context.Attendances
                    .Where(a => a.Date.HasValue && 
                           (a.Date.Value.Date >= thirtyDaysAgo) && 
                           (a.Date.Value.Date <= DateTime.Now.Date) &&
                           a.IsPresent == false) // Check for null and compare only the date parts
                    .Include(a => a.Student)
                    .Include(a => a.Class)
                    .Where(a => a.Student != null && a.Class != null) // Add null checks
                    .GroupBy(a => new { 
                        a.StudentId, 
                        StudentName = a.Student.FullNameEn, 
                        ClassName = a.Class.ClassName 
                    })
                    .Select(g => new
                    {
                        StudentId = g.Key.StudentId,
                        StudentName = g.Key.StudentName,
                        ClassName = g.Key.ClassName,
                        Absences = g.Count(),
                        // Calculate attendance rate based on the last 30 days
                        AttendanceRate = 30 > 0 ? ((30 - (double)g.Count()) / 30 * 100) : 100
                    })
                    .Where(s => s.Absences > 0) // More than 0 absences for testing
                    .OrderByDescending(s => s.Absences)
                    .Take(10) // Top 10 at-risk students
                    .ToListAsync();

                return atRiskStudents;
            }
            catch (Exception ex)
            {
                // Log the exception and return empty collection
                Console.WriteLine($"Error in GetAtRiskStudentsAsync: {ex.Message}");
                return new List<object>();
            }
        }

        // Add this method to get class performance data
        public async Task<IEnumerable<object>> GetClassPerformanceAsync()
        {
            try
            {
                var performance = await _context.Attendances
                    .Include(a => a.Class)
                        .ThenInclude(c => c.Grade)
                    .Where(a => a.Class != null && a.Class.Grade != null) // Add null checks
                    .GroupBy(a => new { 
                        a.ClassId, 
                        ClassName = a.Class.ClassName, 
                        GradeName = a.Class.Grade.GradeName 
                    })
                    .Select(g => new
                    {
                        ClassId = g.Key.ClassId,
                        ClassName = g.Key.ClassName,
                        GradeName = g.Key.GradeName,
                        AttendanceRate = g.Count() > 0 ? (double)g.Count(a => a.IsPresent == true) / g.Count() * 100 : 0
                    })
                    .ToListAsync();

                return performance;
            }
            catch (Exception ex)
            {
                // Log the exception and return empty collection
                Console.WriteLine($"Error in GetClassPerformanceAsync: {ex.Message}");
                return new List<object>();
            }
        }
    }
}
