using Elsewedy_Capstone_System.Models;

namespace Elsewedy_Capstone_System.Services.Interfaces;

public interface ITeamService
{
    Task<object> GetTeamsAsync(string role, long? userId);
    Task<object> GetTeamAsync(long id, string role, long? userId);
    Task<object?> GetTeamByLeaderAsync(long leaderAccountId, string role, long currentUserId);
    Task<object> GetTeamMembersAsync();
    Task<(TeamMember? member, string? error)> CreateTeamMemberAsync(long teamId, long accountId, string? description, int statusId);
    Task<(bool success, string? error)> DeleteTeamMemberAsync(long id);
    Task<(bool success, string? error)> AssignTeamLeaderAsync(long teamId, long leaderId);
    Task<object> GetTeamsWithDetailsAsync();
    Task<object> GetTeamsByEngineerAsync(long engineerAccountId, string role, long currentUserId);
    Task<(Team? team, string? error)> CreateTeamAsync(string teamName, long classId);
    Task<(bool success, string? error)> UpdateTeamAsync(long id, string teamName, long classId, long? supervisorId, long? leaderId);
    Task<(bool success, string? error)> DeleteTeamAsync(long id);
    Task<object> GetEngineerAssignmentsAsync();
}
