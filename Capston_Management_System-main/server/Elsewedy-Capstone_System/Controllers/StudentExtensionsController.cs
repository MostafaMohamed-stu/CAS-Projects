using Microsoft.AspNetCore.Mvc;
using Elsewedy_Capstone_System.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Elsewedy_Capstone_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StudentExtensionsController : ControllerBase
    {
        private readonly IStudentExtensionService _studentExtensionService;

        public StudentExtensionsController(IStudentExtensionService studentExtensionService)
        {
            _studentExtensionService = studentExtensionService;
        }

        [HttpGet]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> GetStudentExtensions()
        {
            try
            {
                var result = await _studentExtensionService.GetStudentExtensionsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("WithAccountDetails")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> GetStudentsWithAccountDetails()
        {
            try
            {
                var result = await _studentExtensionService.GetStudentsWithAccountDetailsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetStudentExtension(long id)
        {
            try
            {
                var result = await _studentExtensionService.GetStudentExtensionAsync(id);
                if (result == null) return NotFound();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> PostStudentExtension([FromBody] StudentExtensionDto request)
        {
            try
            {
                var (result, error) = await _studentExtensionService.CreateStudentExtensionAsync(request.AccountId, request.ClassId, request.IsLeader, request.StatusId);
                if (error != null) return BadRequest(new { message = error });
                return CreatedAtAction(nameof(GetStudentExtension), new { id = result!.AccountId }, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> PutStudentExtension(long id, [FromBody] StudentExtensionDto request)
        {
            try
            {
                var (success, error) = await _studentExtensionService.UpdateStudentExtensionAsync(id, request.ClassId, request.IsLeader, request.StatusId);
                if (!success) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "StaffAdmin,SuperAdmin,Board,Engineer,CapstoneLead")]
        public async Task<IActionResult> DeleteStudentExtension(long id)
        {
            try
            {
                var (success, error) = await _studentExtensionService.DeleteStudentExtensionAsync(id);
                if (!success) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class StudentExtensionDto
        {
            public long AccountId { get; set; }
            public long? ClassId { get; set; }
            public bool IsLeader { get; set; }
            public int StatusId { get; set; } = 1;
        }
    }
}
