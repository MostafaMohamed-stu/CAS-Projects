using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Services.Interfaces;

namespace Elsewedy_Capstone_System.Services;

public class WeekService : IWeekService
{
    private readonly SchoolDbContext _context;

    public WeekService(SchoolDbContext context)
    {
        _context = context;
    }

    public async Task<object> GetWeeksAsync(string? businessEntityName)
    {
        var query = _context.Weeks.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(businessEntityName))
        {
            query = query.Where(w => w.BusinessEntityName == businessEntityName);
        }

        return await query.OrderBy(w => w.Id).ToListAsync();
    }
}
