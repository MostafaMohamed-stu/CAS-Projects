using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Constants;
using Elsewedy_Capstone_System.Services.Interfaces;

namespace Elsewedy_Capstone_System.Services;

public class TaskSubmissionService : ITaskSubmissionService
{
    private readonly SchoolDbContext _context;

    public TaskSubmissionService(SchoolDbContext context)
    {
        _context = context;
    }

    public async Task<object> GetTaskSubmissionsAsync(string role, long userId)
    {
        var submissionsQuery = _context.TaskSubmissions.AsNoTracking();

        if (!IsPrivileged(role))
        {
            var userTeamIds = await _context.TeamMembers
                .Where(tm => tm.TeamMemberAccountId == userId)
                .Select(tm => tm.TeamId)
                .Distinct()
                .ToListAsync();

            submissionsQuery = submissionsQuery.Where(s => userTeamIds.Contains(s.TeamId));
        }

        var list = await submissionsQuery
            .Select(s => new
            {
                TaskSubmissionId = s.TaskSubmissionId,
                TeamId = s.TeamId,
                TeamLeaderId = s.TeamLeaderId,
                TeamLeaderName = _context.Accounts
                    .AsNoTracking()
                    .Where(a => a.Id == s.TeamLeaderId)
                    .Select(a => a.FullNameEn)
                    .FirstOrDefault(),
                GradeId = s.GradeId,
                TaskId = s.TaskId,
                Glink = s.Glink,
                Note = s.Note,
                Feedback = s.Feedback,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt,
                StatusId = s.StatusId,
                TaskDeadline = _context.TblTasks
                    .AsNoTracking()
                    .Where(t => t.Id == s.TaskId)
                    .Select(t => t.TaskDeadline)
                    .FirstOrDefault()
            })
            .ToListAsync();

        return list.Select(item => new
        {
            item.TaskSubmissionId,
            item.TeamId,
            item.TeamLeaderId,
            item.TeamLeaderName,
            item.GradeId,
            item.TaskId,
            item.Glink,
            item.Note,
            item.Feedback,
            item.CreatedAt,
            item.UpdatedAt,
            item.StatusId,
            item.TaskDeadline,
            isLate = item.StatusId == StatusConstants.TaskSubmittedLate || item.StatusId == StatusConstants.TaskCompletedLate
        }).ToList();
    }

    public async Task<TaskSubmission?> GetTaskSubmissionAsync(int id, string role, long userId)
    {
        var submission = await _context.TaskSubmissions.AsNoTracking().FirstOrDefaultAsync(s => s.TaskSubmissionId == id);

        if (submission == null) return null;

        if (!IsPrivileged(role))
        {
            var isMember = await _context.TeamMembers.AnyAsync(tm => tm.TeamId == submission.TeamId && tm.TeamMemberAccountId == userId);
            if (!isMember) return null;
        }

        return submission;
    }

    public async Task<(TaskSubmission? submission, object? result, string? error)> CreateSubmissionAsync(long teamId, long userId, string role, long taskId, string? glink, string? note)
    {
        var currentUtcTime = DateTime.UtcNow;
        var task = await _context.TblTasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null) return (null, null, "Task not found");

        var cairoTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
        var currentCairoTime = TimeZoneInfo.ConvertTimeFromUtc(currentUtcTime, cairoTimeZone);
        var isLate = currentCairoTime > task.TaskDeadline;
        var submissionStatus = StatusConstants.GetTaskSubmissionStatus(isLate);

        if (!IsPrivileged(role))
        {
            var isMember = await _context.TeamMembers.AnyAsync(tm => tm.TeamId == teamId && tm.TeamMemberAccountId == userId);
            if (!isMember) return (null, null, "Forbidden");
        }

        var existingSubmission = await _context.TaskSubmissions
            .FirstOrDefaultAsync(s => s.TaskId == taskId && s.TeamId == teamId);

