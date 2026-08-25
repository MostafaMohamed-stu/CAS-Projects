using Elsewedy_Capstone_System.Models;

namespace Elsewedy_Capstone_System.Services.Interfaces;

public interface IStudentExtensionService
{
    Task<object> GetStudentExtensionsAsync();
    Task<object> GetStudentsWithAccountDetailsAsync();
    Task<StudentExtension?> GetStudentExtensionAsync(long id);
    Task<(StudentExtension? ext, string? error)> CreateStudentExtensionAsync(long accountId, long? classId, bool isLeader, int statusId);
    Task<(bool success, string? error)> UpdateStudentExtensionAsync(long id, long? classId, bool isLeader, int statusId);
    Task<(bool success, string? error)> DeleteStudentExtensionAsync(long id);
}
