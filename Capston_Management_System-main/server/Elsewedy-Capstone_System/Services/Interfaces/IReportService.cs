namespace Elsewedy_Capstone_System.Services.Interfaces;

public interface IReportService
{
    Task<object> GetReportsAsync(string role, long userId);
    Task<object> GetReportAsync(long id, string role, long userId);
    Task<object> GetReportsByUserAsync(long submitterAccountId, string role, long userId);
    Task<(object? result, string? error)> CreateReportAsync(string title, string reportMessage, long submitterAccountId, int statusId);
    Task<(bool success, string? error)> UpdateReportAsync(long id, string title, string reportMessage, int statusId, long userId, string role);
    Task<(bool success, string? error)> DeleteReportAsync(long id, long userId, string role);
    Task<bool> ReportExistsAsync(long id);
}
