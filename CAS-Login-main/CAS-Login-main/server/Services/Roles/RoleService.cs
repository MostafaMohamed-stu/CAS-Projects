using CAS_Login_Back_End.Data;
using CAS_Login_Back_End.Exceptions;
using CAS_Login_Back_End.Models.Responses;
using CAS_Login_Back_End.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CAS_Login_Back_End.Services.Roles;

/// <summary>
/// Implementation of IRoleService for role management.
/// </summary>
public class RoleService : IRoleService
{
    private readonly CasDbContext _dbContext;
    private readonly IBusinessEntityAuthorizationService _businessEntityAuthorizationService;

    public RoleService(
        CasDbContext dbContext,
        IBusinessEntityAuthorizationService businessEntityAuthorizationService)
    {
        _dbContext = dbContext;
        _businessEntityAuthorizationService = businessEntityAuthorizationService;
    }

    public async Task<IEnumerable<RoleResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var roles = await _dbContext.Roles
            .AsNoTracking()
            .Select(r => new RoleResponse
            {
                RoleId = checked((int)r.Id),
                Name = r.RoleName,
                Description = r.BusinessEntity ?? string.Empty
            })
            .ToListAsync(cancellationToken);

        return roles;
    }

    public async Task<RoleResponse> GetByIdAsync(int roleId, CancellationToken cancellationToken = default)
    {
        var role = await _dbContext.Roles
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == roleId, cancellationToken);

        if (role is null)
        {
            throw new NotFoundException($"Role with ID {roleId} not found.");
        }

        return new RoleResponse
        {
            RoleId = checked((int)role.Id),
            Name = role.RoleName,
            Description = role.BusinessEntity ?? string.Empty
        };
    }

    public async Task<RoleResponse> GetAccountRoleAsync(
        int accountId,
        long businessEntityId,
        CancellationToken cancellationToken = default)
    {
        if (businessEntityId <= 0)
        {
            throw new NotFoundException("Business entity ID is required.");
        }

        var assignment = await _businessEntityAuthorizationService.GetAuthorizedAsync(
            accountId, businessEntityId, cancellationToken);

        if (!assignment.RoleId.HasValue)
        {
            throw new NotFoundException(
                $"No role found for account {accountId} in business entity '{businessEntityId}'.");
        }

        return new RoleResponse
        {
            RoleId = checked((int)assignment.RoleId.Value),
            Name = assignment.RoleName,
            Description = assignment.RoleDescription
        };
    }
}
