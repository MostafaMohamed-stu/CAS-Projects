using Elsewedy_Capstone_System.Models;

namespace Elsewedy_Capstone_System.Services.Interfaces;

public interface IAccountTaskService
{
    Task<object> GetStudentTasksAsync(long studentId, string role, long currentUserId);
    Task<object> GetTasksByGradeAsync(long gradeId);
    Task<object> GetAllTasksAsync();
    Task<(TblTask? task, string? error)> CreateTaskAsync(string taskName, string? description, DateTime deadline, long? gradeId, long? classId, long? teamId, long adminAccountId, int weekId, long? assignedToId);
    Task<(TblTask? task, string? error)> UpdateTaskAsync(long id, string taskName, string? description, DateTime deadline, long? gradeId, long? classId, long? teamId, long adminAccountId, int weekId, int? statusId, long? assignedToId);
    Task<(bool success, string? error)> DeleteTaskAsync(long id);
}
