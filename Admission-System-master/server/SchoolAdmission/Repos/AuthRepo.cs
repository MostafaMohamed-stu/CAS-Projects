using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Data;
using SchoolAdmission.Models;
using BCrypt.Net;
using SchoolAdmission.Repos.IRepos;
using SchoolAdmission.Services;
using SchoolAdmission.DTOs;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;

namespace SchoolAdmission.Repos;
public class AuthRepo : GenericRepo<Login>, IAuthRepo {

    private readonly IConfiguration _config;
    public AuthRepo(SchoolAdmissionDbContext db, IConfiguration config) : base(db)
    {
        _config = config;
    }
    private string GenerateRandomNationalId()
    {
        var random = new Random();
        var nationalId = "";
        
        for (int i = 0; i < 14; i++)
        {
            nationalId += random.Next(0, 10).ToString();
        }
        
        return nationalId;
    }

    public async Task<Login?> isValidLoginWithInclude(string email, string password)
    {
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

        var login = await db.Logins 
        .Include(l => l.Account)
        .ThenInclude(a => a.Role)
        .FirstOrDefaultAsync(l => l.Email == email); 


        if (login == null)
        {
            return null;
        }

        if (!BCrypt.Net.BCrypt.Verify(password, login.PasswordHash))
        {
            return null;
        }

        return login;
    }


    public async Task<long> CreateReceptionCoordinatorAccount(CreateReceptionCoordinatorDTO dto)
    {
        var role = await db.Roles
        .FirstOrDefaultAsync(r => r.RoleName == "ReceptionCoordinator" && r.BusinessEntity == "Admission");

        var account = new Account
        {

            NationalId = GenerateRandomNationalId(),
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("1234567890"),
            RoleId = role.Id,
            IsActive = true,
            FullNameEn = dto.FullNameEn,
            FullNameAr = dto.FullNameAr,
        };

        await db.Accounts.AddAsync(account);
        await db.SaveChangesAsync();

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        var login = new Login
        {
            AccountId = account.Id,
            Email = dto.Email,
            PasswordHash = hashedPassword
        };
        await db.Logins.AddAsync(login);
        await db.SaveChangesAsync();

        var accountRole = new AccountRole
        {
            AccountId = account.Id,
            RoleId = role.Id,
            BusinessEntityName = "Admission"
        };
        await db.AccountRoles.AddAsync(accountRole);
        await db.SaveChangesAsync();

        return login.Id;
    }

    
    public async Task<long> CreateInterviewerAccount(CreateInterviewerDTO dto)
    {
        var role = await db.Roles
        .FirstOrDefaultAsync(r => r.RoleName == "Interviewer" && r.BusinessEntity == "Admission");

        var account = new Account
        {
            NationalId = GenerateRandomNationalId(),
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("1234567890"),
            RoleId = role.Id,
            IsActive = true,
            FullNameEn = dto.FullNameEn,
            FullNameAr = dto.FullNameAr,
        };
        await db.Accounts.AddAsync(account);
        await db.SaveChangesAsync();
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        var login = new Login
        {
            AccountId = account.Id,
            Email = dto.Email,
            PasswordHash = hashedPassword
        };

        await db.Logins.AddAsync(login);
        await db.SaveChangesAsync();
        var accountRole = new AccountRole
        {
            AccountId = account.Id,
            RoleId = role.Id,
            BusinessEntityName = "Admission"
        };
        await db.AccountRoles.AddAsync(accountRole);
        await db.SaveChangesAsync();
        return login.Id;
    }

    public async Task<long> CreateSuperAdminAccount(CreateSuperAdminDTO dto)
    {
        var role = await db.Roles
        .FirstOrDefaultAsync(r => r.RoleName == "SuperAdmin" && r.BusinessEntity == "Admission");
        var account = new Account
        {
            NationalId = GenerateRandomNationalId(),
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("1234567890"),
            RoleId = role.Id,
            IsActive = true,
            FullNameEn = dto.FullNameEn,
            FullNameAr = dto.FullNameAr,
        };
        await db.Accounts.AddAsync(account);
        await db.SaveChangesAsync();
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        var login = new Login
        {
            AccountId = account.Id,
            Email = dto.Email,
            PasswordHash = hashedPassword
        };
        await db.Logins.AddAsync(login);
        await db.SaveChangesAsync();
        var accountRole = new AccountRole
        {
            AccountId = account.Id,
            RoleId = role.Id,
            BusinessEntityName = "Admission"
        };
        await db.AccountRoles.AddAsync(accountRole);
        await db.SaveChangesAsync();
        return login.Id;
    }

