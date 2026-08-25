using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Services.Interfaces;

namespace Elsewedy_Capstone_System.Services;

public class TeamService : ITeamService
{
    private readonly SchoolDbContext _context;

    public TeamService(SchoolDbContext context)
    {
        _context = context;
    }

    public async Task<object> GetTeamsAsync(string role, long? userId)
    {
        var teamsQuery = _context.Teams
            .AsNoTracking()
            .Include(t => t.SupervisorAccount)
            .Include(t => t.TeamLeaderAccount)
            .Include(t => t.Class)
            .ThenInclude(c => c.Grade)
            .AsQueryable();

        if (!IsPrivileged(role))
        {
            if (!userId.HasValue) return new List<object>();

            var gradeId = await _context.StudentExtensions
                .AsNoTracking()
                .Include(se => se.Class)
                .Where(se => se.AccountId == userId.Value)
                .Select(se => se.Class != null ? (long?)se.Class.GradeId : null)
                .FirstOrDefaultAsync();

            if (gradeId.HasValue)
                teamsQuery = teamsQuery.Where(t => t.Class != null && t.Class.GradeId == gradeId.Value);
            else
                return new List<object>();
        }

        return await teamsQuery.Select(t => new
        {
            id = t.Id,
            teamName = t.TeamName,
            classId = t.ClassId,
            className = t.Class != null ? t.Class.ClassName : null,
            gradeId = t.Class != null && t.Class.Grade != null ? (long?)t.Class.Grade.Id : null,
            gradeName = t.Class != null && t.Class.Grade != null ? t.Class.Grade.GradeName : null,
            supervisorAccountId = t.SupervisorAccountId,
            supervisorName = t.SupervisorAccount != null ? t.SupervisorAccount.FullNameEn : null,
            teamLeaderAccountId = t.TeamLeaderAccountId,
            teamLeaderName = t.TeamLeaderAccount != null ? t.TeamLeaderAccount.FullNameEn : null
        }).ToListAsync();
    }

    public async Task<object> GetTeamAsync(long id, string role, long? userId)
    {
        var teamQuery = _context.Teams
            .AsNoTracking()
            .Include(t => t.SupervisorAccount)
            .Include(t => t.TeamLeaderAccount)
            .Include(t => t.Class)
            .ThenInclude(c => c.Grade)
            .Where(t => t.Id == id)
            .AsQueryable();

        if (!IsPrivileged(role))
        {
            if (!userId.HasValue) return new { error = "Not found" };

            var gradeId = await _context.StudentExtensions
                .AsNoTracking()
                .Include(se => se.Class)
                .Where(se => se.AccountId == userId.Value)
                .Select(se => se.Class != null ? (long?)se.Class.GradeId : null)
                .FirstOrDefaultAsync();

            if (gradeId.HasValue)
                teamQuery = teamQuery.Where(t => t.Class != null && t.Class.GradeId == gradeId.Value);
            else
                return new { error = "Not found" };
        }

        var result = await teamQuery
            .Include(t => t.TeamMembers)
                .ThenInclude(tm => tm.TeamMemberAccount)
            .Select(t => (object)new
            {
                t.Id,
                t.TeamName,
                t.ClassId,
                ClassName = t.Class != null ? t.Class.ClassName : null,
                GradeName = t.Class != null && t.Class.Grade != null ? t.Class.Grade.GradeName : null,
                SupervisorAccountId = t.SupervisorAccountId,
                SupervisorName = t.SupervisorAccount != null ? t.SupervisorAccount.FullNameEn : null,
                TeamLeaderAccountId = t.TeamLeaderAccountId,
                TeamLeaderName = t.TeamLeaderAccount != null ? t.TeamLeaderAccount.FullNameEn : null,
                TeamMembers = t.TeamMembers.Select(tm => new
                {
                    TeamMemberAccountId = tm.TeamMemberAccountId,
                    FullNameEn = tm.TeamMemberAccount != null ? tm.TeamMemberAccount.FullNameEn : null,
                    Email = tm.TeamMemberAccount != null ? tm.TeamMemberAccount.Email : null,
                    IsLeader = tm.TeamMemberAccountId == t.TeamLeaderAccountId
                }).ToList()
            })
            .FirstOrDefaultAsync();
        
        return result ?? new { error = "Not found" };
    }

    public async Task<object?> GetTeamByLeaderAsync(long leaderAccountId, string role, long currentUserId)
    {
        if (currentUserId != leaderAccountId && !IsPrivileged(role))
            return null;

        return await _context.Teams
            .AsNoTracking()
            .Include(t => t.SupervisorAccount)
            .Include(t => t.TeamLeaderAccount)
            .Include(t => t.Class)
            .Where(t => t.TeamLeaderAccountId == leaderAccountId)
            .Select(t => new
            {
                t.Id,
                t.TeamName,
                t.ClassId,
                ClassName = t.Class != null ? t.Class.ClassName : null,
                SupervisorAccountId = t.SupervisorAccountId,
                SupervisorName = t.SupervisorAccount != null ? t.SupervisorAccount.FullNameEn : null,
                TeamLeaderAccountId = t.TeamLeaderAccountId,
                TeamLeaderName = t.TeamLeaderAccount != null ? t.TeamLeaderAccount.FullNameEn : null
            })
            .FirstOrDefaultAsync();
    }

