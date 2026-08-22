using QuizesApi.DTOs;

namespace QuizesApi.Repositories.Interfaces;

public interface IDashboardRepo
{
    /// <summary>
    /// Get dashboard data for a specific student
    /// </summary>
    Task<StudentDashboardDto?> GetStudentDashboardAsync(long studentId, LeaderboardFilterDto? filters = null);

    /// <summary>
    /// Get dashboard data for a specific teacher
    /// </summary>
    Task<TeacherDashboardDto?> GetTeacherDashboardAsync(long teacherId, LeaderboardFilterDto? filters = null);

    /// <summary>
    /// Get global dashboard data for superadmin
    /// </summary>
    Task<SuperadminDashboardDto> GetSuperadminDashboardAsync(LeaderboardFilterDto? filters = null);

    /// <summary>
    /// Get leaderboard for a specific exam with optional filters
    /// </summary>
    Task<LeaderboardDto?> GetLeaderboardAsync(long examId, LeaderboardFilterDto? filters = null);

    /// <summary>
    /// Get statistics for a specific exam
    /// </summary>
    Task<ExamStatsDto?> GetExamStatsAsync(long examId);

    /// <summary>
    /// Get all students with their performance data
    /// </summary>
    Task<List<StudentPerformanceDto>> GetStudentsAsync();

    /// <summary>
    /// Get combined leaderboard for a specific grade (aggregated scores from all exams)
    /// </summary>
    Task<LeaderboardDto> GetCombinedLeaderboardAsync(LeaderboardFilterDto? filters);
    /// <summary>
    /// Get all teachers with their account data
    /// </summary>
    Task<List<TeacherAccountDto>> GetTeachersAsync();
}
