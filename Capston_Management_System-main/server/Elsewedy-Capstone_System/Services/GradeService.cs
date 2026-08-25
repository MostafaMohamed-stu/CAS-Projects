using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Services.Interfaces;

namespace Elsewedy_Capstone_System.Services;

public class GradeService : IGradeService
{
    private readonly SchoolDbContext _context;

    public GradeService(SchoolDbContext context)
    {
        _context = context;
    }

    public async Task<object> GetGradesAsync(string role, long? userId)
    {
        var gradesQuery = _context.Grades.AsNoTracking().AsQueryable();

        if (!IsPrivileged(role))
        {
            if (!userId.HasValue)
                return new List<object>();

            var gradeId = await _context.StudentExtensions
                .AsNoTracking()
                .Include(se => se.Class)
                .Where(se => se.AccountId == userId.Value)
                .Select(se => se.Class != null ? (long?)se.Class.GradeId : null)
                .FirstOrDefaultAsync();

            if (gradeId.HasValue)
            {
                gradesQuery = gradesQuery.Where(g => g.Id == gradeId.Value);
            }
            else
            {
                return new List<object>();
            }
        }

        var grades = await gradesQuery
            .Select(g => new { g.Id, g.GradeName, g.StatusId })
            .ToListAsync();

        return grades.OrderBy(g => g.GradeName switch
        {
            "Junior" => 1,
            "Wheeler" => 2,
            "Senior" => 3,
            _ => 4
        }).ThenBy(g => g.GradeName).ToList();
    }

    private static bool IsPrivileged(string role)
    {
        if (string.IsNullOrWhiteSpace(role)) return false;
        role = role.Replace(" ", string.Empty, StringComparison.OrdinalIgnoreCase);
        return role.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase)
            || role.Equals("Board", StringComparison.OrdinalIgnoreCase)
            || role.Equals("StaffAdmin", StringComparison.OrdinalIgnoreCase)
            || role.Equals("Engineer", StringComparison.OrdinalIgnoreCase)
            || role.Equals("CapstoneLead", StringComparison.OrdinalIgnoreCase);
    }
}
