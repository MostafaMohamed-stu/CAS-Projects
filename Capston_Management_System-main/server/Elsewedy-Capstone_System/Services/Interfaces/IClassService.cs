namespace Elsewedy_Capstone_System.Services.Interfaces;

public interface IClassService
{
    Task<object> GetClassesAsync(string role, long? userId);
    Task<object> GetClassByIdAsync(long id);
    Task<object> GetClassesByGradeAsync(long gradeId, string role, long? userId);
    Task<object> GetClassesByEngineerAsync(long engineerId, string role, long? userId);
}
