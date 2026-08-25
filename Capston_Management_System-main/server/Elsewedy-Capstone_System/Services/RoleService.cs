using Elsewedy_Capstone_System.Models;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Services
{
    public class RoleService
    {
        private readonly SchoolDbContext _context;
        private readonly Dictionary<long, string> _roleCache;

        public RoleService(SchoolDbContext context)
        {
            _context = context;
            _roleCache = new Dictionary<long, string>();
        }

        /// <summary>
        /// Gets the role name for a given role ID
        /// </summary>
        /// <param name="roleId">The role ID to look up</param>
        /// <returns>The role name or "Unknown" if not found</returns>
        public async Task<string> GetRoleNameAsync(long roleId)
        {
            // Check cache first
            if (_roleCache.ContainsKey(roleId))
            {
                Console.WriteLine($"RoleService: Using cached role for ID {roleId}: {_roleCache[roleId]}");
                return _roleCache[roleId];
            }

            try
            {
                Console.WriteLine($"RoleService: Looking up role for ID {roleId} in database...");
                
                // Look up role in Role table by ID
                var roleRecord = await _context.Roles
                    .Where(r => r.Id == roleId)
                    .Select(r => new { r.Id, r.RoleName })
                    .FirstOrDefaultAsync();
                
                Console.WriteLine($"RoleService: Looking up role for ID {roleId} in Role table...");
                if (roleRecord != null)
                {
                    Console.WriteLine($"  - ID: {roleRecord.Id}, RoleName: '{roleRecord.RoleName}'");
                }
                else
                {
                    Console.WriteLine($"  - No role found for ID {roleId}");
                }
                
                var role = roleRecord?.RoleName;

                if (!string.IsNullOrEmpty(role))
                {
                    Console.WriteLine($"RoleService: Found role in database for ID {roleId}: {role}");
                    _roleCache[roleId] = role;
                    return role;
                }

                // No role found in database
                Console.WriteLine($"RoleService: No role found in database for ID {roleId}");
                _roleCache[roleId] = "Unknown";
                return "Unknown";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting role name for ID {roleId}: {ex.Message}");
                _roleCache[roleId] = "Unknown";
                return "Unknown";
            }
        }

        /// <summary>
        /// Gets the role name for a given account in a specific business entity
        /// </summary>
        public async Task<string> GetAccountRoleNameAsync(long accountId, string businessEntityName = "CapstoneProject")
        {
            try
            {
                // Prefer AccountRoles mapping to get roleId for the business entity
                var mappedRoleId = await _context.AccountRoles
                    .Where(ar => ar.AccountId == accountId && ar.BusinessEntityName == businessEntityName)
                    .Select(ar => (long?)ar.RoleId)
                    .FirstOrDefaultAsync();

                if (mappedRoleId.HasValue)
                {
                    return await GetRoleNameAsync(mappedRoleId.Value);
                }

                // No mapped role found for this business entity
                return "Unknown";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting account role for account {accountId} in entity {businessEntityName}: {ex.Message}");
                return "Unknown";
            }
        }

        /// <summary>
        /// Gets the role id for a given account in a specific business entity
        /// </summary>
        public async Task<long?> GetAccountRoleIdAsync(long accountId, string businessEntityName = "CapstoneProject")
        {
            try
            {
                // Prefer AccountRoles mapping for the business entity
                var roleId = await _context.AccountRoles
                    .Where(ar => ar.AccountId == accountId && ar.BusinessEntityName == businessEntityName)
                    .Select(ar => (long?)ar.RoleId)
                    .FirstOrDefaultAsync();

                if (roleId.HasValue)
                {
                    return roleId;
                }

                // Fallback to legacy Account.RoleId for backward compatibility
                var legacyRoleId = await _context.Accounts
                    .Where(a => a.Id == accountId && a.IsActive)
                    .Select(a => (long?)a.RoleId)
                    .FirstOrDefaultAsync();

                return legacyRoleId;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting account role id for account {accountId} in entity {businessEntityName}: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Checks if a user has a specific role by role ID (matching prior Roles table ID-based logic)
        /// </summary>
        public async Task<bool> UserHasRoleIdAsync(long userId, long roleId, string businessEntityName = "CapstoneProject")
        {
            try
            {
                var exists = await _context.AccountRoles
                    .Where(ar => ar.AccountId == userId && ar.BusinessEntityName == businessEntityName && ar.RoleId == roleId)
                    .AnyAsync();
                return exists;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error checking user role by ID: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Gets the role ID for a given role name
        /// </summary>
        /// <param name="roleName">The role name to look up</param>
        /// <returns>The role ID or null if not found</returns>
        public async Task<long?> GetRoleIdAsync(string roleName)
        {
            try
            {
                var roleId = await _context.Roles
                    .Where(r => r.RoleName == roleName)
                    .Select(r => r.Id)
                    .FirstOrDefaultAsync();

                return roleId > 0 ? roleId : null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting role ID for name {roleName}: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Checks if a user has a specific role by role name
        /// </summary>
        /// <param name="userId">The user ID to check</param>
        /// <param name="roleName">The role name to check for</param>
        /// <returns>True if user has the role, false otherwise</returns>
        public async Task<bool> UserHasRoleAsync(long userId, string roleName)
        {
            try
            {
                var userRoleName = await _context.AccountRoles
                    .Where(ar => ar.AccountId == userId && ar.BusinessEntityName == "CapstoneProject")
                    .Join(_context.Roles,
                          ar => ar.RoleId,
                          r => r.Id,
                          (ar, r) => r.RoleName)
                    .FirstOrDefaultAsync();

                return string.Equals(userRoleName ?? string.Empty, roleName, StringComparison.OrdinalIgnoreCase);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error checking user role: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Gets all available roles
        /// </summary>
        /// <returns>List of role names</returns>
        public async Task<List<string>> GetAllRolesAsync()
        {
            try
            {
                var roles = await _context.Roles
                    .Select(r => r.RoleName)
                    .ToListAsync();

                return roles;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting all roles: {ex.Message}");
                return new List<string>();
            }
        }


        /// <summary>
        /// Clears the role cache (useful for testing or when roles are updated)
        /// </summary>
        public void ClearCache()
        {
            _roleCache.Clear();
        }
    }
}