        if (existingSubmission != null)
        {
            existingSubmission.Glink = glink;
            existingSubmission.Note = note;
            existingSubmission.StatusId = submissionStatus;
            existingSubmission.Feedback = null;
            existingSubmission.UpdatedAt = currentUtcTime;

            await _context.SaveChangesAsync();

            return (existingSubmission, new
            {
                message = isLate ? "Task resubmitted late" : "Task resubmitted successfully",
                submissionId = existingSubmission.TaskSubmissionId,
                isLate,
                submittedAt = currentUtcTime,
                deadline = task.TaskDeadline,
                timeDifference = currentUtcTime - task.TaskDeadline
            }, null);
        }
        else
        {
            var gradeId = task.GradeId ?? await _context.Teams.AsNoTracking()
                .Where(t => t.Id == teamId)
                .Join(_context.TblClasses.AsNoTracking(), t => t.ClassId, c => c.Id, (t, c) => c.GradeId)
                .FirstOrDefaultAsync();

            if (gradeId == 0) return (null, null, "Could not determine GradeId for submission. Task has no GradeId and team has no associated class/grade.");

            var submission = new TaskSubmission
            {
                TeamId = teamId,
                TeamLeaderId = userId,
                GradeId = gradeId,
                TaskId = taskId,
                Glink = glink,
                Note = note,
                CreatedAt = currentUtcTime,
                UpdatedAt = currentUtcTime,
                StatusId = submissionStatus
            };

            _context.TaskSubmissions.Add(submission);
            await _context.SaveChangesAsync();

            return (submission, new
            {
                submission = submission,
                isLate,
                submittedAt = currentUtcTime,
                deadline = task.TaskDeadline,
                timeDifference = currentUtcTime - task.TaskDeadline
            }, null);
        }
    }

    public async Task<(bool success, object? result, string? error)> MarkReviewedAsync(int id, string? feedback, string role, long userId)
    {
        var submission = await _context.TaskSubmissions.FirstOrDefaultAsync(s => s.TaskSubmissionId == id);
        if (submission == null) return (false, null, "Not found");

        var currentUtcTime = DateTime.UtcNow;
        var isCompletedLate = submission.StatusId == StatusConstants.TaskSubmittedLate;
        var completionStatus = StatusConstants.GetTaskCompletionStatus(isCompletedLate);

        submission.StatusId = completionStatus;
        if (!string.IsNullOrWhiteSpace(feedback))
            submission.Feedback = feedback;
        submission.UpdatedAt = currentUtcTime;

        var task = await _context.TblTasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == submission.TaskId);
        if (task != null && submission.TaskId.HasValue)
        {
            task.StatusId = completionStatus;
        }

        await _context.SaveChangesAsync();

        return (true, new
        {
            message = isCompletedLate ? "Marked reviewed (completed late)" : "Marked reviewed",
            submissionId = submission.TaskSubmissionId,
            isCompletedLate,
            completedAt = currentUtcTime,
            deadline = task?.TaskDeadline,
            timeDifference = task != null ? currentUtcTime - task.TaskDeadline : TimeSpan.Zero
        }, null);
    }

    public async Task<(bool success, string? error)> RejectTaskAsync(int id)
    {
        var submission = await _context.TaskSubmissions.FirstOrDefaultAsync(s => s.TaskSubmissionId == id);
        if (submission == null) return (false, "Not found");

        submission.StatusId = StatusConstants.TaskRejected;
        submission.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool success, string? error)> AddFeedbackAsync(int id, string? feedback)
    {
        var submission = await _context.TaskSubmissions.FirstOrDefaultAsync(s => s.TaskSubmissionId == id);
        if (submission == null) return (false, "Not found");

        if (!string.IsNullOrWhiteSpace(feedback))
        {
            submission.Feedback = feedback;
            submission.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return (true, null);
    }

    public async Task<(bool success, string? error)> UpdateSubmissionAsync(int id, long teamId, long userId, string role, string? glink, string? note, int statusId)
    {
        var submission = await _context.TaskSubmissions.FindAsync(id);
        if (submission == null) return (false, "Not found");

        if (!IsPrivileged(role))
        {
            var isMember = await _context.TeamMembers.AnyAsync(tm => tm.TeamId == submission.TeamId && tm.TeamMemberAccountId == userId);
            if (!isMember) return (false, "Forbidden");
        }

        submission.Glink = glink;
        submission.Note = note;
        submission.StatusId = statusId;
        submission.UpdatedAt = DateTime.UtcNow;

        _context.Entry(submission).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return (true, null);
    }

    public async Task<(bool success, string? error)> DeleteSubmissionAsync(int id, long userId, string role)
    {
        var submission = await _context.TaskSubmissions.FindAsync(id);
        if (submission == null) return (false, "Not found");

        if (!IsPrivileged(role))
        {
            var isMember = await _context.TeamMembers.AnyAsync(tm => tm.TeamId == submission.TeamId && tm.TeamMemberAccountId == userId);
            if (!isMember) return (false, "Forbidden");
        }

        _context.TaskSubmissions.Remove(submission);
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
