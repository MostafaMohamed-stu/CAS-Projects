using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Services.Interfaces;

namespace Elsewedy_Capstone_System.Services;

public class DashboardService : IDashboardService
{
    private readonly SchoolDbContext _context;

    public DashboardService(SchoolDbContext context)
    {
        _context = context;
    }

    public async Task<object> GetStudentDashboardAsync(long studentId, string role, long currentUserId)
    {
        if (!IsPrivileged(role) && currentUserId != studentId)
            return new { error = "Forbidden" };

        var student = await _context.Accounts
            .AsNoTracking()
            .Where(a => a.Id == studentId && a.IsActive)
            .Select(a => new { a.Id, a.FullNameEn, a.Email })
            .FirstOrDefaultAsync();

        if (student == null) return new { error = "Not found" };

        var studentExt = await _context.StudentExtensions
            .AsNoTracking()
            .Include(se => se.Class)
            .ThenInclude(c => c.Grade)
            .Where(se => se.AccountId == studentId)
            .Select(se => new
            {
                se.IsLeader,
                ClassId = se.ClassId,
                ClassName = se.Class != null ? se.Class.ClassName : null,
                GradeId = se.Class != null ? se.Class.GradeId : (long?)null,
                GradeName = se.Class != null ? se.Class.Grade.GradeName : null
            })
            .FirstOrDefaultAsync();

        var teamInfo = await _context.TeamMembers
            .AsNoTracking()
            .Include(tm => tm.Team)
            .ThenInclude(t => t.TeamMembers)
            .ThenInclude(m => m.TeamMemberAccount)
            .Where(tm => tm.TeamMemberAccountId == studentId)
            .Select(tm => new
            {
                TeamId = tm.TeamId,
                TeamName = tm.Team.TeamName,
                Members = tm.Team.TeamMembers
                    .Select(m => new { m.TeamMemberAccountId, Name = m.TeamMemberAccount.FullNameEn })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        long? classId = studentExt?.ClassId;
        var reviewers = new List<object>();
        if (classId != null)
        {
            reviewers = await _context.ReviewerSupervisorExtensions
                .AsNoTracking()
                .Include(r => r.Account)
                .Where(r => r.AssignedClassId == classId)
                .Select(r => (object)new { r.AccountId, Name = r.Account.FullNameEn })
                .ToListAsync();
        }

        var capstoneSupervisors = new List<object>();
        if (classId != null)
        {
            capstoneSupervisors = await _context.Teams
                .AsNoTracking()
                .Include(t => t.SupervisorAccount)
                .Where(t => t.ClassId == classId && t.SupervisorAccountId != null)
                .Select(t => (object)new { t.SupervisorAccountId, Name = t.SupervisorAccount.FullNameEn })
                .Distinct()
                .ToListAsync();
        }

        var admins = await _context.SuperAdminExtensions
            .AsNoTracking()
            .Include(sa => sa.Account)
            .Select(sa => new { sa.AccountId, Name = sa.Account.FullNameEn })
            .ToListAsync();

        long? gradeId = studentExt?.GradeId;
        var tasks = new List<object>();
        if (gradeId != null)
        {
            tasks = await _context.TblTasks
                .AsNoTracking()
                .Where(t => t.GradeId == gradeId)
                .Select(t => (object)new { t.Id, t.TaskName, t.TaskDescription, t.TaskDeadline, t.StatusId })
                .ToListAsync();
        }

        return new
        {
            Student = student,
            StudentExtension = studentExt,
            Team = teamInfo,
            Reviewers = reviewers,
            CapstoneSupervisors = capstoneSupervisors,
            Admins = admins,
            Tasks = tasks
        };
    }

    public async Task<object> GetBoardStatisticsAsync()
    {
        var totalStudents = await _context.Accounts
            .AsNoTracking()
            .Where(a => a.IsActive)
            .Join(_context.AccountRoles, a => a.Id, ar => ar.AccountId, (a, ar) => new { Account = a, AccountRole = ar })
            .Join(_context.Roles, x => x.AccountRole.RoleId, r => r.Id, (x, r) => new { x.Account, x.AccountRole, Role = r })
            .Where(joined => joined.AccountRole.BusinessEntityName == "CapstoneProject"
                && joined.Role.RoleName.ToLower() == "student")
            .CountAsync();

        var totalTeams = await _context.Teams.AsNoTracking().CountAsync();

        var totalEngineers = await _context.Accounts
            .AsNoTracking()
            .Where(a => a.IsActive)
            .Join(_context.AccountRoles, a => a.Id, ar => ar.AccountId, (a, ar) => new { Account = a, AccountRole = ar })
            .Join(_context.Roles, x => x.AccountRole.RoleId, r => r.Id, (x, r) => new { x.Account, x.AccountRole, Role = r })
            .Where(joined => joined.AccountRole.BusinessEntityName == "CapstoneProject"
                && joined.Role.RoleName.ToLower() == "engineer")
            .CountAsync();

        var totalTasks = await _context.TblTasks.AsNoTracking().CountAsync();
        var completedTasks = await _context.TblTasks.AsNoTracking().Where(t => t.StatusId == 12).CountAsync();
        var pendingTasks = await _context.TblTasks.AsNoTracking().Where(t => t.StatusId == 1).CountAsync();
        var inProgressTasks = await _context.TblTasks.AsNoTracking().Where(t => t.StatusId == 2).CountAsync();

        var completionRate = totalTasks > 0 ? Math.Round((double)completedTasks / totalTasks * 100, 2) : 0;

        return new
        {
            totalStudents,
            totalTeams,
            totalEngineers,
            totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks,
            completionRate
        };
    }

    public async Task<object> GetEngineersByClassAsync()
    {
        return await _context.ReviewerSupervisorExtensions
            .AsNoTracking()
            .Include(r => r.Account)
            .Include(r => r.AssignedClass)
                .ThenInclude(c => c.Grade)
            .Where(r => r.Account.IsActive)
            .GroupBy(r => new
            {
                ClassId = r.AssignedClassId,
                ClassName = r.AssignedClass != null ? r.AssignedClass.ClassName : "Unassigned",
                GradeName = r.AssignedClass != null && r.AssignedClass.Grade != null
                    ? r.AssignedClass.Grade.GradeName : "Unknown"
            })
            .Select(g => new
            {
                classId = g.Key.ClassId,
                className = g.Key.ClassName,
                gradeName = g.Key.GradeName,
                engineerCount = g.Count(),
                engineers = g.Select(r => new { id = r.AccountId, name = r.Account.FullNameEn, email = r.Account.Email }).ToList()
            })
            .OrderBy(x => x.gradeName)
            .ThenBy(x => x.className)
            .ToListAsync();
    }

    public async Task<object> GetTeamsProgressAsync()
    {
        return await _context.Teams
            .AsNoTracking()
            .Include(t => t.Class)
                .ThenInclude(c => c.Grade)
            .Include(t => t.TeamMembers)
            .Select(t => new
            {
                teamId = t.Id,
                teamName = t.TeamName,
                classId = t.ClassId,
                className = t.Class != null ? t.Class.ClassName : "Unknown",
                gradeName = t.Class != null && t.Class.Grade != null ? t.Class.Grade.GradeName : "Unknown",
                memberCount = t.TeamMembers.Count,
                leaderName = t.TeamLeaderAccount != null ? t.TeamLeaderAccount.FullNameEn : "No Leader",
                supervisorName = t.SupervisorAccount != null ? t.SupervisorAccount.FullNameEn : "No Supervisor"
            })
            .OrderBy(t => t.gradeName)
            .ThenBy(t => t.className)
            .ThenBy(t => t.teamName)
            .ToListAsync();
    }

    public async Task<object> GetTaskCompletionByStatusAsync()
    {
        var tasksByStatus = await _context.TblTasks
            .AsNoTracking()
            .Where(t => t.StatusId.HasValue)
            .GroupBy(t => t.StatusId.Value)
            .Select(g => new { statusId = (long)g.Key, count = g.Count() })
            .ToListAsync();

        var statusIds = tasksByStatus.Select(t => (long)t.statusId).ToList();
        var statusNames = await _context.Statuses
            .AsNoTracking()
            .Where(s => statusIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, s => s.StatusName);

        return tasksByStatus.Select(t => new
        {
            statusId = (long)t.statusId,
            statusName = statusNames.ContainsKey((long)t.statusId) ? statusNames[(long)t.statusId] : "Unknown",
            count = t.count
        }).ToList();
    }

    public async Task<object> GetTeamsByGradeAsync()
    {
        return await _context.Teams
            .AsNoTracking()
            .Include(t => t.Class)
                .ThenInclude(c => c.Grade)
            .Where(t => t.Class != null && t.Class.Grade != null)
            .GroupBy(t => new { GradeId = t.Class.GradeId, GradeName = t.Class.Grade.GradeName })
            .Select(g => new
            {
                gradeId = g.Key.GradeId,
                gradeName = g.Key.GradeName,
                teamCount = g.Count()
            })
            .OrderBy(x => x.gradeName)
            .ToListAsync();
    }

    public async Task<object> GetTeamsCompletedAllTasksAsync()
    {
        var teams = await _context.Teams
            .AsNoTracking()
            .Include(t => t.Class)
                .ThenInclude(c => c.Grade)
            .Select(t => new
            {
                teamId = t.Id,
                teamName = t.TeamName,
                classId = t.ClassId,
                gradeId = t.Class != null && t.Class.Grade != null ? (long?)t.Class.Grade.Id : null,
                gradeName = t.Class != null && t.Class.Grade != null ? t.Class.Grade.GradeName : "Unknown",
                className = t.Class != null ? t.Class.ClassName : "Unknown"
            })
            .ToListAsync();

        var result = new List<object>();

        foreach (var team in teams)
        {
            var teamIdInt = (int)team.teamId;
            var teamTasks = await _context.TblTasks
                .AsNoTracking()
                .Where(t =>
                    (t.TeamId.HasValue && t.TeamId.Value == teamIdInt) ||
                    (t.ClassId.HasValue && t.ClassId.Value == team.classId && !t.TeamId.HasValue) ||
                    (team.gradeId.HasValue && t.GradeId == team.gradeId && !t.ClassId.HasValue && !t.TeamId.HasValue)
                )
                .Select(t => t.Id)
                .ToListAsync();

            if (teamTasks.Count == 0) continue;

            var completedTasksCount = await _context.TaskSubmissions
                .AsNoTracking()
                .Where(ts =>
                    ts.TeamId == team.teamId &&
                    teamTasks.Contains(ts.TaskId.Value) &&
                    (ts.StatusId == 12 || ts.StatusId == 13)
                )
                .Select(ts => ts.TaskId.Value)
                .Distinct()
                .CountAsync();

            var allTasksCompleted = completedTasksCount == teamTasks.Count;

            result.Add(new
            {
                teamId = team.teamId,
                teamName = team.teamName,
                gradeName = team.gradeName,
                className = team.className,
                totalTasks = teamTasks.Count,
                completedTasks = completedTasksCount,
                allTasksCompleted
            });
        }

        return result;
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
