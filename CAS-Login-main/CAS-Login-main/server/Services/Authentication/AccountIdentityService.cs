using System.Security.Claims;
using CAS_Login_Back_End.Data;
using CAS_Login_Back_End.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CAS_Login_Back_End.Services.Authentication;

/// <summary>
/// Maps the claims in a validated token to an active Login and Account_Info pair.
/// </summary>
public sealed class AccountIdentityService : IAccountIdentityService
{
    private readonly CasDbContext _dbContext;

    public AccountIdentityService(CasDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<long?> ResolveAccountIdAsync(
        ClaimsPrincipal principal,
        CancellationToken cancellationToken = default)
    {
        var accountIdValue = principal.FindFirst("AccountId")?.Value;

        if (long.TryParse(accountIdValue, out var accountId) &&
            await IsActiveLoginAccountAsync(accountId, cancellationToken))
        {
            return accountId;
        }

        var nationalId = principal.FindFirst("NationalId")?.Value;
        if (string.IsNullOrWhiteSpace(nationalId))
            return null;

        return await _dbContext.AccountInfos
            .AsNoTracking()
            .Where(account => account.NationalId == nationalId && account.IsActive)
            .Where(account => _dbContext.Logins.Any(login => login.AccountId == account.Id))
            .Select(account => (long?)account.Id)
            .SingleOrDefaultAsync(cancellationToken);
    }

    private Task<bool> IsActiveLoginAccountAsync(long accountId, CancellationToken cancellationToken) =>
        _dbContext.Logins
            .AsNoTracking()
            .Where(login => login.AccountId == accountId)
            .Join(
                _dbContext.AccountInfos.AsNoTracking(),
                login => login.AccountId,
                account => account.Id,
                (login, account) => account.IsActive)
            .AnyAsync(isActive => isActive, cancellationToken);
}
