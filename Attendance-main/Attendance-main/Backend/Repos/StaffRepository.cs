using Microsoft.EntityFrameworkCore;
using AttendanceBehaviour_Backend.DTOs;
using AttendanceBehaviour_Backend.Models;
using AttendanceBehaviour_Backend.Data;
using AttendanceBehaviour_Backend.Interfaces;

namespace AttendanceBehaviour_Backend.Repos
{
    public class StaffRepository : IStaffRepository
    {
        private readonly ElsewedySchoolContext _context;

        public StaffRepository(ElsewedySchoolContext context)
        {
            _context = context;
        }

        public async Task<StaffDto> CreateStaffAttendanceAsync(CreateStaffAttendanceDto dto)
        {
            var staff = new Staff
            {
                EmployeeName = dto.EmployeeName,
                Department = dto.Department,
                Status = dto.Status,
                CheckInTime = dto.CheckInTime ?? DateTime.UtcNow,
                CheckInMethod = dto.CheckInMethod,
                AccountId = dto.AccountId ?? 0,
                RoleId = dto.RoleId ?? 0,
                Date = DateTime.UtcNow.Date,
                CreatedAt = DateTime.UtcNow
            };

            _context.Staff.Add(staff);
            await _context.SaveChangesAsync();

            return MapToDto(staff);
        }

        public async Task<IEnumerable<StaffDto>> GetStaffAttendanceByDateAsync(DateTime date)
        {
            var staffList = await _context.Staff
                .Where(s => s.Date.Date == date.Date)
                .Include(s => s.Account)
                .Include(s => s.Role)
                .ToListAsync();

            return staffList.Select(MapToDto);
        }

        public async Task<IEnumerable<StaffDto>> GetStaffAttendanceByDepartmentAsync(string department, DateTime? date = null)
        {
            var query = _context.Staff.AsQueryable();

            if (!string.IsNullOrEmpty(department))
                query = query.Where(s => s.Department == department);

            if (date.HasValue)
                query = query.Where(s => s.Date.Date == date.Value.Date);

            var staffList = await query
                .Include(s => s.Account)
                .Include(s => s.Role)
                .ToListAsync();

            return staffList.Select(MapToDto);
        }

        public async Task<StaffDto> GetStaffAttendanceByIdAsync(long id)
        {
            try {
                var staff = await _context.Staff
                    .Include(s => s.Account)
                    .Include(s => s.Role)
                    .FirstOrDefaultAsync(s => s.Id == id);

                return staff != null ? MapToDto(staff) : null;
            } catch (Exception) {
                return null;
            }
        }

        public async Task<bool> UpdateStaffAttendanceAsync(long id, UpdateStaffAttendanceDto dto)
        {
            var staff = await _context.Staff.FindAsync(id);
            if (staff == null) return false;

            staff.Status = dto.Status;
            //staff.CheckInTime = dto.CheckInTime;
            staff.CheckInMethod = dto.CheckInMethod;
            staff.UpdatedAt = DateTime.UtcNow;

            try {
                await _context.SaveChangesAsync();
                return true;
            } catch (Exception ex) {
                // Log the actual exception for debugging
                Console.WriteLine($"Error updating staff attendance: {ex.Message}");
                throw; // Re-throw to let the controller handle it
            }
        }

        public async Task<bool> DeleteStaffAttendanceAsync(long id)
        {
            var staff = await _context.Staff.FindAsync(id);
            if (staff == null) return false;

            try {
                _context.Staff.Remove(staff);
                await _context.SaveChangesAsync();
                return true;
            } catch (Exception) {
                return false;
            }
        }

        public async Task<IEnumerable<StaffDto>> GetStaffAttendanceHistoryAsync(int accountId, DateTime? fromDate, DateTime? toDate)
        {
            var query = _context.Staff.Where(s => s.AccountId == accountId);

            if (fromDate.HasValue)
                query = query.Where(s => s.Date.Date >= fromDate.Value.Date);

            if (toDate.HasValue)
                query = query.Where(s => s.Date.Date <= toDate.Value.Date);

            var staffList = await query
                .Include(s => s.Account)
                .Include(s => s.Role)
                .OrderByDescending(s => s.Date)
                .ToListAsync();

            return staffList.Select(MapToDto);
        }

