namespace Elsewedy_Capstone_System.Services.Interfaces;

public interface IWeekService
{
    Task<object> GetWeeksAsync(string? businessEntityName);
}