    public async Task<long> CreateBoardAccount(CreateBoardDTO dto)
    {
        var role = await db.Roles
        .FirstOrDefaultAsync(r => r.RoleName == "Board" && r.BusinessEntity == "Admission");
        var account = new Account
        {
            NationalId = GenerateRandomNationalId(),
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("1234567890"),
            RoleId = role.Id,
            IsActive = true,
            FullNameEn = dto.FullNameEn,
            FullNameAr = dto.FullNameAr,
        };
        await db.Accounts.AddAsync(account);
        await db.SaveChangesAsync();
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        var login = new Login
        {
            AccountId = account.Id,
            Email = dto.Email,
            PasswordHash = hashedPassword
        };
        await db.Logins.AddAsync(login);
        await db.SaveChangesAsync();
        var accountRole = new AccountRole
        {
            AccountId = account.Id,
            RoleId = role.Id,
            BusinessEntityName = "Admission"
        };
        await db.AccountRoles.AddAsync(accountRole);
        await db.SaveChangesAsync();
        return login.Id;
    }

    public async Task<long> CreateStudentAffairAccount(CreateStudentAffairDTO dto)
    {
        var role = await db.Roles
        .FirstOrDefaultAsync(r => r.RoleName == "StudentAffair" && r.BusinessEntity == "Admission");
        var account = new Account
        {
            NationalId = GenerateRandomNationalId(),
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("1234567890"),
            RoleId = role.Id,
            IsActive = true,
            FullNameEn = dto.FullNameEn,
            FullNameAr = dto.FullNameAr,
        };

        await db.Accounts.AddAsync(account);
        await db.SaveChangesAsync();
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        var login = new Login
        {
            AccountId = account.Id,
            Email = dto.Email,
            PasswordHash = hashedPassword
        };
        await db.Logins.AddAsync(login);
        await db.SaveChangesAsync();
        return login.Id;
    }


    public async Task<bool> IsSuperAdminAsync(string email)
    {
        var account = await db.Accounts
            .FirstOrDefaultAsync(a => a.Email == email);

        if (account == null)
            return false;

        var effectiveRole = await GetEffectiveRoleAsync(account.Id);
        return effectiveRole?.RoleName == "SuperAdmin";
    }

    public async Task<bool> IsBoardAsync(string email)
    {
        var account = await db.Accounts
            .FirstOrDefaultAsync(a => a.Email == email);

        if (account == null)
            return false;

        var effectiveRole = await GetEffectiveRoleAsync(account.Id);
        return effectiveRole?.RoleName == "Board";
    }

    public async Task<bool> IsAdminAsync(string email)
    {
        var account = await db.Accounts
            .FirstOrDefaultAsync(a => a.Email == email);

        if (account == null)
            return false;

        var effectiveRole = await GetEffectiveRoleAsync(account.Id);
        var roleName = effectiveRole?.RoleName ?? "";
        return roleName == "Interviewer" || roleName == "Board" || roleName == "SuperAdmin" || roleName == "StudentAffair";
    }

    public async Task<bool> IsInterviewerAsync(string email)
    {
        var account = await db.Accounts
            .FirstOrDefaultAsync(a => a.Email == email);

        if (account == null)
            return false;

        var effectiveRole = await GetEffectiveRoleAsync(account.Id);
        return effectiveRole?.RoleName == "Interviewer";
    }

    public async Task<bool> IsReceptionCoordinatorAsync(string email)
    {
        var account = await db.Accounts
            .FirstOrDefaultAsync(a => a.Email == email);

        if (account == null)
            return false;

        var effectiveRole = await GetEffectiveRoleAsync(account.Id);
        return effectiveRole?.RoleName == "ReceptionCoordinator";
    }

    public async Task<bool> IsStudentAffairAsync(string email)
    {
        var account = await db.Accounts
            .FirstOrDefaultAsync(a => a.Email == email);

        if (account == null)
            return false;

        var effectiveRole = await GetEffectiveRoleAsync(account.Id);
        return effectiveRole?.RoleName == "StudentAffair";
    }