    public async Task<object> GetTeamMembersAsync()
    {
        return await _context.TeamMembers
            .AsNoTracking()
            .Include(tm => tm.Team)
                .ThenInclude(t => t.Class)
            .Include(tm => tm.TeamMemberAccount)
            .Select(tm => new
            {
                tm.Id,
                tm.TeamId,
                tm.TeamMemberAccountId,
                tm.TeamMemberDescription,
                TeamName = tm.Team.TeamName,
                MemberName = tm.TeamMemberAccount.FullNameEn,
                MemberEmail = tm.TeamMemberAccount.Email,
                MemberNationalId = tm.TeamMemberAccount.NationalId,
                ClassId = (long?)tm.Team.ClassId,
                GradeId = (long?)tm.Team.Class.GradeId
            })
            .ToListAsync();
    }

    public async Task<(TeamMember? member, string? error)> CreateTeamMemberAsync(long teamId, long accountId, string? description, int statusId)
    {
        var team = await _context.Teams.FindAsync(teamId);
        if (team == null) return (null, "Team not found");

        var account = await _context.Accounts.FindAsync(accountId);
        if (account == null) return (null, "Account not found");

        var existingMember = await _context.TeamMembers
            .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.TeamMemberAccountId == accountId);
        if (existingMember != null) return (null, "Already a member");

        var teamMember = new TeamMember
        {
            TeamId = teamId,
            TeamMemberAccountId = accountId,
            TeamMemberDescription = description,
            StatusId = statusId
        };

        _context.TeamMembers.Add(teamMember);
        await _context.SaveChangesAsync();

