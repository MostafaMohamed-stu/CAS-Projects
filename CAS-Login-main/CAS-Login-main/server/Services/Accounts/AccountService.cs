using CAS_Login_Back_End.Data;
using CAS_Login_Back_End.Data.Entities;
using CAS_Login_Back_End.Exceptions;
using CAS_Login_Back_End.Models.Requests;
using CAS_Login_Back_End.Models.Responses;
using CAS_Login_Back_End.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CAS_Login_Back_End.Services.Accounts;

/// <summary>
/// Implementation of IAccountService for account management.
/// </summary>
public class AccountService : IAccountService
{
    private readonly CasDbContext _dbContext;
    private readonly IPasswordService _passwordService;
    private readonly ILogger<AccountService> _logger;

    public AccountService(
        CasDbContext dbContext,
        IPasswordService passwordService,
        ILogger<AccountService> logger)
    {
        _dbContext = dbContext;
        _passwordService = passwordService;
        _logger = logger;
    }

    public async Task<ProfileResponse> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate request
        ValidateRegisterRequest(request);

        // Login owns credentials, including the unique sign-in email.
        var existingLogin = await _dbContext.Logins
            .AsNoTracking()
            .FirstOrDefaultAsync(login => login.Email == request.Email, cancellationToken);

        if (existingLogin is not null)
        {
            throw new ValidationException("Email is already registered.");
        }

        // Create the profile in Account_Info. Login remains the credential record.
        var account = new AccountInfo
        {
            NationalId = request.NationalId,
            Email = request.Email,
            FullNameEn = request.FullNameEn,
            FullNameAr = request.FullNameAr,
            IsActive = true,
            CreatedAt = DateOnly.FromDateTime(DateTime.UtcNow)
        };

        _dbContext.AccountInfos.Add(account);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Create login record with hashed password
        var passwordHash = _passwordService.Hash(request.Password);
        var login = new Login
        {
            AccountId = account.Id,
            Email = request.Email,
            PasswordHash = passwordHash
        };

        _dbContext.Logins.Add(login);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("New account registered: {AccountId} ({Email})", account.Id, account.Email);

        return await ToProfileResponseAsync(account, login, cancellationToken);
    }

    public async Task<ProfileResponse> GetProfileAsync(
        int accountId,
        CancellationToken cancellationToken = default)
    {
        var login = await _dbContext.Logins
            .AsNoTracking()
            .FirstOrDefaultAsync(login => login.AccountId == accountId, cancellationToken);

        if (login is null)
        {
            throw new NotFoundException($"Login record for account {accountId} not found.");
        }

        var account = await GetAccountInfoAsync(login.AccountId, cancellationToken);

        return await ToProfileResponseAsync(account, login, cancellationToken);
    }

    public async Task<ProfileResponse> UpdateProfileAsync(
        int accountId,
        UpdateProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate request
        if (string.IsNullOrWhiteSpace(request.FullNameEn))
        {
            throw new ValidationException("FullNameEn is required.");
        }

        if (string.IsNullOrWhiteSpace(request.FullNameAr))
        {
            throw new ValidationException("FullNameAr is required.");
        }

        // Resolve the profile through Login.AccountId and Account_Info.
        var login = await _dbContext.Logins
            .FirstOrDefaultAsync(login => login.AccountId == accountId, cancellationToken);

        if (login is null)
        {
            throw new NotFoundException($"Login record for account {accountId} not found.");
        }

        var account = await GetAccountInfoAsync(login.AccountId, cancellationToken);

        // Update profile
        account.FullNameEn = request.FullNameEn;
        account.FullNameAr = request.FullNameAr;
        account.Phone = request.Phone;
        account.City = request.City;

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Profile updated for account: {AccountId}", accountId);

        return await ToProfileResponseAsync(account, login, cancellationToken);
    }

    public async Task ChangePasswordAsync(
        int accountId,
        ChangePasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate request
        if (string.IsNullOrWhiteSpace(request.CurrentPassword))
        {
            throw new ValidationException("Current password is required.");
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword))
        {
            throw new ValidationException("New password is required.");
        }

        if (request.NewPassword != request.ConfirmPassword)
        {
            throw new ValidationException("New password and confirmation do not match.");
        }

        // Get login record
        var login = await _dbContext.Logins
            .FirstOrDefaultAsync(l => l.AccountId == accountId, cancellationToken);

        if (login is null)
        {
            throw new NotFoundException($"Login record for account {accountId} not found.");
        }

        // Verify current password
        if (!_passwordService.Verify(request.CurrentPassword, login.PasswordHash))
        {
            throw new UnauthorizedException("Current password is incorrect.");
        }

        // Update password
        login.PasswordHash = _passwordService.Hash(request.NewPassword);

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Password changed for account: {AccountId}", accountId);
    }

    private static void ValidateRegisterRequest(RegisterRequest request)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            errors.Add("Email is required.");
        }

        if (string.IsNullOrWhiteSpace(request.NationalId))
        {
            errors.Add("NationalId is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            errors.Add("Password is required.");
        }

        if (request.Password != request.ConfirmPassword)
        {
            errors.Add("Password and confirmation do not match.");
        }

        if (string.IsNullOrWhiteSpace(request.FullNameEn))
        {
            errors.Add("FullNameEn is required.");
        }

        if (string.IsNullOrWhiteSpace(request.FullNameAr))
        {
            errors.Add("FullNameAr is required.");
        }

        if (errors.Count > 0)
        {
            throw new ValidationException("Registration validation failed.", errors);
        }
    }

    private async Task<AccountInfo> GetAccountInfoAsync(long accountId, CancellationToken cancellationToken)
    {
        return await _dbContext.AccountInfos
            .SingleOrDefaultAsync(account => account.Id == accountId, cancellationToken)
            ?? throw new NotFoundException($"Account_Info record for account {accountId} not found.");
    }

    private async Task<ProfileResponse> ToProfileResponseAsync(
        AccountInfo account,
        Login login,
        CancellationToken cancellationToken)
    {
        var statusName = await _dbContext.Statuses
            .AsNoTracking()
            .Where(status => status.Id == account.StatusId)
            .Select(status => status.StatusName)
            .SingleOrDefaultAsync(cancellationToken)
            ?? string.Empty;

        var governorate = account.GovernoratesId.HasValue
            ? await _dbContext.Governorates
                .AsNoTracking()
                .Where(item => item.Id == account.GovernoratesId.Value)
                .Select(item => new { item.GovernorateNameEn, item.GovernorateNameAr })
                .SingleOrDefaultAsync(cancellationToken)
            : null;

        return new ProfileResponse
        {
            AccountId = checked((int)account.Id),
            Email = account.Email,
            NationalId = account.NationalId,
            Phone = account.Phone,
            City = account.City,
            FullNameEn = account.FullNameEn ?? string.Empty,
            FullNameAr = account.FullNameAr ?? string.Empty,
            IsActive = account.IsActive,
            CreatedAt = account.CreatedAt,
            StatusId = account.StatusId,
            StatusName = statusName,
            GovernoratesId = account.GovernoratesId,
            GovernorateNameEn = governorate?.GovernorateNameEn,
            GovernorateNameAr = governorate?.GovernorateNameAr
        };
    }

}
