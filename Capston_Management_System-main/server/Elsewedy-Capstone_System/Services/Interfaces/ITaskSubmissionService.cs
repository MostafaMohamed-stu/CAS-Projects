using Elsewedy_Capstone_System.Models;

namespace Elsewedy_Capstone_System.Services.Interfaces;

public interface ITaskSubmissionService
{
    Task<object> GetTaskSubmissionsAsync(string role, long userId);
    Task<TaskSubmission?> GetTaskSubmissionAsync(int id, string role, long userId);
    Task<(TaskSubmission? submission, object? result, string? error)> CreateSubmissionAsync(long teamId, long userId, string role, long taskId, string? glink, string? note);
    Task<(bool success, object? result, string? error)> MarkReviewedAsync(int id, string? feedback, string role, long userId);
    Task<(bool success, string? error)> RejectTaskAsync(int id);
    Task<(bool success, string? error)> AddFeedbackAsync(int id, string? feedback);
    Task<(bool success, string? error)> UpdateSubmissionAsync(int id, long teamId, long userId, string role, string? glink, string? note, int statusId);
    Task<(bool success, string? error)> DeleteSubmissionAsync(int id, long userId, string role);
}