    public async Task<bool> IsApplicantAsync(long accountId)
    {
        // Applicants don't have Login records
        var hasLogin = await db.Logins.AnyAsync(l => l.AccountId == accountId);
        if (!hasLogin)
        {
            // Check if the account's role is Applicant
            var account = await db.Accounts
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Id == accountId);
            return account?.Role?.RoleName == "Applicant";
        }
        return false;
    }

    public async Task<Role?> GetEffectiveRoleAsync(long accountId)
    {
        // Check if user is Applicant (no Login record)
        var hasLogin = await db.Logins.AnyAsync(l => l.AccountId == accountId);
        
        if (!hasLogin)
        {
            // Applicant: Get role directly from Account.RoleId
            var account = await db.Accounts
                .Include(a => a.Role)
                .FirstOrDefaultAsync(a => a.Id == accountId);
            return account?.Role;
        }

        // Standard user: Query Account_Roles with priority (Admission > General)
        var accountRoles = await db.AccountRoles
            .Where(ar => ar.AccountId == accountId && 
                        (ar.BusinessEntityName == "Admission" || ar.BusinessEntityName == "General"))
            .ToListAsync();

        if (accountRoles.Count == 0)
            return null;

        // Priority: Admission > General
        var priorityRole = accountRoles
            .FirstOrDefault(ar => ar.BusinessEntityName == "Admission") 
            ?? accountRoles.FirstOrDefault(ar => ar.BusinessEntityName == "General");

        if (priorityRole?.RoleId == null)
            return null;

        return await db.Roles.FirstOrDefaultAsync(r => r.Id == priorityRole.RoleId);
    }

    public async Task<string?> GetEffectiveRoleNameAsync(long accountId)
    {
        var role = await GetEffectiveRoleAsync(accountId);
        return role?.RoleName;
    }

    public async Task<bool> HasRoleAsync(long accountId, string roleName)
    {
        var effectiveRole = await GetEffectiveRoleAsync(accountId);
        return effectiveRole?.RoleName == roleName;
    }

    public async Task<bool> HasAnyRoleAsync(long accountId, params string[] roleNames)
    {
        var effectiveRole = await GetEffectiveRoleAsync(accountId);
        if (effectiveRole == null)
            return false;
        return roleNames.Contains(effectiveRole.RoleName);
    }

    public async Task<string?> GetEffectiveRoleNameForLoginAsync(long accountId)
    {
        // For login, we need to check all AccountRoles and return the role name
        // Priority: Admission > General
        var accountRoles = await db.AccountRoles
            .Where(ar => ar.AccountId == accountId && 
                        (ar.BusinessEntityName == "Admission" || ar.BusinessEntityName == "General"))
            .ToListAsync();

        if (accountRoles.Count == 0)
            return null;

        // Priority: Admission > General
        var priorityRole = accountRoles
            .FirstOrDefault(ar => ar.BusinessEntityName == "Admission") 
            ?? accountRoles.FirstOrDefault(ar => ar.BusinessEntityName == "General");

        if (priorityRole?.RoleId == null)
            return null;

        var role = await db.Roles.FirstOrDefaultAsync(r => r.Id == priorityRole.RoleId);
        return role?.RoleName;
    }

    public async Task<List<long>> GetAccountIdsByRoleAsync(string roleName)
    {
        // Get the role ID(s) for the given role name
        var roles = await db.Roles
            .Where(r => r.RoleName == roleName && 
                       (r.BusinessEntity == "Admission" || r.BusinessEntity == "General"))
            .ToListAsync();

        if (roles.Count == 0)
            return new List<long>();

        var roleIds = roles.Select(r => r.Id).ToList();

        // Get all Account_Roles entries for these roles with priority: Admission > General
        var accountRoles = await db.AccountRoles
            .Where(ar => roleIds.Contains(ar.RoleId.Value) && 
                        (ar.BusinessEntityName == "Admission" || ar.BusinessEntityName == "General"))
            .ToListAsync();

        // Group by AccountId and select the one with highest priority (Admission > General)
        var accountIds = accountRoles
            .GroupBy(ar => ar.AccountId)
            .Select(g => new
            {
                AccountId = g.Key,
                PriorityRole = g
                    .OrderByDescending(ar => ar.BusinessEntityName == "Admission" ? 1 : 0)
                    .First()
            })
            .Where(x => x.AccountId.HasValue)
            .Select(x => x.AccountId.Value)
            .ToList();

        return accountIds;
    }

    public async Task<string> GenerateJwtTokenAsync(Account account)
    {
        // Get effective role name using the new resolution logic
        var roleName = await GetEffectiveRoleNameAsync(account.Id) ?? "";
        var fullName = account.FullNameEn ?? "";
       
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured.")));
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: new Claim[] {
                new Claim(JwtRegisteredClaimNames.Sub, account.Email),
                new Claim("role", roleName),
                new Claim("fullName", fullName),
            },
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            
            
        );
    
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}