        return (teamMember, null);
    }

    public async Task<(bool success, string? error)> DeleteTeamMemberAsync(long id)
    {
        var teamMember = await _context.TeamMembers.FindAsync(id);
        if (teamMember == null) return (false, "Not found");

        _context.TeamMembers.Remove(teamMember);
        await _context.SaveChangesAsync();

        return (true, null);
    }

    public async Task<(bool success, string? error)> AssignTeamLeaderAsync(long teamId, long leaderId)
    {
        var team = await _context.Teams.FindAsync(teamId);
        if (team == null) return (false, "Team not found");

        var leaderAccount = await _context.Accounts.FindAsync(leaderId);
        if (leaderAccount == null) return (false, "Leader account not found");

        var isMember = await _context.TeamMembers
            .AnyAsync(tm => tm.TeamId == teamId && tm.TeamMemberAccountId == leaderId);
        if (!isMember) return (false, "Not a team member");

        if (team.TeamLeaderAccountId.HasValue)
        {
            var prevLeaderExt = await _context.StudentExtensions
                .FirstOrDefaultAsync(se => se.AccountId == team.TeamLeaderAccountId.Value);
            if (prevLeaderExt != null)
            {
                prevLeaderExt.IsLeader = false;
                _context.StudentExtensions.Update(prevLeaderExt);
            }
        }

        team.TeamLeaderAccountId = leaderId;
        _context.Teams.Update(team);

        var studentExt = await _context.StudentExtensions
            .FirstOrDefaultAsync(se => se.AccountId == leaderId);
        if (studentExt != null)
        {
            studentExt.IsLeader = true;
            _context.StudentExtensions.Update(studentExt);
        }

        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<object> GetTeamsWithDetailsAsync()
    {
        var teams = await _context.Teams
            .AsNoTracking()
            .Include(t => t.SupervisorAccount)
            .Include(t => t.TeamLeaderAccount)
            .Include(t => t.Class)
            .Include(t => t.TeamMembers)
                .ThenInclude(tm => tm.TeamMemberAccount)
            .ToListAsync();

        return teams.Select(team => (object)new
        {
            Team = new
            {
                id = team.Id,
                teamName = team.TeamName,
                classId = team.ClassId,
                className = team.Class?.ClassName ?? "No Class",
                gradeId = team.Class?.GradeId,
                supervisorAccountId = team.SupervisorAccountId,
                supervisorName = team.SupervisorAccount?.FullNameEn ?? "No Supervisor",
                teamLeaderAccountId = team.TeamLeaderAccountId,
                teamLeaderName = team.TeamLeaderAccount?.FullNameEn ?? "No Leader"
            },
            Members = team.TeamMembers?.Select(tm => (object)new
            {
                id = tm.Id,
                teamMemberAccountId = tm.TeamMemberAccountId,
                teamMemberDescription = tm.TeamMemberDescription ?? "",
                memberName = tm.TeamMemberAccount?.FullNameEn ?? "Unknown",
                memberEmail = tm.TeamMemberAccount?.Email ?? "",
                memberNationalId = tm.TeamMemberAccount?.NationalId ?? ""
            }).ToList() ?? new List<object>(),
            Tasks = new List<object>(),
            TotalTasks = 0,
            CompletedTasks = 0,
            InProgressTasks = 0,
            PendingTasks = 0
        }).ToList();
    }

    public async Task<object> GetTeamsByEngineerAsync(long engineerAccountId, string role, long currentUserId)
    {
        if (currentUserId != engineerAccountId && !IsPrivileged(role))
            return new List<object>();

        var assignedClasses = await _context.ReviewerSupervisorExtensions
            .AsNoTracking()
            .Where(r => r.AccountId == engineerAccountId && r.AssignedClassId.HasValue)
            .Select(r => r.AssignedClassId.Value)
            .ToListAsync();

        if (!assignedClasses.Any())
            return new List<object>();

        return await _context.Teams
            .AsNoTracking()
            .Include(t => t.SupervisorAccount)
            .Include(t => t.TeamLeaderAccount)
            .Include(t => t.Class)
                .ThenInclude(c => c.Grade)
            .Where(t => assignedClasses.Contains(t.ClassId))
            .Select(t => new
            {
                id = t.Id,
                teamName = t.TeamName,
                classId = t.ClassId,
                className = t.Class != null ? t.Class.ClassName : null,
                gradeId = t.Class != null ? t.Class.GradeId : (long?)null,
                gradeName = t.Class != null && t.Class.Grade != null ? t.Class.Grade.GradeName : null,
                supervisorAccountId = t.SupervisorAccountId,
                supervisorName = t.SupervisorAccount != null ? t.SupervisorAccount.FullNameEn : null,
                teamLeaderAccountId = t.TeamLeaderAccountId,
                teamLeaderName = t.TeamLeaderAccount != null ? t.TeamLeaderAccount.FullNameEn : null,
                statusId = t.StatusId
            })
            .ToListAsync();
    }

    public async Task<(Team? team, string? error)> CreateTeamAsync(string teamName, long classId)
    {
        if (string.IsNullOrEmpty(teamName)) return (null, "Team name required");
        if (classId <= 0) return (null, "Valid class ID required");

        var classExists = await _context.TblClasses.AnyAsync(c => c.Id == classId);
        if (!classExists) return (null, "Class not found");

        var team = new Team
        {
            TeamName = teamName,
            ClassId = classId,
            StatusId = 1,
            SupervisorAccountId = null,
            TeamLeaderAccountId = null
        };

        _context.Teams.Add(team);
        await _context.SaveChangesAsync();

        return (team, null);
    }

    public async Task<(bool success, string? error)> UpdateTeamAsync(long id, string teamName, long classId, long? supervisorId, long? leaderId)
    {
        var team = await _context.Teams.FindAsync(id);
        if (team == null) return (false, "Team not found");

        team.TeamName = teamName;
        team.ClassId = classId;
        team.SupervisorAccountId = supervisorId;
        team.TeamLeaderAccountId = leaderId;

        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool success, string? error)> DeleteTeamAsync(long id)
    {
        var team = await _context.Teams.FindAsync(id);
        if (team == null) return (false, "Team not found");

        var teamMembers = await _context.TeamMembers.Where(tm => tm.TeamId == id).ToListAsync();
        if (teamMembers.Any())
        {
            _context.TeamMembers.RemoveRange(teamMembers);
            await _context.SaveChangesAsync();
        }

        var submissions = await _context.TaskSubmissions.Where(ts => ts.TeamId == id).ToListAsync();
        if (submissions.Any())
        {
            _context.TaskSubmissions.RemoveRange(submissions);
            await _context.SaveChangesAsync();
        }

        _context.Teams.Remove(team);
        await _context.SaveChangesAsync();

        return (true, null);
    }

    public async Task<object> GetEngineerAssignmentsAsync()
    {
        return await _context.ReviewerSupervisorExtensions
            .AsNoTracking()
            .Include(r => r.Account)
            .Include(r => r.AssignedClass)
                .ThenInclude(c => c.Grade)
            .Where(r => r.AssignedClassId.HasValue && r.Account.IsActive)
            .Select(r => new
            {
                accountId = r.AccountId,
                accountName = r.Account.FullNameEn,
                accountEmail = r.Account.Email,
                assignedClassId = r.AssignedClassId.Value,
                className = r.AssignedClass.ClassName,
                gradeName = r.AssignedClass.Grade != null ? r.AssignedClass.Grade.GradeName : "Unknown Grade",
                statusId = r.StatusId,
                isActive = r.Account.IsActive
            })
            .ToListAsync();
    }

    private static bool IsPrivileged(string role)
    {
        if (string.IsNullOrWhiteSpace(role)) return false;
        role = role.Replace(" ", string.Empty, StringComparison.OrdinalIgnoreCase);
        return role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase)
            || role.Equals("Board", StringComparison.OrdinalIgnoreCase)
            || role.Equals("StaffAdmin", StringComparison.OrdinalIgnoreCase)
            || role.Equals("Engineer", StringComparison.OrdinalIgnoreCase)
            || role.Equals("CapstoneLead", StringComparison.OrdinalIgnoreCase);
    }
}
