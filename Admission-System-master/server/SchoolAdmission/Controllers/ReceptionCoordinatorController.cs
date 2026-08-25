using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SchoolAdmission.DTOs;
using SchoolAdmission.Services;
using SchoolAdmission.Repos.IRepos;
using SchoolAdmission.Models;

[ApiController]
[Route("api/reception-coordinator")]
[Authorize]
public class ReceptionCoordinatorController : ControllerBase
{
    private readonly IStudentRepo _studentRepo;
    private readonly IGenericRepo<AdmissionProfile> _admissionProfileRepo;

    public ReceptionCoordinatorController(IStudentRepo studentRepo, IGenericRepo<AdmissionProfile> admissionProfileRepo)
    {
        _studentRepo = studentRepo;
        _admissionProfileRepo = admissionProfileRepo;
    }

    [HttpPost("register-student")]
    public async Task<IActionResult> RegisterStudent([FromBody] StudentRegisterDTO dto)
    {
        try
        {
            var studentExists = await _studentRepo.studentExistsAsync(dto.NationalId);
            if (studentExists)
            {
                return BadRequest("Student with this National ID already exists.");
            }
            if (dto.NationalId.Length != 14)
            {
                return BadRequest("National ID must be 14 digits.");
            }
            if (dto.StudentName.Length < 3)
            {
                return BadRequest("Student name must be at least 3 characters.");
            }
            if (dto.StudentName.Length > 100)
            {
                return BadRequest("Student name must be less than 100 characters.");
            }
            if (dto.IsAcceptanceLetterReceived && dto.MinistryExamPercentage == 0)
            {
                return BadRequest("Ministry exam percentage is required when acceptance letter is received.");
            }

            if (dto.MinistryExamPercentage < 0 || dto.MinistryExamPercentage > 100)
            {
                return BadRequest("Ministry exam percentage must be between 0 and 100.");
            }


            var roleId = await _studentRepo.getStudentRoleIdAsync("Applicant");
            if (roleId == -1)
            {
                return BadRequest("Student role not found.");
            }
            var newStudent = new Account
            {
                NationalId = dto.NationalId,
                Email = $"{dto.NationalId}@student.com",
                FullNameEn = dto.StudentName,
                FullNameAr = dto.StudentName,
                RoleId = roleId,
                IsActive = true,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NationalId)
            };
            await _studentRepo.AddAsync(newStudent);
            await _studentRepo.SaveChangesAsync();

            var admissionProfile = new AdmissionProfile
            {
                AccountId = newStudent.Id,
                DateOfBirth = DateOnly.Parse(dto.DateOfBirth),
                MathScore = dto.MathScore,
                EnglishScore = dto.EnglishScore,
                ThirdPrepScore = dto.FinalYearScore,
                IsAcceptanceLetterReceived = dto.IsAcceptanceLetterReceived,
                MinistryExamPercentage = dto.MinistryExamPercentage,
                StatusId = 1 // Default status (Pending)
            };
            await _admissionProfileRepo.AddAsync(admissionProfile);
            await _admissionProfileRepo.SaveChangesAsync();



            return Ok(ApiResponse.SuccessResult(new
            {
                accountId = newStudent.Id,
                email = newStudent.Email,
                defaultPassword = dto.NationalId,
                studentName = dto.StudentName,
                isAcceptanceLetterReceived = dto.IsAcceptanceLetterReceived,
                ministryExamPercentage = dto.MinistryExamPercentage
            }, "Student registered successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("An error occurred while registering student", ex.Message));
        }
    }

    [HttpGet("students")]
    public async Task<IActionResult> GetStudents()
    {
        // i should have gim him less data rather than giving him the whole record of account
        try
        {
            var students = await _studentRepo.getAllStudentsAsync();

            return Ok(students);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("An error occurred while retrieving students", ex.Message));
        }
    }
}
