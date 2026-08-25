namespace Elsewedy_Capstone_System.Services.Interfaces;

public interface IDashboardService
{
    Task<object> GetStudentDashboardAsync(long studentId, string role, long currentUserId);
    Task<object> GetBoardStatisticsAsync();
    Task<object> GetEngineersByClassAsync();
    Task<object> GetTeamsProgressAsync();
    Task<object> GetTaskCompletionByStatusAsync();
    Task<object> GetTeamsByGradeAsync();
    Task<object> GetTeamsCompletedAllTasksAsync();
}
