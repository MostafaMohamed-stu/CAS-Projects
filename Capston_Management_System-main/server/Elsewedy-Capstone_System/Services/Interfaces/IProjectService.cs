using Elsewedy_Capstone_System.Models;

namespace Elsewedy_Capstone_System.Services.Interfaces;

public interface IProjectService
{
    Task<Project?> GetMyTeamProjectAsync(long userId);
    Task<Project?> GetProjectByTeamAsync(long teamId);
    Task<(Project? project, string? error)> UpsertMyTeamProjectAsync(long userId, string role, string? nameEn, string? nameAr, string? companyName, string? additionalInfo, string? projectDescription, int statusId);
}
