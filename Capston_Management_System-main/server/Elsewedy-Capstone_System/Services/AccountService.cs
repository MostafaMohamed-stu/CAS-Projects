using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Services.Interfaces;
using BCrypt.Net;

namespace Elsewedy_Capstone_System.Services;

public class AccountService : IAccountService
{
    private readonly SchoolDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly RoleService _roleService;
    private readonly XssProtectionService _xssProtection;
    private readonly LoginRateLimitService _rateLimitService;

    public AccountService(SchoolDbContext context, IJwtService jwtService, RoleService roleService, XssProtectionService xssProtection, LoginRateLimitService rateLimitService)
    {
        _context = context;
        _jwtService = jwtService;
        _roleService = roleService;
        _xssProtection = xssProtection;
        _rateLimitService = rateLimitService;
    }

    public async Task<object> GetCapstoneRolesAsync()
    {
        var allowedNames = new[] { "Student", "Engineer", "Super Admin" };
        return await _context.Roles
            .AsNoTracking()
            .Where(r => r.BusinessEntity == "CapstoneProject" && allowedNames.Contains(r.RoleName))
            .OrderBy(r => r.OrderNo)
            .Select(r => new { r.Id, r.RoleName, r.BusinessEntity })
            .ToListAsync();
    }

    public async Task<(object? result, string? error)> CreateStaffAdminAccountAsync(string fullNameEn, string? fullNameAr, string email, string password, string? phone, string roleName, long? classId)
    {
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == roleName && r.BusinessEntity == "CapstoneProject");

        if (role == null)
        {
            var orderNo = roleName switch
            {
                "Student" => 1, "Engineer" => 2, "Super Admin" => 3, "Staff Admin" => 4, "CapstoneLead" => 5, _ => 6
            };
            role = new Role { RoleName = roleName, BusinessEntity = "CapstoneProject", OrderNo = orderNo };
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
        }

        var emailInUse = await _context.AccountRoles
            .Join(_context.Accounts, ar => ar.AccountId, a => a.Id, (ar, a) => new { Account = a, AR = ar })
            .Join(_context.Roles, x => x.AR.RoleId, r => r.Id, (x, r) => new { x.Account, x.AR, Role = r })
            .AnyAsync(x => x.Account.Email == email && x.AR.BusinessEntityName == "CapstoneProject" && x.Role.BusinessEntity == "CapstoneProject");
        if (emailInUse) return (null, "Email already in use");

        var loginEmailExists = await _context.Logins.AnyAsync(l => l.Email == email);
        if (loginEmailExists) return (null, "Email already in use (login exists)");

        var passwordValidation = PasswordValidationService.ValidatePassword(password);
        if (!passwordValidation.IsValid)
            return (null, $"Password does not meet complexity requirements: {string.Join(", ", passwordValidation.Errors)}");

        var nationalIdPrefix = roleName == "Student" ? "STU" : roleName == "Engineer" ? "ENG" : roleName == "Super Admin" ? "SUP" : "STAFF";
        var nationalId = $"{nationalIdPrefix}{DateTime.UtcNow.Ticks}".PadRight(14, '0').Substring(0, 14);

        var hashed = BCrypt.Net.BCrypt.HashPassword(password);

        var account = new Account
        {
            FullNameEn = fullNameEn,
            FullNameAr = fullNameAr ?? fullNameEn,
            Email = email,
            Phone = phone,
            RoleId = role.Id,
            NationalId = nationalId,
            PasswordHash = hashed,
            IsActive = true,
            StatusId = 1,
            CreatedAt = DateTime.UtcNow
        };

        _context.Accounts.Add(account);
        await _context.SaveChangesAsync();

        _context.AccountRoles.Add(new AccountRole { AccountId = account.Id, RoleId = role.Id, BusinessEntityName = "CapstoneProject" });
        _context.Logins.Add(new Login { AccountId = account.Id, Email = email, PasswordHash = hashed, StatusId = 1 });

        if (roleName == "Staff Admin" || roleName == "Super Admin")
            _context.SuperAdminExtensions.Add(new SuperAdminExtension { AccountId = account.Id, StatusId = 1 });

        await _context.SaveChangesAsync();

