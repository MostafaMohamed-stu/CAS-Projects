using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Constants;
using Elsewedy_Capstone_System.Services.Interfaces;

namespace Elsewedy_Capstone_System.Services;

public class ReportService : IReportService
{
    private readonly SchoolDbContext _context;

    public ReportService(SchoolDbContext context)
    {
        _context = context;
    }

    public async Task<object> GetReportsAsync(string role, long userId)
    {
        var query = _context.Reports
            .AsNoTracking()
            .Include(r => r.Status)
            .Include(r => r.SubmitterAccount)
            .AsQueryable();

        if (role.Equals("Engineer", StringComparison.OrdinalIgnoreCase))
        {
            var assignedClassIds = await _context.ReviewerSupervisorExtensions
                .Where(r => r.AccountId == userId && r.AssignedClassId.HasValue)
                .Select(r => r.AssignedClassId!.Value)
                .ToListAsync();

            if (assignedClassIds.Count > 0)
            {
                query = query.Where(r =>
                    r.SubmitterAccount != null &&
                    ((r.SubmitterAccount.StudentExtension != null &&
                      r.SubmitterAccount.StudentExtension.ClassId.HasValue &&
                      assignedClassIds.Contains(r.SubmitterAccount.StudentExtension.ClassId.Value))
                     ||
                     r.SubmitterAccount.TeamMembers.Any(tm =>
                         assignedClassIds.Contains(tm.Team.ClassId)))
                );
            }
            else
            {
                return new List<Report>();
            }
        }
        else if (!IsPrivileged(role))
        {
            query = query.Where(r => r.SubmitterAccountId == userId);
        }

        return await query.OrderByDescending(r => r.SubmissionDate).ToListAsync();
    }

    public async Task<object> GetReportAsync(long id, string role, long userId)
    {
        var report = await _context.Reports
            .AsNoTracking()
            .Include(r => r.Status)
            .Include(r => r.SubmitterAccount)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (report == null)
            return new { error = "Report not found" };

        if (!IsPrivileged(role) && report.SubmitterAccountId != userId)
            return new { error = "Forbidden" };

        return report;
    }

    public async Task<object> GetReportsByUserAsync(long submitterAccountId, string role, long userId)
    {
        if (!IsPrivileged(role) && userId != submitterAccountId)
            return new List<object>();

        return await _context.Reports
            .AsNoTracking()
            .Include(r => r.Status)
            .Include(r => r.SubmitterAccount)
            .Where(r => r.SubmitterAccountId == submitterAccountId)
            .OrderByDescending(r => r.SubmissionDate)
            .ToListAsync();
    }

    public async Task<(object? result, string? error)> CreateReportAsync(string title, string reportMessage, long submitterAccountId, int statusId)
    {
        if (string.IsNullOrWhiteSpace(title))
            return (null, "Report title is required");

        if (string.IsNullOrWhiteSpace(reportMessage))
            return (null, "Report message is required");

        if (submitterAccountId <= 0)
            return (null, "Valid submitter account ID is required");

        var newReport = new Report
        {
            Title = title,
            ReportMessage = reportMessage,
            SubmitterAccountId = submitterAccountId,
            StatusId = statusId > 0 ? statusId : StatusConstants.GetDefaultReportStatus(),
            SubmissionDate = DateTime.UtcNow
        };

        _context.Reports.Add(newReport);
        await _context.SaveChangesAsync();

        return (newReport, null);
    }

    public async Task<(bool success, string? error)> UpdateReportAsync(long id, string title, string reportMessage, int statusId, long userId, string role)
    {
        var existingReport = await _context.Reports.FindAsync(id);
        if (existingReport == null)
            return (false, "Report not found");

        if (!IsPrivileged(role) && existingReport.SubmitterAccountId != userId)
            return (false, "Forbidden");

        existingReport.Title = title;
        existingReport.ReportMessage = reportMessage;
        existingReport.StatusId = statusId;

        try
        {
            await _context.SaveChangesAsync();
            return (true, null);
        }
        catch
        {
            return (false, "Error updating report");
        }
    }

    public async Task<(bool success, string? error)> DeleteReportAsync(long id, long userId, string role)
    {
        var report = await _context.Reports.FindAsync(id);
        if (report == null)
            return (false, "Report not found");

        if (!IsPrivileged(role) && report.SubmitterAccountId != userId)
            return (false, "Forbidden");

        _context.Reports.Remove(report);
        await _context.SaveChangesAsync();

        return (true, null);
    }

    public async Task<bool> ReportExistsAsync(long id)
    {
        return await _context.Reports.AnyAsync(e => e.Id == id);
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
