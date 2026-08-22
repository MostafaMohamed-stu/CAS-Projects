using Microsoft.AspNetCore.Mvc;
using AttendanceBehaviour_Backend.DTOs;      // Your Data Transfer Objects
using AttendanceBehaviour_Backend.Interfaces; // Your IAuthService interface


namespace AttendanceBehaviour_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        // The service is correctly injected here using Dependency Injection
        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("check")]
        public async Task<IActionResult> CheckUser([FromBody] CheckuserDTO dto)
        {
            if ( string.IsNullOrEmpty(dto.NationalID))
                return BadRequest("  ????? ?????? ??? ?????.");

            var result = await _authService.CheckUserAsync(dto.NationalID);
            return Ok(result);
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);

            if (result == "Email not registered." || result == "Incorrect password.")
                return Unauthorized(new { message = result });

            return Ok(new { token = result });
        }

        [HttpPost("signup")]
        public async Task<IActionResult> Signup(RegisterDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Get the account ID after registration
            var (result, accountId) = await _authService.SignupAsyncWithId(dto);

            if (result == "Registration successful.")
                return Ok(new { message = result, accountId = accountId });

            return BadRequest(new { message = result });
        }
    }
}
