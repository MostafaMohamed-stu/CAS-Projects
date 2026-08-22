using AttendanceBehaviour_Backend.DTOs;

namespace AttendanceBehaviour_Backend.Interfaces
{
    public interface IStaffRepository
    {
        Task<StaffDto> CreateStaffAttendanceAsync(CreateStaffAttendanceDto dto);
        Task<IEnumerable<StaffDto>> GetStaffAttendanceByDateAsync(DateTime date);
        Task<IEnumerable<StaffDto>> GetStaffAttendanceByDepartmentAsync(string department, DateTime? date = null);
        Task<StaffDto> GetStaffAttendanceByIdAsync(long id);
        Task<bool> UpdateStaffAttendanceAsync(long id, UpdateStaffAttendanceDto dto);
        Task<bool> DeleteStaffAttendanceAsync(long id);
        Task<IEnumerable<StaffDto>> GetStaffAttendanceHistoryAsync(int accountId, DateTime? fromDate, DateTime? toDate);
        // NEW: Method to get all staff members
        Task<IEnumerable<StaffListDto>> GetAllStaffAsync();
        // NEW: Method to register a new staff member
        Task<StaffDto> RegisterStaffAsync(RegisterStaffDto dto);
        // NEW: Method to get all roles
        Task<IEnumerable<object>> GetRolesAsync();
        // NEW: Method to get all departments
        Task<IEnumerable<string>> GetDepartmentsAsync();
    }
}
