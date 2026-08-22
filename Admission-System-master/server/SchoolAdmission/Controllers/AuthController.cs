using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.DTOs;
using SchoolAdmission.Services;
using SchoolAdmission.Repos.IRepos;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthRepo _authRepo;
    public AuthController(IAuthRepo authRepo)
    {
        _authRepo = authRepo;
    }

    [HttpPost("reception-coordinator/login")]
    public async Task<IActionResult> ReceptionCoordinatorLogin([FromBody] ReceptionCoordinatorLoginDTO coordinator)
    {
        try
        {
            if (string.IsNullOrEmpty(coordinator.Email) || string.IsNullOrEmpty(coordinator.Password))
                return BadRequest("Email and password are required");

            var isValidLogin = await _authRepo
            .isValidLoginWithInclude(coordinator.Email, coordinator.Password);

            if (isValidLogin == null)
            {
                return BadRequest("Invalid email or password");
            }

            var roleName = await _authRepo.GetEffectiveRoleNameForLoginAsync(isValidLogin.Account.Id);
            
            if (roleName != "ReceptionCoordinator")
            {
                return BadRequest("Invalid account type");
            }

            var token = await _authRepo.GenerateJwtTokenAsync(isValidLogin.Account);
            return Ok(new { token, role = roleName });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("An error occurred during login", ex.Message));
        }
    }
        

    [HttpPost("admin/login")]
    public async Task<IActionResult> AdminLogin([FromBody] AdminLoginDTO admin)
    {
        try
        {
            if (string.IsNullOrEmpty(admin.Email) || string.IsNullOrEmpty(admin.Password))
                return BadRequest("Email and password are required");

            // check for email, password
            var isValidLogin = await _authRepo
            .isValidLoginWithInclude(admin.Email, admin.Password);

            if (isValidLogin == null)
            {
                return BadRequest("Invalid email or password");
            }

            var roleName = await _authRepo.GetEffectiveRoleNameForLoginAsync(isValidLogin.Account.Id);
            
            if (roleName == null || (roleName != "Interviewer" && roleName != "Board" && roleName != "SuperAdmin" && roleName != "StudentAffair"))
            {
                return BadRequest("Invalid account type");
            }

            var token = await _authRepo.GenerateJwtTokenAsync(isValidLogin.Account);
            return Ok(new { token, role = roleName });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("An error occurred during login", ex.Message));
        }
    }






    [HttpPost("create-reception-coordinator")]
    public async Task<IActionResult> CreateReceptionCoordinator([FromBody] CreateReceptionCoordinatorDTO dto)
    {
        try
        {
            if (string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Password))
                return BadRequest("Email and password are required");

            var account = await _authRepo.CreateReceptionCoordinatorAccount(dto);
            return Ok(ApiResponse.SuccessResult(new { accountId = account }, "Reception Coordinator account created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("An error occurred while creating reception coordinator account", ex.Message));
        }
    }


    [HttpPost("create-interviewer")]
    public async Task<IActionResult> CreateInterviewer([FromBody] CreateInterviewerDTO dto)
    {
        try
        {
            if (string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Password))
                return BadRequest("Email and password are required");

            var account = await _authRepo.CreateInterviewerAccount(dto);
            return Ok(ApiResponse.SuccessResult(new { accountId = account }, "Interviewer account created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("An error occurred while creating interviewer account", ex.Message));
        }
    }



    [HttpPost("create-superadmin")]
    public async Task<IActionResult> CreateSuperAdmin([FromBody] CreateSuperAdminDTO dto)
    {
        try
        {
            if (string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Password))
                return BadRequest("Email and password are required");

            var account = await _authRepo.CreateSuperAdminAccount(dto);
            return Ok(ApiResponse.SuccessResult(new { accountId = account }, "Board account created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("An error occurred while creating superadmin account", ex.Message));
        }
    }

    [HttpPost("create-board")]
    public async Task<IActionResult> CreateBoard([FromBody] CreateBoardDTO dto)
    {
        try
        {
            if (string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Password))
                return BadRequest("Email and password are required");

            var account = await _authRepo.CreateBoardAccount(dto);
            return Ok(ApiResponse.SuccessResult(new { accountId = account }, "Board account created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("An error occurred while creating board account", ex.Message));
        }
    }

    [HttpPost("create-student-affair")]
    public async Task<IActionResult> CreateStudentAffair([FromBody] CreateStudentAffairDTO dto)
    {
        try
        {
            if (string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Password))
                return BadRequest("Email and password are required");

            var account = await _authRepo.CreateStudentAffairAccount(dto);
            return Ok(ApiResponse.SuccessResult(new { accountId = account }, "Student Affair account created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("An error occurred while creating student affair account", ex.Message));
        }
    }





}
