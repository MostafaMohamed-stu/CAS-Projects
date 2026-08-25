using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Services.Interfaces;

namespace Elsewedy_Capstone_System.Services;

public class ClassService : IClassService
{
    private readonly SchoolDbContext _context;

    public ClassService(SchoolDbContext context)
    {
        _context = context;
    }

    public async Task<object> GetClassesAsync(string role, long? userId)
    {
        var classesQuery = _context.TblClasses
            .AsNoTracking()
            .Include(c => c.Grade)
            .AsQueryable();

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
                classesQuery = classesQuery.Where(c => c.GradeId == gradeId.Value);
            }
            else
            {
                return new List<object>();
            }
        }

        var classes = await classesQuery
            .Select(c => new
            {
                c.Id,
                c.ClassName,
                c.GradeId,
                GradeName = c.Grade != null ? c.Grade.GradeName : "Unknown Grade",
                c.StatusId
            })
            .ToListAsync();

        return classes.OrderBy(c => c.GradeName switch
        {
            "Junior" => 1,
            "Wheeler" => 2,
            "Senior" => 3,
            _ => 4
        }).ThenBy(c => c.ClassName).ToList();
    }

    public async Task<object> GetClassByIdAsync(long id)
    {
        var cls = await _context.TblClasses
            .AsNoTracking()
            .Include(c => c.Grade)
            .Where(c => c.Id == id)
            .Select(c => new
            {
                c.Id,
                c.ClassName,
                c.GradeId,
                GradeName = c.Grade != null ? c.Grade.GradeName : "Unknown Grade",
                c.StatusId
            })
            .FirstOrDefaultAsync();

        return cls;
    }

    public async Task<object> GetClassesByGradeAsync(long gradeId, string role, long? userId)
    {
        if (!IsPrivileged(role))
        {
            if (!userId.HasValue)
                return new List<object>();

            var myGradeId = await _context.StudentExtensions
                .AsNoTracking()
                .Include(se => se.Class)
                .Where(se => se.AccountId == userId.Value)
                .Select(se => se.Class != null ? (long?)se.Class.GradeId : null)
                .FirstOrDefaultAsync();

            if (!myGradeId.HasValue || myGradeId.Value != gradeId)
                return new List<object>();
        }

        var classes = await _context.TblClasses
            .AsNoTracking()
            .Include(c => c.Grade)
            .Where(c => c.GradeId == gradeId)
            .Select(c => new
            {
                c.Id,
                c.ClassName,
                c.GradeId,
                GradeName = c.Grade != null ? c.Grade.GradeName : "Unknown Grade",
                c.StatusId
            })
            .ToListAsync();

        return classes.OrderBy(c => c.GradeName switch
        {
            "Junior" => 1,
            "Wheeler" => 2,
            "Senior" => 3,
            _ => 4
        }).ThenBy(c => c.ClassName).ToList();
    }

    public async Task<object> GetClassesByEngineerAsync(long engineerId, string role, long? userId)
    {
        if (!IsPrivileged(role))
        {
            if (!userId.HasValue || userId.Value != engineerId)
                return new List<object>();
        }

        var assignedClasses = await _context.ReviewerSupervisorExtensions
            .AsNoTracking()
            .Include(r => r.AssignedClass)
                .ThenInclude(c => c.Grade)
            .Where(r => r.AccountId == engineerId && r.AssignedClassId.HasValue)
            .Select(r => new
            {
                Id = r.AssignedClass.Id,
                ClassName = r.AssignedClass.ClassName,
                GradeId = r.AssignedClass.GradeId,
                GradeName = r.AssignedClass.Grade != null ? r.AssignedClass.Grade.GradeName : "Unknown Grade",
                StatusId = r.AssignedClass.StatusId
            })
            .ToListAsync();

        return assignedClasses;
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
