using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Services.Interfaces;

namespace Elsewedy_Capstone_System.Services;

public class ProjectService : IProjectService
{
    private readonly SchoolDbContext _context;

    public ProjectService(SchoolDbContext context)
    {
        _context = context;
    }

    public async Task<Project?> GetMyTeamProjectAsync(long userId)
    {
        return await _context.Teams
            .AsNoTracking()
            .Include(t => t.Project)
            .Where(t => t.TeamMembers.Any(m => m.TeamMemberAccountId == userId))
            .Select(t => t.Project)
            .FirstOrDefaultAsync();
    }

    public async Task<Project?> GetProjectByTeamAsync(long teamId)
    {
        return await _context.Teams
            .AsNoTracking()
            .Include(t => t.Project)
            .Where(t => t.Id == teamId)
            .Select(t => t.Project)
            .FirstOrDefaultAsync();
    }

    public async Task<(Project? project, string? error)> UpsertMyTeamProjectAsync(long userId, string role, string? nameEn, string? nameAr, string? companyName, string? additionalInfo, string? projectDescription, int statusId)
    {
        var isPrivileged = role.Replace(" ", string.Empty, StringComparison.OrdinalIgnoreCase).Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase)
            || role.Replace(" ", string.Empty, StringComparison.OrdinalIgnoreCase).Equals("Board", StringComparison.OrdinalIgnoreCase)
            || role.Replace(" ", string.Empty, StringComparison.OrdinalIgnoreCase).Equals("StaffAdmin", StringComparison.OrdinalIgnoreCase)
            || role.Replace(" ", string.Empty, StringComparison.OrdinalIgnoreCase).Equals("Engineer", StringComparison.OrdinalIgnoreCase)
            || role.Replace(" ", string.Empty, StringComparison.OrdinalIgnoreCase).Equals("CapstoneLead", StringComparison.OrdinalIgnoreCase);

        var myTeam = await _context.Teams
            .Include(t => t.TeamMembers)
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.TeamMembers.Any(m => m.TeamMemberAccountId == userId));

        if (myTeam == null)
            return (null, "No team found");

        var isLeader = myTeam.TeamLeaderAccountId == userId;
        if (!isLeader && !isPrivileged)
            return (null, "Not authorized");

        if (myTeam.Project == null)
        {
            long supervisorId;
            if (myTeam.SupervisorAccountId != null && myTeam.SupervisorAccountId > 0)
            {
                supervisorId = myTeam.SupervisorAccountId.Value;
            }
            else
            {
                var defaultSupervisor = await _context.Accounts
                    .Where(a => a.IsActive && a.StatusId == 1)
                    .FirstOrDefaultAsync();

                if (defaultSupervisor == null)
                    return (null, "No supervisor available");

                supervisorId = defaultSupervisor.Id;
            }

            var newProject = new Project
            {
                NameEn = nameEn ?? string.Empty,
                NameAr = nameAr,
                CompanyName = companyName ?? string.Empty,
                AdditionalInformation = additionalInfo,
                DateOfCreation = DateTime.UtcNow,
                ProjectDescription = projectDescription ?? string.Empty,
                SupervisorAccountId = supervisorId,
                StatusId = statusId == 0 ? 1 : statusId
            };

            _context.Projects.Add(newProject);
            await _context.SaveChangesAsync();

            myTeam.ProjectId = newProject.Id;
            await _context.SaveChangesAsync();

            return (newProject, null);
        }
        else
        {
            myTeam.Project.NameEn = nameEn ?? myTeam.Project.NameEn;
            myTeam.Project.NameAr = nameAr ?? myTeam.Project.NameAr;
            myTeam.Project.CompanyName = companyName ?? myTeam.Project.CompanyName;
            myTeam.Project.ProjectDescription = projectDescription ?? myTeam.Project.ProjectDescription;
            myTeam.Project.AdditionalInformation = additionalInfo ?? myTeam.Project.AdditionalInformation;
            await _context.SaveChangesAsync();

            return (myTeam.Project, null);
        }
    }
}
