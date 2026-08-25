namespace Elsewedy_Capstone_System.Services.Interfaces;

public interface IGradeService
{
    Task<object> GetGradesAsync(string role, long? userId);
}
