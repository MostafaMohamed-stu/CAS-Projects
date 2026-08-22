using AttendanceBehaviour_Backend.DTOs;

namespace AttendanceBehaviour_Backend.Interfaces
{
    public interface IAbsenceRepository
    {
        Task<IEnumerable<AbsenceRecordDto>> GetAllAsync();
        Task<AbsenceRecordDto?> GetByIdAsync(int id);
        Task AddAsync(CreateAbsenceRecordDto dto);
        Task DeleteAsync(long id);
        
        // New methods for filtering and analytics
        Task<IEnumerable<AbsenceRecordDto>> GetFilteredAbsencesAsync(string? gradeName, string? className, DateTime? fromDate, DateTime? toDate);
        Task<IEnumerable<object>> GetLowAttendanceStudentsAsync(int minAbsences = 5, int maxAbsences = 100);
        Task<object> GetAttendanceStatisticsAsync(string? gradeName, string? className, DateTime? fromDate, DateTime? toDate);
        Task UpdateAbsenceTypeAsync(int id, int? absenceTypeId);
    }
}
