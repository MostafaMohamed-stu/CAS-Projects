using AttendanceBehaviour_Backend.Data;
using AttendanceBehaviour_Backend.DTOs;
using AttendanceBehaviour_Backend.Interfaces;
using AttendanceBehaviour_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace AttendanceBehaviour_Backend.Repos
{
    public class AbsenceRepository : IAbsenceRepository
    {
        private readonly ElsewedySchoolContext _context;

        public AbsenceRepository(ElsewedySchoolContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<AbsenceRecordDto>> GetAllAsync()
        {
            var absences = await _context.AbsenceRecords
                .Include(a => a.Studentextension)
                    .ThenInclude(se => se.Account)
                .Include(a => a.Studentextension)
                    .ThenInclude(se => se.TblClass)
                        .ThenInclude(c => c.Grade)
                .ToListAsync();

            var lecturerIds = absences
                .Where(a => a.LectuerId.HasValue)
                .Select(a => a.LectuerId!.Value)
                .Distinct()
                .ToList();

            var lecturersMap = await _context.Accounts
                .Where(a => lecturerIds.Contains(a.Id))
                .Select(a => new { a.Id, a.FullNameEn, a.FullNameAr })
                .ToDictionaryAsync(a => a.Id, a => a);

            // Group by student, date, and class to detect full-day absences
            var groupedAbsences = absences
                .GroupBy(a => new
                {
                    a.StudentId,
                    Date = a.DateOfAbsence,
                    ClassId = a.Studentextension?.TblClassId ?? 0
                })
                .ToList();

            var result = new List<AbsenceRecordDto>();

            foreach (var group in groupedAbsences)
            {
                var absenceList = group.ToList();
                var sessions = absenceList
                    .Where(a => a.SessionId.HasValue)
                    .Select(a => (int)a.SessionId.Value)
                    .ToList();

                // Check if student is absent for ALL sessions in the day (1..8)
                var requiredSessions = new[] { 1, 2, 3, 4, 5, 6, 7, 8 };
                bool isFullDay = requiredSessions.All(s => sessions.Contains(s));

                if (isFullDay)
                {
                    // Create a single "All Day" record
                    var firstRecord = absenceList.First();
                    DateTime dateValue;
                    try
                    {
                        dateValue = firstRecord.DateOfAbsence.ToDateTime(TimeOnly.MinValue);
                    }
                    catch
                    {
                        dateValue = DateTime.UtcNow.Date;
                    }

                    // Determine aggregated AbsenceTypeId
                    // If ANY record has Excuse (20), the full day is Excused.
                    // If NO record has Excuse but ANY has No Excuse (10), it's No Excuse.
                    // Otherwise fall back to the first record's type.
                    int? aggregatedAbsenceTypeId = firstRecord.AbsenceTypeId;
                    if (absenceList.Any(x => x.AbsenceTypeId == 20))
                    {
                        aggregatedAbsenceTypeId = 20;
                    }
                    else if (absenceList.Any(x => x.AbsenceTypeId == 10))
                    {
                        aggregatedAbsenceTypeId = 10;
                    }

                    result.Add(new AbsenceRecordDto
                    {
                        Id = firstRecord.Id,
                        StudentId = firstRecord.StudentId,
                        StudentName = firstRecord.Studentextension?.Account?.FullNameEn ?? "",
                        StudentNameAr = firstRecord.Studentextension?.Account?.FullNameAr ?? "",
                        Date = dateValue,
                        DateOfAbsence = dateValue,
                        Session = -1, // Special indicator for "All Day"
                        ClassId = firstRecord.Studentextension?.TblClassId ?? 0,
                        Class = firstRecord.Studentextension?.TblClass?.ClassName ?? "",
                        Grade = firstRecord.Studentextension?.TblClass?.Grade?.GradeName ?? "",
                        AbsenceTypeId = aggregatedAbsenceTypeId,
                        LectuerId = firstRecord.LectuerId, // Added LectuerId
                        LecturerName = (firstRecord.LectuerId.HasValue && lecturersMap.ContainsKey(firstRecord.LectuerId.Value))
                            ? lecturersMap[firstRecord.LectuerId.Value].FullNameEn
                            : null,
                        LecturerNameAr = (firstRecord.LectuerId.HasValue && lecturersMap.ContainsKey(firstRecord.LectuerId.Value))
                            ? lecturersMap[firstRecord.LectuerId.Value].FullNameAr
                            : null,
                        RecordedAt = DateTime.UtcNow
                    });
                }
                else
                {
                    // Return individual session records
                    foreach (var a in absenceList)
                    {
                        DateTime dateValue;
                        try
                        {
                            dateValue = a.DateOfAbsence.ToDateTime(TimeOnly.MinValue);
                        }
                        catch
                        {
                            dateValue = DateTime.UtcNow.Date;
                        }

                        result.Add(new AbsenceRecordDto
                        {
                            Id = a.Id,
                            StudentId = a.StudentId,
                            StudentName = a.Studentextension?.Account?.FullNameEn ?? "",
                            StudentNameAr = a.Studentextension?.Account?.FullNameAr ?? "",
                            Date = dateValue,
                            DateOfAbsence = dateValue,
                            Session = a.SessionId.HasValue ? (int)a.SessionId.Value : 0,
                            ClassId = a.Studentextension?.TblClassId ?? 0,
                            Class = a.Studentextension?.TblClass?.ClassName ?? "",
                            Grade = a.Studentextension?.TblClass?.Grade?.GradeName ?? "",
                            AbsenceTypeId = a.AbsenceTypeId,
                            LectuerId = a.LectuerId, // Added LectuerId
                            LecturerName = (a.LectuerId.HasValue && lecturersMap.ContainsKey(a.LectuerId.Value))
                                ? lecturersMap[a.LectuerId.Value].FullNameEn
                                : null,
                            LecturerNameAr = (a.LectuerId.HasValue && lecturersMap.ContainsKey(a.LectuerId.Value))
                                ? lecturersMap[a.LectuerId.Value].FullNameAr
                                : null,
                            RecordedAt = DateTime.UtcNow
                        });
                    }
                }
            }

            return result;
        }

        public async Task<AbsenceRecordDto?> GetByIdAsync(int id)
        {
            var a = await _context.AbsenceRecords
                .Include(a => a.Studentextension)
                    .ThenInclude(se => se.Account)
                .Include(a => a.Studentextension)
                    .ThenInclude(se => se.TblClass)
                        .ThenInclude(c => c.Grade)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (a == null) return null;

            string CleanPrefix(string? input, string prefixToRemove)
            {
                if (string.IsNullOrWhiteSpace(input)) return "";
                var s = input.Trim();
                if (s.StartsWith(prefixToRemove, StringComparison.OrdinalIgnoreCase))
                    return s.Substring(prefixToRemove.Length).Trim();
                return s;
            }

            var rawClassName = a.Studentextension?.TblClass?.ClassName ?? "";
            var rawGradeName = a.Studentextension?.TblClass?.Grade?.GradeName ?? "";

            var normalizedClassName = CleanPrefix(rawClassName, "Class ");
            var normalizedGradeName = CleanPrefix(rawGradeName, "Grade ");

            DateTime dateValue;
            try
            {
                dateValue = a.DateOfAbsence.ToDateTime(TimeOnly.MinValue);
            }
            catch
            {
                dateValue = DateTime.UtcNow.Date;
            }

            var lecturer = a.LectuerId.HasValue 
                ? await _context.Accounts
                    .Where(x => x.Id == a.LectuerId.Value)
                    .Select(x => new { x.FullNameEn, x.FullNameAr })
                    .FirstOrDefaultAsync()
                : null;

            return new AbsenceRecordDto
            {
                Id = a.Id,
                StudentId = a.StudentId,
                StudentName = a.Studentextension?.Account?.FullNameEn ?? "",
                StudentNameAr = a.Studentextension?.Account?.FullNameAr ?? "",
                Date = dateValue,
                DateOfAbsence = dateValue,
                Session = a.SessionId.HasValue ? (int)a.SessionId.Value : 0,
                ClassId = a.Studentextension?.TblClassId ?? 0,
                Class = normalizedClassName,
                Grade = normalizedGradeName,
                AbsenceTypeId = a.AbsenceTypeId,
                LectuerId = a.LectuerId, // Added LectuerId
                LecturerName = lecturer?.FullNameEn,
                LecturerNameAr = lecturer?.FullNameAr
            };
        }

        public async Task AddAsync(CreateAbsenceRecordDto dto)
        {
            var record = new AbsenceRecord
            {
                StudentId = dto.StudentId,
                ClassId = dto.ClassId,
                DateOfAbsence = DateOnly.FromDateTime(dto.DateOfAbsence),
                LectuerId = dto.lectuerID,
                SessionId = dto.SessionID,
                AbsenceTypeId = dto.AbsenceTypeId
            };
            _context.AbsenceRecords.Add(record);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(long id)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var record = await _context.AbsenceRecords.FindAsync(id);
                if (record == null)
                {
                    return;
                }

                var sameDayQuery = _context.AbsenceRecords
                    .Where(a => a.StudentId == record.StudentId && a.DateOfAbsence == record.DateOfAbsence);

                var hasEntireDayRecord = await sameDayQuery.AnyAsync(a => a.SessionId == -1);
                var sameDayCount = await sameDayQuery.CountAsync();

                if (hasEntireDayRecord || sameDayCount >= 8)
                {
                    var recordsToDelete = await sameDayQuery.ToListAsync();
                    _context.AbsenceRecords.RemoveRange(recordsToDelete);
                }
                else
                {
                    _context.AbsenceRecords.Remove(record);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<IEnumerable<AbsenceRecordDto>> GetFilteredAbsencesAsync(string? gradeName, string? className, DateTime? fromDate, DateTime? toDate)
        {
            var query = _context.AbsenceRecords
                .Include(a => a.Studentextension)
                    .ThenInclude(se => se.Account)
                .Include(a => a.Studentextension)
                    .ThenInclude(se => se.TblClass)
                        .ThenInclude(c => c.Grade)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(gradeName))
            {
                query = query.Where(a => a.Studentextension != null
                                         && a.Studentextension.TblClass != null
                                         && a.Studentextension.TblClass.Grade != null
                                         && a.Studentextension.TblClass.Grade.GradeName == gradeName);
            }

            if (!string.IsNullOrWhiteSpace(className))
            {
                query = query.Where(a => a.Studentextension != null
                                         && a.Studentextension.TblClass != null
                                         && a.Studentextension.TblClass.ClassName == className);
            }

            if (fromDate.HasValue)
            {
                var fromDateOnly = DateOnly.FromDateTime(fromDate.Value);
                query = query.Where(a => a.DateOfAbsence >= fromDateOnly);
            }

            if (toDate.HasValue)
            {
                var toDateOnly = DateOnly.FromDateTime(toDate.Value);
                query = query.Where(a => a.DateOfAbsence <= toDateOnly);
            }

            var absences = await query.ToListAsync();

            var lecturerIds = absences
                .Where(a => a.LectuerId.HasValue)
                .Select(a => a.LectuerId!.Value)
                .Distinct()
                .ToList();

            var lecturersMap = await _context.Accounts
                .Where(a => lecturerIds.Contains(a.Id))
                .Select(a => new { a.Id, a.FullNameEn, a.FullNameAr })
                .ToDictionaryAsync(a => a.Id, a => a);

            return absences.Select(a =>
            {
                DateTime dateValue;
                try
                {
                    dateValue = a.DateOfAbsence.ToDateTime(TimeOnly.MinValue);
                }
                catch
                {
                    dateValue = DateTime.UtcNow.Date;
                }

                return new AbsenceRecordDto
                {
                    Id = a.Id,
                    StudentId = a.StudentId,
                    StudentName = a.Studentextension?.Account?.FullNameEn ?? "",
                    StudentNameAr = a.Studentextension?.Account?.FullNameAr ?? "",
                    Date = dateValue,
                    DateOfAbsence = dateValue,
                    Session = a.SessionId.HasValue ? (int)a.SessionId.Value : 0,
                    ClassId = a.Studentextension?.TblClassId ?? 0,
                    Class = a.Studentextension?.TblClass?.ClassName ?? "",
                    Grade = a.Studentextension?.TblClass?.Grade?.GradeName ?? "",
                    AbsenceTypeId = a.AbsenceTypeId,
                    LectuerId = a.LectuerId, // Added LectuerId
                    LecturerName = (a.LectuerId.HasValue && lecturersMap.ContainsKey(a.LectuerId.Value))
                        ? lecturersMap[a.LectuerId.Value].FullNameEn
                        : null,
                    LecturerNameAr = (a.LectuerId.HasValue && lecturersMap.ContainsKey(a.LectuerId.Value))
                        ? lecturersMap[a.LectuerId.Value].FullNameAr
                        : null,
                    RecordedAt = DateTime.UtcNow
                };
            });
        }

        public async Task<IEnumerable<object>> GetLowAttendanceStudentsAsync(int minAbsences = 5, int maxAbsences = 100)
        {
            var studentsWithAbsences = await _context.AbsenceRecords
                .Include(a => a.Studentextension)
                    .ThenInclude(se => se.Account)
                .Include(a => a.Studentextension)
                    .ThenInclude(se => se.TblClass)
                        .ThenInclude(c => c.Grade)
                .GroupBy(a => new
                {
                    a.StudentId,
                    StudentName = a.Studentextension.Account.FullNameEn,
                    ClassName = a.Studentextension.TblClass.ClassName,
                    GradeName = a.Studentextension.TblClass.Grade.GradeName
                })
                .Select(g => new
                {
                    StudentId = g.Key.StudentId,
                    StudentName = g.Key.StudentName,
                    ClassName = g.Key.ClassName,
                    GradeName = g.Key.GradeName,
                    Absences = g.Count(),
                    // Assuming 30 school days for attendance rate calculation
                    AttendanceRate = 30 > 0 ? ((30 - (double)g.Count()) / 30 * 100) : 100
                })
                .Where(s => s.Absences >= minAbsences && s.Absences <= maxAbsences)
                .OrderByDescending(s => s.Absences)
                .ToListAsync();

            return studentsWithAbsences;
        }

        public async Task<object> GetAttendanceStatisticsAsync(string? gradeName, string? className, DateTime? fromDate, DateTime? toDate)
        {
            // 1. Determine Date Range (default to last 30 days if null)
            var start = fromDate ?? DateTime.Now.AddDays(-30);
            var end = toDate ?? DateTime.Now;
            var daysCount = (end - start).TotalDays + 1;
            if (daysCount < 1) daysCount = 1;

            var startDateOnly = DateOnly.FromDateTime(start);
            var endDateOnly = DateOnly.FromDateTime(end);

            // 2. Base Absence Query
            var query = _context.AbsenceRecords
                .Include(a => a.Studentextension)
                    .ThenInclude(se => se.TblClass)
                        .ThenInclude(c => c.Grade)
                .Where(a => a.DateOfAbsence >= startDateOnly && a.DateOfAbsence <= endDateOnly)
                .AsQueryable();

            // Apply filters to Absence Query
            if (!string.IsNullOrWhiteSpace(gradeName))
                query = query.Where(a => a.Studentextension.TblClass.Grade.GradeName == gradeName);

            if (!string.IsNullOrWhiteSpace(className))
                query = query.Where(a => a.Studentextension.TblClass.ClassName == className);

            var totalAbsences = await query.CountAsync();

            // 3. Base Student Query (Active Students)
            var studentQuery = _context.StudentExtensions
                .Include(se => se.TblClass)
                    .ThenInclude(c => c.Grade)
                .Where(se => se.StatusId == 1) // Assuming 1 is Active
                .AsQueryable();

            // Apply filters to Student Query
            if (!string.IsNullOrWhiteSpace(gradeName))
                studentQuery = studentQuery.Where(se => se.TblClass.Grade.GradeName == gradeName);

            if (!string.IsNullOrWhiteSpace(className))
                studentQuery = studentQuery.Where(se => se.TblClass.ClassName == className);

            var totalStudents = await studentQuery.CountAsync();

            // 4. Calculate Overall Attendance Rate
            // Logic: Count unique (Student, Date) pairs to get "Student-Days Absent"
            var uniqueDaysAbsent = await query
                .Select(a => new { a.StudentId, a.DateOfAbsence })
                .Distinct()
                .CountAsync();

            // Total Possible Student-Days = TotalStudents * Days in Range
            // (Exclude weekends? For now, we use raw days count as requested or simpler approximation)
            // To be more precise, we'd calculate business days, but let's stick to daysCount for now.
            var totalPossibleDays = totalStudents * daysCount;
            
            double attendanceRate = 100;
            if (totalPossibleDays > 0)
            {
                attendanceRate = ((totalPossibleDays - uniqueDaysAbsent) / totalPossibleDays) * 100;
            }

            // 5. Class Performance (Get ALL classes matching filter, not just those with absences)
            var classesQuery = _context.TblClasses
                .Include(c => c.Grade)
                .Where(c => c.StatusId == 1)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(gradeName))
                classesQuery = classesQuery.Where(c => c.Grade.GradeName == gradeName);
            if (!string.IsNullOrWhiteSpace(className))
                classesQuery = classesQuery.Where(c => c.ClassName == className);

            var allClasses = await classesQuery
                .Select(c => new { c.Id, c.ClassName, GradeName = c.Grade.GradeName })
                .ToListAsync();

            // Group absences by ClassId
            var absencesByClass = await query
                .GroupBy(a => a.Studentextension.TblClassId)
                .Select(g => new { ClassId = g.Key, Count = g.Count() })
                .ToListAsync();

            // Map results
            var classPerformance = allClasses.Select(c => new
            {
                gradeName = c.GradeName,
                className = c.ClassName,
                totalAbsences = absencesByClass.FirstOrDefault(x => x.ClassId == c.Id)?.Count ?? 0
            })
            .OrderByDescending(x => x.totalAbsences) // Highest absences first for the chart? Or lowest? usually "Performance" implies Good = Low Absences.
            // But the chart is "Absence Count", so showing high bars for high absences is correct.
            .ToList();

            var topPerformingClass = classPerformance.OrderBy(x => x.totalAbsences).FirstOrDefault();

            return new
            {
                totalStudents = totalStudents,      // camelCase for frontend
                totalAbsences = totalAbsences,      // camelCase for frontend
                totalLates = 0,                     // Placeholder for Lates
                overallAttendanceRate = Math.Round(attendanceRate, 2),
                topPerformingClass = topPerformingClass,
                classPerformance = classPerformance
            };
        }

        public async Task UpdateAbsenceTypeAsync(int id, int? absenceTypeId)
        {
            var record = await _context.AbsenceRecords.FindAsync((long)id);
            if (record == null) return;

            // Update the target record
            record.AbsenceTypeId = absenceTypeId;

            // Check if this record is part of a full-day absence
            // We propagate the excuse status to all other records for the same student on the same date
            // This ensures that if the user toggles "Entire day", all sessions are updated.
            
            var sameDayRecords = await _context.AbsenceRecords
                .Where(a => a.StudentId == record.StudentId && a.DateOfAbsence == record.DateOfAbsence && a.Id != record.Id)
                .ToListAsync();

            if (sameDayRecords.Any())
            {
                foreach (var sameDayRecord in sameDayRecords)
                {
                    sameDayRecord.AbsenceTypeId = absenceTypeId;
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}
