using CAS_Login_Back_End.Data;
using CAS_Login_Back_End.Exceptions;
using CAS_Login_Back_End.Models.BusinessEntities;
using CAS_Login_Back_End.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CAS_Login_Back_End.Services.BusinessEntities;

/// <summary>
/// Maps a canonical Tbl_BusinessEntity ID to the legacy AccountRoles assignment.
/// </summary>
public sealed class BusinessEntityAuthorizationService : IBusinessEntityAuthorizationService
{
    private readonly CasDbContext _dbContext;

    public BusinessEntityAuthorizationService(CasDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<BusinessEntityAssignment> GetAuthorizedAsync(
        long accountId,
        long? businessEntityId,
        string? businessEntityName = null,
        CancellationToken cancellationToken = default)
    {
        long? targetEntityId = businessEntityId > 0 ? businessEntityId : null;
        string? trimmedName = string.IsNullOrWhiteSpace(businessEntityName) ? null : businessEntityName.Trim();

        if (!targetEntityId.HasValue && trimmedName is null)
            throw new ValidationException("Business entity ID or name is required.");

        var assignment = await _dbContext.Database
            .SqlQuery<BusinessEntityAssignmentRow>($"""
                SELECT be.[ID] AS [Id],
                       be.[BusinessEntity] AS [Name],
                       be.[URL] AS [RedirectUrl],
                       ar.[RoleID] AS [RoleId],
                       ISNULL(r.[BusinessEntity], '') AS [RoleDescription],
                       ISNULL(r.[RoleName], '') AS [RoleName]
                FROM [dbo].[Tbl_BusinessEntity] AS be
                INNER JOIN [dbo].[AccountRoles] AS ar
                    ON ar.[BusinessEntityName] = be.[BusinessEntity]
                LEFT JOIN [dbo].[Roles] AS r ON r.[Id] = ar.[RoleID]
                WHERE ar.[AccountID] = {accountId}
                  AND ({targetEntityId} IS NULL OR be.[ID] = {targetEntityId})
                  AND ({trimmedName} IS NULL OR LOWER(be.[BusinessEntity]) = LOWER({trimmedName}))
                """)
            .FirstOrDefaultAsync(cancellationToken);

        return assignment is null
            ? throw new UnauthorizedException("You do not have access to this business entity.")
            : new BusinessEntityAssignment(
                assignment.Id,
                assignment.Name,
                assignment.RedirectUrl ?? string.Empty,
                assignment.RoleId,
                assignment.RoleDescription,
                assignment.RoleName);
    }

    private sealed class BusinessEntityAssignmentRow
    {
        public long Id { get; init; }
        public string Name { get; init; } = string.Empty;
        public string? RedirectUrl { get; init; }
        public long? RoleId { get; init; }
        public string RoleDescription { get; init; } = string.Empty;
        public string RoleName { get; init; } = string.Empty;
    }
}
