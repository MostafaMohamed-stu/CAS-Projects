using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Constants;
using Elsewedy_Capstone_System.Services.Interfaces;

namespace Elsewedy_Capstone_System.Services;

public class AccountTaskService : IAccountTaskService
{
    private readonly SchoolDbContext _context;

    public AccountTaskService(SchoolDbContext context)
    {
        _context = context;
    }

    public async Task<object> GetStudentTasksAsync(long studentId, string role, long currentUserId)
    {
        if (currentUserId != studentId && !IsPrivileged(role))
            return new List<object>();

        var studentInfo = await _context.StudentExtensions
            .AsNoTracking()
            .Include(se => se.Class)
            .ThenInclude(c => c.Grade)
            .Where(se => se.AccountId == studentId)
            .Select(se => new
            {
                ClassId = (long?)se.ClassId,
                GradeId = se.Class != null ? se.Class.GradeId : (long?)null,
                GradeName = se.Class != null ? se.Class.Grade.GradeName : null,
                TeamId = (long?)null
            })
            .FirstOrDefaultAsync();

        var teamInfo = await (from tm in _context.TeamMembers
                              join t in _context.Teams on tm.TeamId equals t.Id
                              join c in _context.TblClasses on t.ClassId equals c.Id
                              join g in _context.Grades on c.GradeId equals g.Id
                              where tm.TeamMemberAccountId == studentId
                              select new
                              {
                                  ClassId = (long?)c.Id,
                                  GradeId = (long?)c.GradeId,
                                  GradeName = g.GradeName,
                                  TeamId = (long?)tm.TeamId
                              }).FirstOrDefaultAsync();

        if (teamInfo == null)
        {
            teamInfo = await (from t in _context.Teams
                              join c in _context.TblClasses on t.ClassId equals c.Id
                              join g in _context.Grades on c.GradeId equals g.Id
                              where t.TeamLeaderAccountId == studentId
                              select new
                              {
                                  ClassId = (long?)c.Id,
                                  GradeId = (long?)c.GradeId,
                                  GradeName = g.GradeName,
                                  TeamId = (long?)t.Id
                              }).FirstOrDefaultAsync();
        }

        if (studentInfo == null && teamInfo == null)
            return new List<object>();

        var resolvedClassId = teamInfo?.ClassId ?? studentInfo?.ClassId;
        var resolvedGradeId = teamInfo?.GradeId ?? studentInfo?.GradeId;
        var resolvedGradeName = teamInfo?.GradeName ?? studentInfo?.GradeName;
        var resolvedTeamId = teamInfo?.TeamId;

        var studentClassId = resolvedClassId ?? 0;
        var studentTeamId = resolvedTeamId ?? 0;
        var studentGradeId = resolvedGradeId ?? 0;

        var tasks = await (from t in _context.TblTasks.AsNoTracking()
            where (t.GradeId == studentGradeId && !t.ClassId.HasValue && !t.TeamId.HasValue) ||
                  (studentClassId > 0 && t.ClassId == (int)studentClassId && !t.TeamId.HasValue) ||
                  (studentTeamId > 0 && t.TeamId == (int)studentTeamId) ||
                  (t.AssignedToId == studentId)
            join w in _context.Weeks.AsNoTracking() on (long)t.WeekId equals w.Id into joinedWeeks
            from w in joinedWeeks.DefaultIfEmpty()
            select new
            {
                t.Id,
                t.TaskName,
                t.TaskDescription,
                t.TaskDeadline,
                t.StatusId,
                t.GradeId,
                t.ClassId,
                t.TeamId,
                t.AdminAccountId,
                GradeName = resolvedGradeName,
                WeekId = t.WeekId,
                WeekTitle = (w != null) ? w.WeekTitle : "Unknown Week"
            }).ToListAsync();

        if (tasks.Count == 0 && studentClassId > 0)
        {
            tasks = await (from t in _context.TblTasks.AsNoTracking()
                where (studentClassId > 0 && t.ClassId == (int)studentClassId && !t.TeamId.HasValue) ||
                      (studentTeamId > 0 && t.TeamId == (int)studentTeamId)
                join w in _context.Weeks.AsNoTracking() on (long)t.WeekId equals w.Id into joinedWeeks
                from w in joinedWeeks.DefaultIfEmpty()
                select new
                {
                    t.Id,
                    t.TaskName,
                    t.TaskDescription,
                    t.TaskDeadline,
                    t.StatusId,
                    t.GradeId,
                    t.ClassId,
                    t.TeamId,
                    t.AdminAccountId,
                    GradeName = resolvedGradeName,
                    WeekId = t.WeekId,
                    WeekTitle = (w != null) ? w.WeekTitle : "Unknown Week"
                }).ToListAsync();
        }

        var submittedTasks = await _context.TaskSubmissions
            .AsNoTracking()
            .Where(tt => tt.TeamLeaderId == studentId && tt.TaskId.HasValue)
            .Select(tt => new { TaskId = tt.TaskId!.Value, tt.StatusId })
            .ToListAsync();

        var currentUtcTime = DateTime.UtcNow;

        return tasks.Select(task =>
        {
            var submittedTask = submittedTasks.FirstOrDefault(st => st.TaskId == task.Id);
            var isLate = false;

            if (submittedTask != null)
            {
                isLate = submittedTask.StatusId == StatusConstants.TaskSubmittedLate ||
                         submittedTask.StatusId == StatusConstants.TaskCompletedLate;
            }
            else
            {
                var cairoTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
                var currentCairoTime = TimeZoneInfo.ConvertTimeFromUtc(currentUtcTime, cairoTimeZone);
                isLate = currentCairoTime > task.TaskDeadline;
            }

            return new
            {
                task.Id,
                taskName = task.TaskName,
                taskDescription = task.TaskDescription,
                taskDeadline = task.TaskDeadline,
                statusId = submittedTask != null ? StatusConstants.TaskCompleted : task.StatusId,
                task.GradeId,
                task.ClassId,
                task.TeamId,
                task.AdminAccountId,
                task.GradeName,
                task.WeekId,
                task.WeekTitle,
                isCompleted = submittedTask != null,
                completedAt = submittedTask != null ? DateTime.UtcNow : (DateTime?)null,
                isLate
            };
        });
    }

