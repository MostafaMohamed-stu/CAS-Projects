using AttendanceBehaviour_Backend.DTOs;
using AttendanceBehaviour_Backend.Models;

namespace AttendanceBehaviour_Backend.Interfaces
{
    public interface IAttendanceRepository
    {
        Task<Attendance> SaveAttendanceAsync(SaveAttendanceDto dto);
        Task AddNoteAsync(NoteInputModel model);
        Task UpdateAttendanceNoteIdAsync(long attendanceId, long noteId);
        Task<IEnumerable<object>> GetAttendanceHistoryAsync(int studentId, DateTime? fromDate, DateTime? toDate);
        Task<object> GetDailyAttendanceReportAsync(DateTime date);
        Task<bool> UpdateAttendanceAsync(int attendanceId, UpdateAttendanceDto dto);
        Task<bool> DeleteAttendanceAsync(int attendanceId);
        Task<IEnumerable<object>> GetAttendanceByClassSessionDateAsync(long classId, int sessionNumber, DateTime date);
        Task<IEnumerable<object>> GetBehaviorNotesByStudentDateAsync(long studentId, DateTime date);
        Task<IEnumerable<object>> GetAllAbsentRecordsAsync();
        Task<IEnumerable<object>> GetAttendanceTrendsAsync(DateTime fromDate, DateTime toDate);
        Task<IEnumerable<object>> GetClassPerformanceAsync(); // Add this method
        Task<IEnumerable<object>> GetAtRiskStudentsAsync(); // Add this method
    }
}
