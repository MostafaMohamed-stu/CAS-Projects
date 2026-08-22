// --- File: Interfaces/IJwtService.cs ---

using AttendanceBehaviour_Backend.Models;
using System.Collections.Generic;
using System.Security.Claims;

namespace AttendanceBehaviour_Backend.Interfaces
{
    public interface IJwtService
    {
        // FIX: The method now accepts a list of claims directly instead of a User object.
        string GenerateToken(Account user);
    }
}
