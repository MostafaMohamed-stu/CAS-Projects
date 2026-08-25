using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using Elsewedy_Capstone_System.Services.Interfaces;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AccountController : ControllerBase
    {
        private readonly IAccountService _accountService;

        public AccountController(IAccountService accountService)
        {
            _accountService = accountService;
        }

        [HttpGet("Roles/Capstone")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> GetCapstoneRoles()
        {
            try
            {
                var result = await _accountService.GetCapstoneRolesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("CreateStaffAdmin")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,CapstoneLead")]
        public async Task<IActionResult> CreateStaffAdminAccount([FromBody] CreateStaffAdminRequest request)
        {
            try
            {
                var (result, error) = await _accountService.CreateStaffAdminAccountAsync(
                    request.FullNameEn, request.FullNameAr, request.Email, request.Password, request.Phone, request.RoleName, request.ClassId);
                if (error != null) return BadRequest(new { message = error });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("CreateSimple")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> CreateSimpleAccount([FromBody] CreateSimpleAccountRequest request)
        {
            try
            {
                var callerRole = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                var (result, error) = await _accountService.CreateSimpleAccountAsync(
                    request.FullNameEn, request.FullNameAr, request.Email, request.Password, request.Phone,
                    request.NationalId, request.RoleId, request.RoleName, request.ClassId, callerRole);
                if (error != null)
                {
                    if (error == "Forbidden") return Forbid();
                    return BadRequest(new { message = error });
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("LoginStatus")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,CapstoneLead")]
        public async Task<IActionResult> GetLoginStatus()
        {
            try
            {
                var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                var result = await _accountService.GetLoginStatusAsync(clientIp);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("Login")]
        [AllowAnonymous]
        [EnableRateLimiting("simple-login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var (result, error) = await _accountService.LoginAsync(request.Email, request.Password);
                if (error != null)
                {
                    if (error.Contains("locked")) return Unauthorized(new { message = error });
                    return Unauthorized(new { message = error });
                }
                Response.Cookies.Append("refreshToken", ((dynamic)result!).refreshToken, new CookieOptions
                {
                    HttpOnly = true, Secure = false, SameSite = SameSiteMode.Lax,
                    Expires = DateTime.UtcNow.AddDays(7), Path = "/"
                });
                return Ok(new { accessToken = ((dynamic)result!).accessToken, user = ((dynamic)result!).user, message = ((dynamic)result!).message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Login error", error = ex.Message });
            }
        }

        [HttpPost("Refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> Refresh()
        {
            try
            {
                var refreshToken = Request.Cookies["refreshToken"];
                var (result, error) = await _accountService.RefreshAsync(refreshToken);
                if (error != null) return Unauthorized(new { message = error });
                Response.Cookies.Append("refreshToken", ((dynamic)result!).refreshToken, new CookieOptions
                {
                    HttpOnly = true, Secure = false, SameSite = SameSiteMode.Lax,
                    Expires = DateTime.UtcNow.AddDays(7), Path = "/"
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Refresh error", error = ex.Message });
            }
        }

        [HttpPost("Logout")]
        [AllowAnonymous]
        public Task<IActionResult> Logout()
        {
            Response.Cookies.Delete("refreshToken", new CookieOptions { HttpOnly = true, Secure = false, SameSite = SameSiteMode.Lax, Path = "/" });
            return Task.FromResult<IActionResult>(Ok(new { message = "Logged out" }));
        }

        [HttpGet("StaffAdmin/All")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,CapstoneLead")]
        public async Task<IActionResult> GetAllAccountsForStaffAdmin()
        {
            try
            {
                var result = await _accountService.GetAllAccountsForStaffAdminAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error", error = ex.Message });
            }
        }

        [HttpGet("CurrentUser")]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var accountId);
                var result = await _accountService.GetCurrentUserAsync(accountId);
                if (result == null) return NotFound();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAccount(long id)
        {
            try
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
                var normalizedRole = role.Replace(" ", string.Empty, StringComparison.OrdinalIgnoreCase);
                long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId);

                if (!normalizedRole.Equals("SuperAdmin") && !normalizedRole.Equals("Board") &&
                    !normalizedRole.Equals("StaffAdmin") && !normalizedRole.Equals("CapstoneLead") && userId != id)
                    return Forbid();

                var result = await _accountService.GetAccountAsync(id);
                if (result == null) return NotFound("Account not found");
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("ByRoleName/{roleName}")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,CapstoneLead,Engineer")]
        public async Task<IActionResult> GetAccountsByRoleName(string roleName)
        {
            try
            {
                var result = await _accountService.GetAccountsByRoleNameAsync(roleName);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("Reviewers/ByClass/{classId}")]
        public async Task<IActionResult> GetReviewersByClass(long classId)
        {
            try
            {
                var result = await _accountService.GetReviewersByClassAsync(classId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("CapstoneSupervisors")]
        public async Task<IActionResult> GetCapstoneSupervisors()
        {
            try
            {
                var result = await _accountService.GetCapstoneSupervisorsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("AssignEngineerToClass")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,CapstoneLead")]
        public async Task<IActionResult> AssignEngineerToClass([FromBody] AssignEngineerRequest request)
        {
            try
            {
                var (success, error) = await _accountService.AssignEngineerToClassAsync(request.AccountId, request.ClassId);
                if (!success) return NotFound(new { error });
                return Ok(new { message = "Engineer assigned to class successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("AssignReviewerToClass")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,CapstoneLead")]
        public async Task<IActionResult> AssignReviewerToClass([FromBody] AssignReviewerRequest request)
        {
            try
            {
                var (success, error) = await _accountService.AssignReviewerToClassAsync(request.AccountId, request.ClassId);
                if (!success) return NotFound(new { error });
                return Ok(new { message = "Reviewer assigned to class successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("RemoveAssignment/{accountId}")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,CapstoneLead")]
        public async Task<IActionResult> RemoveAssignment(long accountId)
        {
            try
            {
                var (success, error) = await _accountService.RemoveAssignmentAsync(accountId);
                if (!success) return NotFound(new { error });
                return Ok(new { message = "Assignment removed successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,CapstoneLead")]
        public async Task<IActionResult> UpdateAccount(long id, [FromBody] UpdateAccountRequest request)
        {
            try
            {
                var (success, error) = await _accountService.UpdateAccountAsync(id, request.FullNameEn, request.FullNameAr, request.Email, request.Phone, request.RoleName, request.ClassId, request.Password);
                if (!success) return NotFound(new { message = error });
                return Ok(new { message = "Account updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,CapstoneLead")]
        public async Task<IActionResult> DeleteAccount(long id)
        {
            try
            {
                var (success, error) = await _accountService.DeleteAccountAsync(id);
                if (!success) return NotFound(new { message = error });
                return Ok(new { message = "Account deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("CreateTestEngineers")]
        [Authorize(Roles = "SuperAdmin,Board")]
        public async Task<IActionResult> CreateTestEngineers()
        {
            try
            {
                var (result, error) = await _accountService.CreateTestEngineersAsync();
                if (error != null) return BadRequest(new { message = error });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("GetUnregisteredStudents")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,CapstoneLead")]
        public async Task<IActionResult> GetUnregisteredStudents()
        {
            try
            {
                var result = await _accountService.GetUnregisteredStudentsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("CheckStudent/{accountId}")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board")]
        public async Task<IActionResult> CheckStudent(long accountId)
        {
            try
            {
                var result = await _accountService.CheckStudentAsync(accountId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("GetUnregisteredStudents/Test")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board")]
        public async Task<IActionResult> GetUnregisteredStudentsTest()
        {
            try
            {
                var result = await _accountService.GetUnregisteredStudentsTestAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("AddStudentsToCapstone")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board")]
        public async Task<IActionResult> AddStudentsToCapstone([FromBody] AddStudentsToCapstoneRequest request)
        {
            try
            {
                if (request.StudentIds == null || request.StudentIds.Count == 0)
                    return BadRequest(new { message = "StudentIds list cannot be empty" });
                var (added, skipped, error) = await _accountService.AddStudentsToCapstoneAsync(request.StudentIds);
                if (error != null) return BadRequest(new { message = error });
                return Ok(new { message = $"Added {added}, skipped {skipped}", addedCount = added, skippedCount = skipped });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("GetAllAccounts")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,CapstoneLead")]
        public async Task<IActionResult> GetAllAccounts([FromQuery] int? page = null, [FromQuery] int? pageSize = null, [FromQuery] string? search = null)
        {
            try
            {
                var result = await _accountService.GetAllAccountsAsync(page, pageSize, search);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("GetAllRoles")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,CapstoneLead")]
        public async Task<IActionResult> GetAllRoles()
        {
            try
            {
                var result = await _accountService.GetAllRolesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("GetBusinessEntities")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board")]
        public async Task<IActionResult> GetBusinessEntities()
        {
            try
            {
                var result = await _accountService.GetBusinessEntitiesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("AddRolesToAccounts")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board")]
        public async Task<IActionResult> AddRolesToAccounts([FromBody] AddRolesToAccountsRequest request)
        {
            try
            {
                if (request.AccountIds == null || request.AccountIds.Count == 0)
                    return BadRequest(new { message = "AccountIds list cannot be empty" });
                if (string.IsNullOrWhiteSpace(request.RoleName))
                    return BadRequest(new { message = "RoleName required" });
                if (string.IsNullOrWhiteSpace(request.BusinessEntityName))
                    return BadRequest(new { message = "BusinessEntityName required" });

                var (added, skipped, error) = await _accountService.AddRolesToAccountsAsync(request.AccountIds, request.RoleName, request.BusinessEntityName);
                if (error != null) return BadRequest(new { message = error });
                return Ok(new { message = $"Added {added}, skipped {skipped}", addedCount = added, skippedCount = skipped });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

    }
}