    public async Task<object> GetTasksByGradeAsync(long gradeId)
    {
        return await (from t in _context.TblTasks.AsNoTracking().Include(task => task.Grade)
            where t.GradeId == gradeId
            join w in _context.Weeks.AsNoTracking() on (long)t.WeekId equals w.Id into joinedWeeks
            from w in joinedWeeks.DefaultIfEmpty()
            select new
            {
                t.Id,
                taskName = t.TaskName,
                taskDescription = t.TaskDescription,
                t.TaskDeadline,
                t.StatusId,
                t.GradeId,
                classId = t.ClassId,
                teamId = t.TeamId,
                t.AdminAccountId,
                gradeName = t.Grade != null ? t.Grade.GradeName : "Unknown Grade",
                weekId = t.WeekId,
                weekTitle = (w != null) ? w.WeekTitle : "Unknown Week"
            }).ToListAsync();
    }

    public async Task<object> GetAllTasksAsync()
    {
        return await (from t in _context.TblTasks.AsNoTracking().Include(task => task.Grade)
            join w in _context.Weeks.AsNoTracking() on (long)t.WeekId equals w.Id into joinedWeeks
            from w in joinedWeeks.DefaultIfEmpty()
            select new
            {
                t.Id,
                taskName = t.TaskName,
                taskDescription = t.TaskDescription,
                t.TaskDeadline,
                t.GradeId,
                t.AssignedToId,
                classId = t.ClassId,
                teamId = t.TeamId,
                t.AdminAccountId,
                t.StatusId,
                gradeName = t.Grade != null ? t.Grade.GradeName : "Unknown Grade",
                weekId = t.WeekId,
                weekTitle = (w != null) ? w.WeekTitle : "Unknown Week"
            }).ToListAsync();
    }