        return (new { message = $"{roleName} account created successfully", account = new { account.Id, account.FullNameEn, account.FullNameAr, account.Email, account.Phone, RoleId = role.Id, RoleName = roleName, ClassId = classId } }, null);
    }

    public async Task<(object? result, string? error)> CreateSimpleAccountAsync(string fullNameEn, string fullNameAr, string email, string password, string? phone, string? nationalId, long? roleId, string? roleName, long? classId, string callerRole)
    {
        if (callerRole.Replace(" ", string.Empty, StringComparison.OrdinalIgnoreCase).Equals("Engineer", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.IsNullOrWhiteSpace(roleName) && roleName.Replace(" ", string.Empty).ToLower() != "student" && roleId == null)
                return (null, "Forbidden");
            roleName = "Student";
            roleId = null;
            if (!classId.HasValue) return (null, "ClassId is required");
        }

        long resolvedRoleId;
        if (roleId.HasValue)
        {
            var roleExists = await _context.Roles.AnyAsync(r => r.Id == roleId.Value && r.BusinessEntity == "CapstoneProject");
            if (!roleExists) return (null, "Invalid RoleId");
            resolvedRoleId = roleId.Value;
        }
        else if (!string.IsNullOrWhiteSpace(roleName))
        {
            var normalized = roleName.Trim().Replace(" ", string.Empty).Replace("_", string.Empty).ToLower();
            var canonicalName = normalized switch
            {
                "superadmin" => "Super Admin", "staffadmin" => "Staff Admin", "engineer" => "Engineer",
                "student" => "Student", "capstonelead" => "CapstoneLead", _ => roleName.Trim()
            };
            var orderNo = canonicalName switch
            {
                "Student" => 1, "Engineer" => 2, "Super Admin" => 3, "Staff Admin" => 4, "CapstoneLead" => 5, _ => 6
            };
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.BusinessEntity == "CapstoneProject" && r.RoleName.Replace(" ", string.Empty).Replace("_", string.Empty).ToLower() == normalized);
            if (role == null)
            {
                role = new Role { RoleName = canonicalName, BusinessEntity = "CapstoneProject", OrderNo = orderNo };
                _context.Roles.Add(role);
                await _context.SaveChangesAsync();
            }
            resolvedRoleId = role.Id;
        }
        else return (null, "RoleId or RoleName required");

        var emailInUse = await _context.AccountRoles
            .Join(_context.Accounts, ar => ar.AccountId, a => a.Id, (ar, a) => new { Account = a, AR = ar })
            .Join(_context.Roles, x => x.AR.RoleId, r => r.Id, (x, r) => new { x.Account, x.AR, Role = r })
            .AnyAsync(x => x.Account.Email == email && x.AR.BusinessEntityName == "CapstoneProject" && x.Role.BusinessEntity == "CapstoneProject");
        if (emailInUse) return (null, "Email already in use");

        var loginEmailExists = await _context.Logins.AnyAsync(l => l.Email == email);
        if (loginEmailExists) return (null, "Email already in use");

        var passwordValidation = PasswordValidationService.ValidatePassword(password);
        if (!passwordValidation.IsValid)
            return (null, $"Password: {string.Join(", ", passwordValidation.Errors)}");

        var hashed = BCrypt.Net.BCrypt.HashPassword(password);
        var resolvedNationalId = string.IsNullOrWhiteSpace(nationalId) ? $"AUTO{DateTime.UtcNow.Ticks}".PadRight(14, '0').Substring(0, 14) : nationalId;

        var account = new Account
        {
            FullNameEn = fullNameEn, FullNameAr = fullNameAr, Email = email, Phone = phone,
            RoleId = resolvedRoleId, NationalId = resolvedNationalId, PasswordHash = hashed,
            IsActive = true, StatusId = 1, CreatedAt = DateTime.UtcNow
        };

        _context.Accounts.Add(account);
        await _context.SaveChangesAsync();

        _context.Logins.Add(new Login { AccountId = account.Id, Email = email, PasswordHash = hashed, StatusId = 1 });
        _context.AccountRoles.Add(new AccountRole { AccountId = account.Id, RoleId = resolvedRoleId, BusinessEntityName = "CapstoneProject" });

        if (classId.HasValue)
        {
            var studentRole = await _context.Roles.AsNoTracking().Where(r => r.RoleName == "Student" && r.BusinessEntity == "CapstoneProject").Select(r => r.Id).FirstOrDefaultAsync();
            if (studentRole == 0) studentRole = await _context.Roles.AsNoTracking().Where(r => r.RoleName == "Student").Select(r => r.Id).FirstOrDefaultAsync();

            if (resolvedRoleId == studentRole)
            {
                var classExists = await _context.TblClasses.AsNoTracking().AnyAsync(c => c.Id == classId.Value);
                if (!classExists) return (null, "Invalid ClassId");
                _context.StudentExtensions.Add(new StudentExtension { AccountId = account.Id, ClassId = classId.Value, IsLeader = false, StatusId = 1 });
            }
        }

        await _context.SaveChangesAsync();
        return (new { message = "Account created", account = new { account.Id, account.FullNameEn, account.FullNameAr, account.Email, account.Phone, account.RoleId } }, null);
    }

    public Task<object> GetLoginStatusAsync(string clientIp)
    {
        return Task.FromResult<object>(new { remainingRequests = 0, timeUntilReset = 0.0, maxRequests = 7, windowMinutes = 1 });
    }

    public async Task<(object? result, string? error)> LoginAsync(string email, string password)
    {
        var sanitizedEmail = XssProtectionService.SanitizeEmail(email);
        if (string.IsNullOrEmpty(sanitizedEmail)) return (null, "Invalid email");

        if (_rateLimitService.IsAccountLocked(sanitizedEmail))
            return (null, $"Account locked. Try in {_rateLimitService.GetRemainingLockTime(sanitizedEmail)?.TotalMinutes ?? 0} minutes");

        var login = await _context.Logins.Include(l => l.Account).FirstOrDefaultAsync(l => l.Email == sanitizedEmail && l.Account.IsActive);
        if (login == null)
        {
            _rateLimitService.RecordFailedAttempt(sanitizedEmail);
            return (null, "Invalid credentials");
        }

        bool verified;
        try
        {
            verified = BCrypt.Net.BCrypt.Verify(password, login.PasswordHash);
        }
        catch
        {
            verified = false;
        }
        verified = verified || password == login.PasswordHash;
        if (!verified)
        {
            _rateLimitService.RecordFailedAttempt(sanitizedEmail);
            return (null, "Invalid credentials");
        }

        _rateLimitService.RecordSuccessfulLogin(sanitizedEmail);

        var resolvedRoleName = await _roleService.GetAccountRoleNameAsync(login.AccountId, "CapstoneProject");
        if (string.IsNullOrWhiteSpace(resolvedRoleName) || resolvedRoleName == "Unknown")
            return (null, "No role assigned for CapstoneProject");

        var accessToken = await _jwtService.GenerateAccessTokenAsync(login.Account);
        var refreshToken = _jwtService.GenerateRefreshToken(login.Account);

        return (new
        {
            accessToken,
            user = new
            {
                id = login.AccountId,
                email = login.Account.Email,
                fullNameEn = login.Account.FullNameEn,
                fullNameAr = login.Account.FullNameAr,
                roleId = await _roleService.GetAccountRoleIdAsync(login.AccountId, "CapstoneProject"),
                role = resolvedRoleName
            },
            message = "Login successful",
            refreshToken
        }, null);
    }

    public async Task<(object? result, string? error)> RefreshAsync(string? refreshToken)
    {
        if (string.IsNullOrEmpty(refreshToken)) return (null, "No refresh token");

        var principal = _jwtService.ValidateRefreshToken(refreshToken);
        if (principal == null) return (null, "Invalid refresh token");

        var userId = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !long.TryParse(userId, out var accountId)) return (null, "Invalid token");

        var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == accountId && a.IsActive);
        if (account == null) return (null, "User not found");

        var newAccessToken = await _jwtService.GenerateAccessTokenAsync(account);
        var newRefreshToken = _jwtService.GenerateRefreshToken(account);

        return (new
        {
            accessToken = newAccessToken,
            refreshToken = newRefreshToken,
            user = new
            {
                id = account.Id,
                email = account.Email,
                fullNameEn = account.FullNameEn,
                fullNameAr = account.FullNameAr,
                roleId = await _roleService.GetAccountRoleIdAsync(account.Id, "CapstoneProject"),
                role = await _roleService.GetAccountRoleNameAsync(account.Id, "CapstoneProject")
            },
            message = "Token refreshed"
        }, null);
    }

    public Task<bool> LogoutAsync() => Task.FromResult(true);

    public async Task<object> GetAllAccountsForStaffAdminAsync()
    {
        return await _context.Accounts
            .AsNoTracking()
            .Where(a => a.IsActive)
            .Include(a => a.Status)
            .Include(a => a.StudentExtension).ThenInclude(s => s.Class).ThenInclude(c => c.Grade)
            .Join(_context.AccountRoles, a => a.Id, ar => ar.AccountId, (a, ar) => new { Account = a, AR = ar })
            .Join(_context.Roles, x => x.AR.RoleId, r => r.Id, (x, r) => new { x.Account, x.AR, Role = r })
            .Where(joined => joined.AR.BusinessEntityName == "CapstoneProject" && joined.Role.BusinessEntity == "CapstoneProject")
            .Select(joined => new
            {
                joined.Account.Id,
                joined.Account.FullNameEn,
                joined.Account.FullNameAr,
                joined.Account.Email,
                joined.Account.Phone,
                RoleId = joined.AR.RoleId,
                joined.Account.IsActive,
                joined.Account.StatusId,
                StatusName = joined.Account.Status.StatusName,
                RoleName = joined.Role.RoleName,
                BusinessEntity = joined.Role.BusinessEntity,
                ClassId = joined.Account.StudentExtension != null ? joined.Account.StudentExtension.ClassId : (long?)null,
                ClassName = joined.Account.StudentExtension != null && joined.Account.StudentExtension.Class != null ? joined.Account.StudentExtension.Class.ClassName : null,
                GradeName = joined.Account.StudentExtension != null && joined.Account.StudentExtension.Class != null && joined.Account.StudentExtension.Class.Grade != null ? joined.Account.StudentExtension.Class.Grade.GradeName : null
            })
            .OrderBy(a => a.FullNameEn)
            .ToListAsync();
    }

    public async Task<object?> GetCurrentUserAsync(long accountId)
    {
        var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == accountId && a.IsActive);
        if (account == null) return null;
        return new
        {
            id = account.Id,
            email = account.Email,
            fullNameEn = account.FullNameEn,
            fullNameAr = account.FullNameAr,
            roleId = await _roleService.GetAccountRoleIdAsync(account.Id, "CapstoneProject"),
            role = await _roleService.GetAccountRoleNameAsync(account.Id, "CapstoneProject")
        };
    }

    public async Task<object?> GetAccountAsync(long id)
    {
        return await _context.Accounts
            .AsNoTracking()
            .Where(a => a.Id == id && a.IsActive)
            .Select(a => new { a.Id, a.FullNameEn, a.FullNameAr, a.Email, a.NationalId, a.Phone, a.RoleId, a.IsActive, a.StatusId })
            .FirstOrDefaultAsync();
    }

    public async Task<object> GetAccountsByRoleNameAsync(string roleName)
    {
        var allRoles = await _context.Roles.AsNoTracking().Select(r => new { r.Id, r.RoleName, r.BusinessEntity }).ToListAsync();
        var role = allRoles.FirstOrDefault(r => r.RoleName == roleName && r.BusinessEntity == "CapstoneProject");
        if (role == null) role = allRoles.FirstOrDefault(r => string.Equals(r.RoleName, roleName, StringComparison.OrdinalIgnoreCase) && r.BusinessEntity == "CapstoneProject");
        if (role == null) role = allRoles.FirstOrDefault(r => r.RoleName.Contains(roleName, StringComparison.OrdinalIgnoreCase) && r.BusinessEntity == "CapstoneProject");
        if (role == null) return new List<object>();

        return await _context.AccountRoles
            .AsNoTracking()
            .Where(ar => ar.RoleId == role.Id && ar.BusinessEntityName == "CapstoneProject")
            .Join(_context.Accounts, ar => ar.AccountId, a => a.Id, (ar, a) => new { ar, a })
            .Where(x => x.a.IsActive)
            .Select(x => new
            {
                x.a.Id, x.a.FullNameEn, x.a.FullNameAr, x.a.Email, x.a.NationalId, x.a.Phone,
                RoleId = x.ar.RoleId, x.a.IsActive, x.a.StatusId, RoleName = role.RoleName, BusinessEntity = role.BusinessEntity
            })
            .ToListAsync();
    }

    public async Task<object> GetReviewersByClassAsync(long classId)
    {
        var reviewers = await _context.ReviewerSupervisorExtensions
            .AsNoTracking()
            .Include(r => r.Account)
            .Where(r => r.AssignedClassId == classId && r.Account.IsActive)
            .Join(_context.AccountRoles, r => r.AccountId, ar => ar.AccountId, (r, ar) => new { r, ar })
            .Join(_context.Roles, x => x.ar.RoleId, ro => ro.Id, (x, ro) => new { x.r, x.ar, Role = ro })
            .Where(x => x.ar.BusinessEntityName == "CapstoneProject")
            .Select(x => new
            {
                x.r.AccountId, x.r.Account.FullNameEn, x.r.Account.FullNameAr, x.r.Account.Email, x.r.Account.NationalId,
                RoleId = x.ar.RoleId, x.r.Account.IsActive,
                AccountType = new { Id = x.ar.RoleId, AccountTypeName = x.ar.RoleId == 3 ? "Supervisor" : x.ar.RoleId == 4 ? "Teacher" : x.ar.RoleId == 5 ? "Engineer" : "Reviewer" }
            })
            .ToListAsync();
        return reviewers.Any() ? reviewers : new List<object>();
    }

    public async Task<object> GetCapstoneSupervisorsAsync()
    {
        return await _context.Accounts
            .AsNoTracking()
            .Where(a => a.IsActive)
            .Join(_context.Roles, a => a.RoleId, r => r.Id, (a, r) => new { Account = a, Role = r })
            .Where(x => x.Role.BusinessEntity == "CapstoneProject" && (x.Role.RoleName == "Super Admin" || x.Role.RoleName == "SuperAdmin" || x.Role.RoleName.Replace(" ", "").ToLower() == "superadmin"))
            .Select(x => new { AccountId = x.Account.Id, x.Account.FullNameEn, x.Account.FullNameAr, x.Account.Email, x.Account.RoleId, Role = "Capstone Supervisor" })
            .ToListAsync();
    }

    public async Task<(bool success, string? error)> AssignEngineerToClassAsync(long accountId, long classId)
    {
        var account = await _context.Accounts.AsNoTracking().Where(a => a.Id == accountId && a.IsActive).FirstOrDefaultAsync();
        if (account == null) return (false, "Account not found");

        var classExists = await _context.TblClasses.AsNoTracking().AnyAsync(c => c.Id == classId);
        if (!classExists) return (false, "Class not found");

        var existing = await _context.ReviewerSupervisorExtensions.Where(r => r.AccountId == accountId).FirstOrDefaultAsync();
        if (existing != null)
        {
            existing.AssignedClassId = classId;
            existing.StatusId = 1;
        }
        else
        {
            _context.ReviewerSupervisorExtensions.Add(new ReviewerSupervisorExtension { AccountId = accountId, AssignedClassId = classId, StatusId = 1 });
        }
        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool success, string? error)> AssignReviewerToClassAsync(long accountId, long classId)
    {
        return await AssignEngineerToClassAsync(accountId, classId);
    }

    public async Task<(bool success, string? error)> RemoveAssignmentAsync(long accountId)
    {
        var assignment = await _context.ReviewerSupervisorExtensions.Where(r => r.AccountId == accountId).FirstOrDefaultAsync();
        if (assignment == null) return (false, "Assignment not found");
        _context.ReviewerSupervisorExtensions.Remove(assignment);
        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool success, string? error)> UpdateAccountAsync(long id, string fullNameEn, string? fullNameAr, string email, string? phone, string roleName, long? classId, string? password)
    {
        var account = await _context.Accounts.FindAsync(id);
        if (account == null) return (false, "Account not found");

        if (account.Email != email && await _context.Accounts.AnyAsync(a => a.Email == email && a.Id != id))
            return (false, "Email already in use");

        var role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == roleName && r.BusinessEntity == "CapstoneProject");
        if (role == null)
        {
            var normalized = roleName.Replace(" ", string.Empty).Replace("_", string.Empty).ToLower();
            var canonicalName = normalized switch
            {
                "superadmin" => "Super Admin", "staffadmin" => "Staff Admin", "engineer" => "Engineer", "student" => "Student", "capstonelead" => "CapstoneLead", _ => roleName
            };
            var orderNo = canonicalName switch { "Student" => 1, "Engineer" => 2, "Super Admin" => 3, "Staff Admin" => 4, "CapstoneLead" => 5, _ => 6 };
            role = new Role { RoleName = canonicalName, BusinessEntity = "CapstoneProject", OrderNo = orderNo };
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
        }

        account.FullNameEn = fullNameEn;
        account.FullNameAr = fullNameAr ?? fullNameEn;
        account.Email = email;
        account.Phone = phone;
        account.RoleId = role.Id;

        var existingAr = await _context.AccountRoles.FirstOrDefaultAsync(ar => ar.AccountId == account.Id && ar.BusinessEntityName == "CapstoneProject");
        if (existingAr == null)
            _context.AccountRoles.Add(new AccountRole { AccountId = account.Id, RoleId = role.Id, BusinessEntityName = "CapstoneProject" });
        else existingAr.RoleId = role.Id;

        if (!string.IsNullOrWhiteSpace(password))
        {
            var pv = PasswordValidationService.ValidatePassword(password);
            if (!pv.IsValid) return (false, $"Password: {string.Join(", ", pv.Errors)}");
            var hashed = BCrypt.Net.BCrypt.HashPassword(password);
            account.PasswordHash = hashed;
            var login = await _context.Logins.FirstOrDefaultAsync(l => l.AccountId == id);
            if (login != null) login.PasswordHash = hashed;
        }

        if (roleName == "Student" && classId.HasValue)
        {
            if (!await _context.TblClasses.AnyAsync(c => c.Id == classId.Value)) return (false, "Invalid class");
            var se = await _context.StudentExtensions.FirstOrDefaultAsync(s => s.AccountId == id);
            if (se == null) _context.StudentExtensions.Add(new StudentExtension { AccountId = id, ClassId = classId.Value, IsLeader = false, StatusId = 1 });
            else se.ClassId = classId.Value;
        }
        else if (roleName != "Student")
        {
            var se = await _context.StudentExtensions.FirstOrDefaultAsync(s => s.AccountId == id);
            if (se != null) _context.StudentExtensions.Remove(se);
        }

        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool success, string? error)> DeleteAccountAsync(long id)
    {
        var account = await _context.Accounts.FindAsync(id);
        if (account == null) return (false, "Account not found");
        account.IsActive = false;
        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(object? result, string? error)> CreateTestEngineersAsync()
    {
        var engineerRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Engineer" && r.BusinessEntity == "CapstoneProject");
        if (engineerRole == null)
        {
            engineerRole = new Role { RoleName = "Engineer", BusinessEntity = "CapstoneProject", OrderNo = 2 };
            _context.Roles.Add(engineerRole);
            await _context.SaveChangesAsync();
        }

        var existingCount = await _context.Accounts.Where(a => a.RoleId == engineerRole.Id && a.IsActive).CountAsync();
        if (existingCount > 0) return (new { message = $"{existingCount} engineers exist" }, null);

        var engineers = new[] { ("Ahmed Hassan", "ahmed.hassan@example.com", "01234567890"), ("Sarah Mohamed", "sarah.mohamed@example.com", "01234567891"), ("Omar Ali", "omar.ali@example.com", "01234567892"), ("Fatma Ibrahim", "fatma.ibrahim@example.com", "01234567893") };
        var created = new List<object>();

        foreach (var (name, email, phone) in engineers)
        {
            if (await _context.Accounts.AnyAsync(a => a.Email == email)) continue;
            var nationalId = $"ENG{DateTime.UtcNow.Ticks}".PadRight(14, '0').Substring(0, 14);
            var hashed = BCrypt.Net.BCrypt.HashPassword("password123");
            var account = new Account { FullNameEn = name, FullNameAr = name, Email = email, Phone = phone, RoleId = engineerRole.Id, NationalId = nationalId, PasswordHash = hashed, IsActive = true, StatusId = 1, CreatedAt = DateTime.UtcNow };
            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();
            _context.AccountRoles.Add(new AccountRole { AccountId = account.Id, RoleId = engineerRole.Id, BusinessEntityName = "CapstoneProject" });
            _context.Logins.Add(new Login { AccountId = account.Id, Email = email, PasswordHash = hashed, StatusId = 1 });
            await _context.SaveChangesAsync();
            created.Add(new { account.Id, account.FullNameEn, account.Email, account.Phone, RoleName = "Engineer" });
        }

        return (new { message = $"Created {created.Count} test engineers", engineers = created }, null);
    }

    public async Task<object> GetUnregisteredStudentsAsync()
    {
        var studentRoles = await _context.Roles.AsNoTracking().Where(r => r.RoleName == "Student").Select(r => r.Id).ToListAsync();
        if (studentRoles.Count == 0) return new List<object>();

        return await _context.Accounts
            .AsNoTracking()
            .Where(a => a.IsActive && studentRoles.Contains(a.RoleId))
            .Where(a => _context.StudentExtensions.AsNoTracking().Any(se => se.AccountId == a.Id))
            .Where(a => !_context.AccountRoles.AsNoTracking().Where(ar => ar.BusinessEntityName == "CapstoneProject" && ar.AccountId == a.Id).Join(_context.Roles, ar => ar.RoleId, r => r.Id, (ar, r) => r).Any(r => r.RoleName == "Student"))
            .Select(a => new { id = a.Id, fullNameEn = a.FullNameEn, fullNameAr = a.FullNameAr, email = a.Email, phone = a.Phone })
            .ToListAsync();
    }

    public async Task<object> CheckStudentAsync(long accountId)
    {
        var account = await _context.Accounts.AsNoTracking().Where(a => a.Id == accountId).FirstOrDefaultAsync();
        if (account == null) return new { accountId, found = false };

        var role = await _context.Roles.AsNoTracking().Where(r => r.Id == account.RoleId).FirstOrDefaultAsync();
        var studentExt = await _context.StudentExtensions.AsNoTracking().Where(se => se.AccountId == accountId).FirstOrDefaultAsync();
        var accountRole = await _context.AccountRoles.AsNoTracking().Where(ar => ar.AccountId == accountId && ar.BusinessEntityName == "CapstoneProject").FirstOrDefaultAsync();
        var accountRoleRole = accountRole != null ? await _context.Roles.AsNoTracking().Where(r => r.Id == accountRole.RoleId).FirstOrDefaultAsync() : null;

        return new
        {
            accountId = account.Id, fullNameEn = account.FullNameEn, email = account.Email, isActive = account.IsActive,
            accountRoleId = account.RoleId, accountRoleName = role?.RoleName ?? "NULL", hasStudentExtension = studentExt != null,
            studentExtensionClassId = studentExt?.ClassId, hasAccountRole = accountRole != null, accountRoleRoleId = accountRole?.RoleId,
            accountRoleRoleName = accountRoleRole?.RoleName ?? "NULL",
            isRegistered = accountRole != null && accountRoleRole?.RoleName == "Student"
        };
    }

    public async Task<object> GetUnregisteredStudentsTestAsync()
    {
        var studentRole = await _context.Roles.AsNoTracking().Where(r => r.RoleName == "Student").FirstOrDefaultAsync();
        if (studentRole == null) return new { message = "No student role" };

        var allStudents = await _context.Accounts.AsNoTracking().Where(a => a.IsActive && a.RoleId == studentRole.Id).Where(a => _context.StudentExtensions.AsNoTracking().Any(se => se.AccountId == a.Id)).Select(a => new { id = a.Id, fullNameEn = a.FullNameEn, email = a.Email }).ToListAsync();
        var registered = allStudents.Where(a => _context.AccountRoles.AsNoTracking().Where(ar => ar.BusinessEntityName == "CapstoneProject" && ar.AccountId == a.id).Join(_context.Roles, ar => ar.RoleId, r => r.Id, (ar, r) => r).Any(r => r.RoleName == "Student")).ToList();
        var unregistered = allStudents.Where(a => !registered.Contains(a)).ToList();

        return new { message = "Test", studentRoleId = studentRole.Id, totalStudentsWithExtension = allStudents.Count, registeredCount = registered.Count, unregisteredCount = unregistered.Count, registeredStudents = registered, unregisteredStudents = unregistered };
    }

    public async Task<(int added, int skipped, string? error)> AddStudentsToCapstoneAsync(List<long> studentIds)
    {
        var studentRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Student" && r.BusinessEntity == "CapstoneProject");
        if (studentRole == null) return (0, 0, "Student role not found");

        int added = 0, skipped = 0;
        foreach (var id in studentIds)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == id);
            if (account == null) { skipped++; continue; }
            var existing = await _context.AccountRoles.FirstOrDefaultAsync(ar => ar.AccountId == id && ar.BusinessEntityName == "CapstoneProject");
            if (existing != null) { skipped++; continue; }
            _context.AccountRoles.Add(new AccountRole { AccountId = id, RoleId = studentRole.Id, BusinessEntityName = "CapstoneProject" });
            added++;
        }
        await _context.SaveChangesAsync();
        return (added, skipped, null);
    }

    public async Task<object> GetAllAccountsAsync(int? page, int? pageSize, string? search)
    {
        var query = _context.Accounts.AsNoTracking().Where(a => a.IsActive);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var sl = search.ToLower();
            query = query.Where(a => a.FullNameEn.ToLower().Contains(sl) || (a.FullNameAr != null && a.FullNameAr.ToLower().Contains(sl)) || a.Email.ToLower().Contains(sl));
        }

        if (page.HasValue && pageSize.HasValue)
        {
            var totalCount = await query.CountAsync();
            var accounts = await query.Select(a => new { id = a.Id, fullNameEn = a.FullNameEn, fullNameAr = a.FullNameAr, email = a.Email, phone = a.Phone }).OrderBy(a => a.fullNameEn).Skip((page.Value - 1) * pageSize.Value).Take(pageSize.Value).ToListAsync();
            return new { accounts, pagination = new { totalCount, totalPages = (int)Math.Ceiling(totalCount / (double)pageSize.Value), currentPage = page.Value, pageSize = pageSize.Value, hasNextPage = page.Value < (int)Math.Ceiling(totalCount / (double)pageSize.Value), hasPreviousPage = page.Value > 1 } };
        }

        return await query.Select(a => new { id = a.Id, fullNameEn = a.FullNameEn, fullNameAr = a.FullNameAr, email = a.Email, phone = a.Phone }).OrderBy(a => a.fullNameEn).ToListAsync();
    }

    public async Task<object> GetAllRolesAsync()
    {
        return await _context.Roles.AsNoTracking().Select(r => new { id = r.Id, roleName = r.RoleName, businessEntity = r.BusinessEntity, orderNo = r.OrderNo }).OrderBy(r => r.orderNo).ThenBy(r => r.roleName).ToListAsync();
    }

    public async Task<object> GetBusinessEntitiesAsync()
    {
        return await _context.AccountRoles.AsNoTracking().Select(ar => ar.BusinessEntityName).Distinct().OrderBy(be => be).ToListAsync();
    }

    public async Task<(int added, int skipped, string? error)> AddRolesToAccountsAsync(List<long> accountIds, string roleName, string businessEntityName)
    {
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName.ToLower() == roleName.Trim().ToLower());
        if (role == null) return (0, 0, $"Role '{roleName}' not found");

        int added = 0, skipped = 0;
        foreach (var id in accountIds)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == id);
            if (account == null) { skipped++; continue; }
            var existing = await _context.AccountRoles.FirstOrDefaultAsync(ar => ar.AccountId == id && ar.RoleId == role.Id && ar.BusinessEntityName == businessEntityName);
            if (existing != null) { skipped++; continue; }
            _context.AccountRoles.Add(new AccountRole { AccountId = id, RoleId = role.Id, BusinessEntityName = businessEntityName });
            added++;
        }
        await _context.SaveChangesAsync();
        return (added, skipped, null);
    }
}
