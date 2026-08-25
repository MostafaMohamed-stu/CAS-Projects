using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Services.Interfaces;

namespace Elsewedy_Capstone_System.Services;

public class StudentExtensionService : IStudentExtensionService
{
    private readonly SchoolDbContext _context;

    public StudentExtensionService(SchoolDbContext context)
    {
        _context = context;
    }

    public async Task<object> GetStudentExtensionsAsync()
    {
        return await _context.StudentExtensions
            .Include(s => s.Account)
            .Include(s => s.Class)
            .Include(s => s.Status)
            .Where(s => s.Account.IsActive && s.StatusId == 1)
            .Join(_context.AccountRoles, s => s.AccountId, ar => ar.AccountId, (s, ar) => new { s, ar })
            .Join(_context.Roles, x => x.ar.RoleId, r => r.Id, (x, r) => new { x.s, x.ar, r })
            .Where(x => x.ar.BusinessEntityName == "CapstoneProject" && x.r.RoleName == "Student")
            .Select(x => x.s)
            .ToListAsync();
    }

    public async Task<object> GetStudentsWithAccountDetailsAsync()
    {
        return await _context.StudentExtensions
            .AsNoTracking()
            .Include(s => s.Account)
            .Include(s => s.Class)
                .ThenInclude(c => c.Grade)
            .Join(_context.AccountRoles, s => s.AccountId, ar => ar.AccountId, (s, ar) => new { Student = s, AR = ar })
            .Join(_context.Roles, x => x.AR.RoleId, r => r.Id, (x, r) => new { x.Student, Role = r, x.AR })
            .Where(x => x.Student.Account.IsActive
                        && x.Student.StatusId == 1
                        && x.AR.BusinessEntityName == "CapstoneProject"
                        && x.Role.RoleName == "Student")
            .Select(x => new
            {
                id = x.Student.Account.Id,
                fullNameEn = x.Student.Account.FullNameEn,
                fullNameAr = x.Student.Account.FullNameAr,
                email = x.Student.Account.Email,
                classId = x.Student.ClassId,
                className = x.Student.Class != null ? x.Student.Class.ClassName : null,
                gradeId = x.Student.Class != null && x.Student.Class.Grade != null ? x.Student.Class.Grade.Id : (long?)null,
                gradeName = x.Student.Class != null && x.Student.Class.Grade != null ? x.Student.Class.Grade.GradeName : null,
                isLeader = x.Student.IsLeader,
                statusId = x.Student.StatusId
            })
            .ToListAsync();
    }

    public async Task<StudentExtension?> GetStudentExtensionAsync(long id)
    {
        return await _context.StudentExtensions
            .Include(s => s.Account)
            .Include(s => s.Class)
            .Include(s => s.Status)
            .FirstOrDefaultAsync(s => s.AccountId == id);
    }

    public async Task<(StudentExtension? ext, string? error)> CreateStudentExtensionAsync(long accountId, long? classId, bool isLeader, int statusId)
    {
        var existing = await _context.StudentExtensions.FindAsync(accountId);
        if (existing != null) return (null, "Already exists");

        var ext = new StudentExtension
        {
            AccountId = accountId,
            ClassId = classId,
            IsLeader = isLeader,
            StatusId = statusId
        };

        _context.StudentExtensions.Add(ext);
        await _context.SaveChangesAsync();

        return (ext, null);
    }

    public async Task<(bool success, string? error)> UpdateStudentExtensionAsync(long id, long? classId, bool isLeader, int statusId)
    {
        var ext = await _context.StudentExtensions.FindAsync(id);
        if (ext == null) return (false, "Not found");

        ext.ClassId = classId;
        ext.IsLeader = isLeader;
        ext.StatusId = statusId;

        _context.Entry(ext).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return (true, null);
    }

    public async Task<(bool success, string? error)> DeleteStudentExtensionAsync(long id)
    {
        var ext = await _context.StudentExtensions.FindAsync(id);
        if (ext == null) return (false, "Not found");

        _context.StudentExtensions.Remove(ext);
        await _context.SaveChangesAsync();

        return (true, null);
    }
}