    public async Task<(TblTask? task, string? error)> CreateTaskAsync(string taskName, string? description, DateTime deadline, long? gradeId, long? classId, long? teamId, long adminAccountId, int weekId, long? assignedToId)
    {
        var adminAccount = await _context.Accounts
            .AsNoTracking()
            .Where(a => a.Id == adminAccountId && a.IsActive)
            .FirstOrDefaultAsync();

        if (adminAccount == null)
            return (null, $"Admin account with ID {adminAccountId} not found");

        if (gradeId.HasValue && gradeId > 0)
        {
            var grade = await _context.Grades
                .AsNoTracking()
                .Where(g => g.Id == gradeId && g.StatusId == StatusConstants.GradeActive)
                .FirstOrDefaultAsync();

            if (grade == null)
                return (null, $"Grade with ID {gradeId} not found");
        }
        else if (!assignedToId.HasValue)
        {
            return (null, "Either GradeId or AssignedToId must be provided");
        }

        if (classId.HasValue)
        {
            var classExists = await _context.TblClasses
                .AsNoTracking()
                .Where(c => c.Id == classId && c.GradeId == gradeId)
                .AnyAsync();

            if (!classExists)
                return (null, $"Class not found or doesn't belong to grade");
        }

        if (teamId.HasValue)
        {
            var teamExists = await _context.Teams
                .AsNoTracking()
                .Where(t => t.Id == teamId && t.ClassId == classId)
                .AnyAsync();

            if (!teamExists)
                return (null, $"Team not found or doesn't belong to class");
        }

        var task = new TblTask
        {
            TaskName = taskName,
            TaskDescription = description,
            TaskDeadline = deadline,
            GradeId = gradeId,
            ClassId = classId.HasValue ? (int?)classId.Value : null,
            TeamId = teamId.HasValue ? (int?)teamId.Value : null,
            AdminAccountId = adminAccountId,
            WeekId = weekId,
            StatusId = StatusConstants.TaskPending,
            CreatedAt = DateOnly.FromDateTime(DateTime.UtcNow)
        };

        if (assignedToId.HasValue)
        {
            task.AssignedToId = assignedToId;
            task.AssignedById = adminAccountId;
        }

        _context.TblTasks.Add(task);
        await _context.SaveChangesAsync();

        return (task, null);
    }

    public async Task<(TblTask? task, string? error)> UpdateTaskAsync(long id, string taskName, string? description, DateTime deadline, long? gradeId, long? classId, long? teamId, long adminAccountId, int weekId, int? statusId, long? assignedToId)
    {
        var existingTask = await _context.TblTasks.FindAsync(id);
        if (existingTask == null)
            return (null, "Task not found");

        existingTask.TaskName = taskName;
        existingTask.TaskDescription = description;
        existingTask.TaskDeadline = deadline;
        existingTask.GradeId = gradeId;
        existingTask.WeekId = weekId;
        existingTask.ClassId = classId.HasValue ? (int?)classId.Value : null;
        existingTask.TeamId = teamId.HasValue ? (int?)teamId.Value : null;
        existingTask.AdminAccountId = adminAccountId;

        if (statusId.HasValue)
            existingTask.StatusId = statusId;

        if (assignedToId.HasValue)
        {
            existingTask.AssignedToId = assignedToId;
            existingTask.AssignedById = adminAccountId;
        }
        else
        {
            existingTask.AssignedToId = null;
            existingTask.AssignedById = null;
        }

        await _context.SaveChangesAsync();
        return (existingTask, null);
    }

    public async Task<(bool success, string? error)> DeleteTaskAsync(long id)
    {
        var task = await _context.TblTasks.FindAsync(id);
        if (task == null)
            return (false, "Task not found");

        var taskSubmissions = await _context.TaskSubmissions
            .Where(ts => ts.TaskId == id)
            .ToListAsync();

        if (taskSubmissions.Any())
            _context.TaskSubmissions.RemoveRange(taskSubmissions);

        _context.TblTasks.Remove(task);
        await _context.SaveChangesAsync();

        return (true, null);
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
