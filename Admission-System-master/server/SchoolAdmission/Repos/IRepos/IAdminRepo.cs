using SchoolAdmission.DTOs;
using SchoolAdmission.Models;
using System.Security.Claims;

namespace SchoolAdmission.Repos.IRepos;

public interface IAdminRepo
{
    Task<List<dynamic>> GetStudentsForAdminAsync(string adminEmail);
    Task<List<dynamic>> GetStudentsForSuperAdminAsync(string superAdminEmail, DateOnly? fromDate = null, DateOnly? toDate = null);
    Task<PaginationResponseDTO<dynamic>> GetStudentsForAdminPaginatedAsync(string adminEmail, PaginationRequestDTO request);
    Task<PaginationResponseDTO<dynamic>> GetStudentsForSuperAdminPaginatedAsync(string superAdminEmail, PaginationRequestDTO request);
    Task<List<Account>> FilterStudentsAsync(string? name, string? nationalId);
    Task<bool> SetInterviewScoreAsync(long studentId, long adminId, double score);
    Task<bool> UpdateStudentStatusAsync(long studentId, string status);
    Task<int> GetExamTotalAsync(StudentExamResult? examResults);
    Task<string> GetCurrentAdminEmailAsync(ClaimsPrincipal user);
    Task<Account?> GetAccountByEmailAsync(string email);
}

