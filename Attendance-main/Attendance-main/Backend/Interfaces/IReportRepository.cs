using AttendanceBehaviour_Backend.Models;

namespace AttendanceBehaviour_Backend.Interfaces
{
    public interface IReportRepository
    {
        Task<IEnumerable<Report>> GetAllReportsAsync();
        Task<Report> CreateReportAsync(ReportSpecialist reportSpec);
        Task<bool> UpdateReportStatusAsync(int reportId, string newStatus);
    }
}
