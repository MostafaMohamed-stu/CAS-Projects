using SchoolAdmission.DTOs;
using SchoolAdmission.Models;

namespace SchoolAdmission.Repos.IRepos;
public interface IStudentRepo : IGenericRepo<Account> {

    Task<Account?> getStudentByNationalIdWithIncludeAsync(string nationalId);
    Task<bool> getStudentByEmailAsync(string email);
    Task<bool> hasStudentCompletedExamAsync(string nationalId);
    Task<string> UploadStudentDocumentAsync(string nationalId, string documentType, IFormFile file, string webRootPath);
    Task<bool> studentExistsAsync(string nationalId);
    Task<long> getStudentRoleIdAsync(string roleName);
    Task<IEnumerable<object>> getAllStudentsAsync();
    Task<IEnumerable<object>> searchStudentsByNameAsync(string query);



}

