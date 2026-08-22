using SchoolAdmission.DTOs;
using SchoolAdmission.Models;

namespace SchoolAdmission.Repos.IRepos;

public interface IAuthRepo
{
    Task<Login?> isValidLoginWithInclude(string email, string password);
    Task<long> CreateReceptionCoordinatorAccount(CreateReceptionCoordinatorDTO dto);
    Task<long> CreateInterviewerAccount(CreateInterviewerDTO dto);
    Task<long> CreateSuperAdminAccount(CreateSuperAdminDTO dto);
    Task<long> CreateBoardAccount(CreateBoardDTO dto);
    Task<long> CreateStudentAffairAccount(CreateStudentAffairDTO dto);
    Task<bool> IsSuperAdminAsync(string email);
    Task<bool> IsBoardAsync(string email);
    Task<bool> IsAdminAsync(string email);
    Task<bool> IsInterviewerAsync(string email);
    Task<bool> IsReceptionCoordinatorAsync(string email);
    Task<bool> IsStudentAffairAsync(string email);
    Task<bool> IsApplicantAsync(long accountId);
    Task<Role?> GetEffectiveRoleAsync(long accountId);
    Task<string?> GetEffectiveRoleNameAsync(long accountId);
    Task<bool> HasRoleAsync(long accountId, string roleName);
    Task<bool> HasAnyRoleAsync(long accountId, params string[] roleNames);
    Task<string?> GetEffectiveRoleNameForLoginAsync(long accountId);
    Task<List<long>> GetAccountIdsByRoleAsync(string roleName);

    Task<string> GenerateJwtTokenAsync(Account account);


}