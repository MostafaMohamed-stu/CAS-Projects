using CAS_Login_Back_End.Data;
using CAS_Login_Back_End.Exceptions;
using CAS_Login_Back_End.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CAS_Login_Back_End.Services.BusinessEntities;

/// <summary>
/// Reads business entities from Tbl_BusinessEntity without changing the scaffolded database model.
/// </summary>
public sealed class BusinessEntityService : IBusinessEntityService
{
    private readonly CasDbContext _dbContext;

    public BusinessEntityService(CasDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<BusinessEntityResponse>> GetAllAsync(CancellationToken cancellationToken = default) =>
        (await QueryBusinessEntitiesAsync(cancellationToken))
        .Select(ToResponse)
        .OrderBy(entity => entity.Name);

    public async Task<BusinessEntityResponse> GetByIdAsync(
        long businessEntityId,
        CancellationToken cancellationToken = default)
    {
        var entity = (await QueryBusinessEntitiesAsync(cancellationToken))
            .SingleOrDefault(entity => entity.Id == businessEntityId);

        return entity is null
            ? throw new NotFoundException($"Business entity '{businessEntityId}' was not found.")
            : ToResponse(entity);
    }

    public async Task<IEnumerable<BusinessEntityResponse>> GetAccountBusinessEntitiesAsync(
        int accountId,
        CancellationToken cancellationToken = default)
    {
        var assignedEntityNames = await _dbContext.AccountRoles
            .AsNoTracking()
            .Where(accountRole => accountRole.AccountId == accountId &&
                                  !string.IsNullOrWhiteSpace(accountRole.BusinessEntityName))
            .Select(accountRole => accountRole.BusinessEntityName!)
            .ToListAsync(cancellationToken);

        var entities = (await QueryBusinessEntitiesAsync(cancellationToken))
            .Where(entity => assignedEntityNames.Contains(entity.Name, StringComparer.OrdinalIgnoreCase));

        return entities
            .DistinctBy(entity => entity.Id)
            .Select(ToResponse)
            .OrderBy(entity => entity.Name);
    }

    private Task<List<BusinessEntityRow>> QueryBusinessEntitiesAsync(CancellationToken cancellationToken) =>
        _dbContext.Database
            .SqlQuery<BusinessEntityRow>($"""
                SELECT [ID] AS [Id],
                       [BusinessEntity] AS [Name],
                       [URL] AS [RedirectUrl]
                FROM [dbo].[Tbl_BusinessEntity]
                """)
            .ToListAsync(cancellationToken);

    private static BusinessEntityResponse ToResponse(BusinessEntityRow entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name,
        Description = entity.Name,
        RedirectUrl = entity.RedirectUrl ?? string.Empty,
        IsActive = true
    };

    private sealed class BusinessEntityRow
    {
        public long Id { get; init; }
        public string Name { get; init; } = string.Empty;
        public string? RedirectUrl { get; init; }
    }
}
