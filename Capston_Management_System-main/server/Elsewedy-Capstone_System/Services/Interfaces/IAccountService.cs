namespace Elsewedy_Capstone_System.Services.Interfaces;

public interface IAccountService
{
    Task<object> GetCapstoneRolesAsync();
    Task<(object? result, string? error)> CreateStaffAdminAccountAsync(string fullNameEn, string? fullNameAr, string email, string password, string? phone, string roleName, long? classId);
    Task<(object? result, string? error)> CreateSimpleAccountAsync(string fullNameEn, string fullNameAr, string email, string password, string? phone, string? nationalId, long? roleId, string? roleName, long? classId, string callerRole);
    Task<object> GetLoginStatusAsync(string clientIp);
    Task<(object? result, string? error)> LoginAsync(string email, string password);
    Task<(object? result, string? error)> RefreshAsync(string? refreshToken);
    Task<bool> LogoutAsync();
    Task<object> GetAllAccountsForStaffAdminAsync();
    Task<object?> GetCurrentUserAsync(long accountId);
    Task<object?> GetAccountAsync(long id);
    Task<object> GetAccountsByRoleNameAsync(string roleName);
    Task<object> GetReviewersByClassAsync(long classId);
    Task<object> GetCapstoneSupervisorsAsync();
    Task<(bool success, string? error)> AssignEngineerToClassAsync(long accountId, long classId);
    Task<(bool success, string? error)> AssignReviewerToClassAsync(long accountId, long classId);
    Task<(bool success, string? error)> RemoveAssignmentAsync(long accountId);
    Task<(bool success, string? error)> UpdateAccountAsync(long id, string fullNameEn, string? fullNameAr, string email, string? phone, string roleName, long? classId, string? password);
    Task<(bool success, string? error)> DeleteAccountAsync(long id);
    Task<(object? result, string? error)> CreateTestEngineersAsync();
    Task<object> GetUnregisteredStudentsAsync();
    Task<object> CheckStudentAsync(long accountId);
    Task<object> GetUnregisteredStudentsTestAsync();
    Task<(int added, int skipped, string? error)> AddStudentsToCapstoneAsync(List<long> studentIds);
    Task<object> GetAllAccountsAsync(int? page, int? pageSize, string? search);
    Task<object> GetAllRolesAsync();
    Task<object> GetBusinessEntitiesAsync();
    Task<(int added, int skipped, string? error)> AddRolesToAccountsAsync(List<long> accountIds, string roleName, string businessEntityName);
}
