using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AttendanceBehaviour_Backend.Data;
using AttendanceBehaviour_Backend.Interfaces;
using AttendanceBehaviour_Backend.Models;

namespace AttendanceBehaviour_Backend.Repos
{
    public class ReportRepository : IReportRepository
    {
        private readonly ElsewedySchoolContext _context;

        public ReportRepository(ElsewedySchoolContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Report>> GetAllReportsAsync()
        {
            return await _context.Reports
                .Include(r => r.Status)
                .OrderByDescending(r => r.SubmissionDate)
                .ToListAsync();
        }

        public async Task<Report> CreateReportAsync(ReportSpecialist reportSpec)
        {
            // Map ReportSpecialist -> Report and save
            var report = new Report
            {
                Title = string.IsNullOrWhiteSpace(reportSpec.StudentName) ? "Specialist Report" : reportSpec.StudentName,
                SubmissionDate = DateTime.Now,
                ReportMessage = reportSpec.Description ?? string.Empty,
                StatusId = reportSpec.StatusId != 0 ? reportSpec.StatusId : 4, // default to Pending (4)
                // If you have a submitter account id available, set it here. Default to 0 for now.
                SubmitterAccountId = 0,
                ReviewerId = null
            };

            await _context.Reports.AddAsync(report);
            await _context.SaveChangesAsync();

            return report;
        }

        public async Task<bool> UpdateReportStatusAsync(int reportId, string newStatus)
        {
            var reportToUpdate = await _context.Reports
                .FirstOrDefaultAsync(r => r.Id == reportId);

            if (reportToUpdate == null)
                return false;

            switch ((newStatus ?? string.Empty).ToLowerInvariant())
            {
                case "accepted":
                    reportToUpdate.StatusId = 1; // Active
                    break;
                case "declined":
                    reportToUpdate.StatusId = 2; // Inactive
                    break;
                case "pending":
                    reportToUpdate.StatusId = 4; // Pending
                    break;
                default:
                    return false; // invalid status
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