        // NEW: Get all staff members
        public async Task<IEnumerable<StaffListDto>> GetAllStaffAsync()
        {
            // Get all distinct staff members (not just today's attendance)
            // Modified to show all staff records, not grouping by AccountId
            var staffMembers = await _context.Staff
                .Include(s => s.Account)
                .Include(s => s.Role)
                .Where(s => s.AccountId.HasValue) // Filter out records with null AccountId
                .ToListAsync();

            return staffMembers.Select(MapToStaffListDto);
        }

        private StaffDto MapToDto(Staff staff)
        {
            return new StaffDto
            {
                Id = staff.Id,
                EmployeeName = staff.EmployeeName,
                Department = staff.Department,
                Status = staff.Status,
                CheckInTime = staff.CheckInTime,
                CheckInMethod = staff.CheckInMethod,
                Date = staff.Date,
                AccountId = staff.AccountId,
                RoleId = staff.RoleId,
                CreatedAt = staff.CreatedAt
            };
        }

        // NEW: Map Staff to StaffListDto
        private StaffListDto MapToStaffListDto(Staff staff)
        {
            return new StaffListDto
            {
                Id = staff.Id,
                EmployeeId = staff.Id.ToString(), // Use Staff ID as Employee ID instead of Account ID
                AccountId = staff.AccountId,
                Name = staff.EmployeeName ,
                Department = staff.Department,
                Role = staff.Role?.RoleName ?? "N/A",
                Email = staff.Account?.Email ?? "N/A"
            };
        }

        // NEW: Register a new staff member
        public async Task<StaffDto> RegisterStaffAsync(RegisterStaffDto dto)
        {
            // Update the Account entity with phone and address if they exist
            if (dto.AccountId > 0)
            {
                var account = await _context.Accounts.FindAsync(dto.AccountId);
                if (account != null)
                {
                    // Update phone and address in the Account entity
                    if (!string.IsNullOrEmpty(dto.Phone))
                    {
                        account.Phone = dto.Phone;
                    }
                    
                    // Note: Address is not in the Account entity, so we don't save it there
                    // If you want to save address, you would need to add it to the Account model
                    // For now, we'll just ignore it as per your instruction to not add columns
                }
            }

            var staff = new Staff
            {
                EmployeeName = dto.EmployeeName,
                Department = dto.Department,
                Status = dto.Status,
                CheckInTime = dto.CheckInTime ?? DateTime.UtcNow,
                CheckInMethod = dto.CheckInMethod,
                AccountId = dto.AccountId,
                RoleId = dto.RoleId,
                Date = DateTime.UtcNow.Date,
                CreatedAt = DateTime.UtcNow
            };

            _context.Staff.Add(staff);
            await _context.SaveChangesAsync();

            return MapToDto(staff);
        }

        // NEW: Get all roles
        public async Task<IEnumerable<object>> GetRolesAsync()
        {
            // Note: This is a simplified implementation
            // In a real-world scenario, you would inject the DbContext directly
            // or have a better way to access it from the repository
            var roles = await _context.Roles
                .Select(r => new { r.Id, r.RoleName })
                .ToListAsync();
            
            return roles;
        }

        // NEW: Get all unique departments
        public async Task<IEnumerable<string>> GetDepartmentsAsync()
        {
            var departments = await _context.Staff
                .Where(s => !string.IsNullOrEmpty(s.Department))
                .Select(s => s.Department)
                .Distinct()
                .ToListAsync();
            
            // If no departments exist in the database, return default departments
            if (!departments.Any())
            {
                return new List<string> 
                { 
                    "IT", 
                    "School Administration", 
                    "Engineering", 
                    "Teaching", 
                    "Support Staff", 
                    "Maintenance", 
                    "Security" 
                };
            }
            
            return departments.OrderBy(d => d);
        }
    }
}
