using Microsoft.EntityFrameworkCore;
using QuizesApi.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

var connectionString = "Server=Dbserver;Database=ElsewedySchoolSysDB_DEV;User Id=dev;Password=Elsewedyprojects@IATS2025;Encrypt=False";

var optionsBuilder = new DbContextOptionsBuilder<ElsewedySchoolSysDbDevContext>();
optionsBuilder.UseSqlServer(connectionString);

using (var context = new ElsewedySchoolSysDbDevContext(optionsBuilder.Options))
{
    Console.WriteLine("--- Roles Table ---");
    var roles = await context.Roles.ToListAsync();
    foreach (var r in roles)
    {
        Console.WriteLine($"ID: {r.Id}, Name: {r.RoleName}");
    }

    Console.WriteLine("\n--- Teacher Check (Account.RoleId) ---");
    var teacherRole = roles.FirstOrDefault(r => r.RoleName.Trim().Equals("Teacher", StringComparison.OrdinalIgnoreCase));
    if (teacherRole != null)
    {
        var teachersDirect = await context.Accounts.Where(a => a.RoleId == teacherRole.Id).ToListAsync();
        Console.WriteLine($"Found {teachersDirect.Count} teachers via Account.RoleId");
        foreach(var t in teachersDirect.Take(5)) {
            Console.WriteLine($"  - {t.FullNameEn} ({t.Email})");
        }
    }
    else {
        Console.WriteLine("Teacher role NOT found in Roles table!");
    }

    Console.WriteLine("\n--- Teacher Check (AccountRoles Table) ---");
    var teachersViaJoin = await context.AccountRoles
        .Join(context.Roles, ar => ar.RoleId, r => r.Id, (ar, r) => new { ar.AccountId, r.RoleName })
        .Where(x => x.RoleName.Trim().Equals("Teacher", StringComparison.OrdinalIgnoreCase))
        .Join(context.Accounts, x => x.AccountId, a => a.Id, (x, a) => a)
        .ToListAsync();
    Console.WriteLine($"Found {teachersViaJoin.Count} teachers via AccountRoles table");
    foreach(var t in teachersViaJoin.Take(5)) {
        Console.WriteLine($"  - {t.FullNameEn} ({t.Email})");
    }

    Console.WriteLine("\n--- Total Accounts ---");
    var totalAccounts = await context.Accounts.CountAsync();
    Console.WriteLine($"Total accounts: {totalAccounts}");
}
