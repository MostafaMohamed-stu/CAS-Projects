using Microsoft.AspNetCore.Mvc;
using AttendanceBehaviour_Backend.DTOs;
using AttendanceBehaviour_Backend.Interfaces;
using AttendanceBehaviour_Backend.Models;
using System;

namespace AttendanceBehaviour_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportRepository _repository;
        private readonly INotificationRepository _notificationRepository;

        public ReportsController(IReportRepository repository, INotificationRepository notificationRepository)
        {
            _repository = repository;
            _notificationRepository = notificationRepository;
        }

        // GET /api/reports
        [HttpGet("GetReports")]
        public async Task<IActionResult> GetReports()
        {
            var reports = await _repository.GetAllReportsAsync();
            return Ok(reports);
        }

        // POST /api/reports
        [HttpPost]
        public async Task<IActionResult> SubmitReport([FromBody] CreateReportDto reportDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var report = new ReportSpecialist
                {
                    StudentName = reportDto.StudentName,
                    Description = reportDto.Description,
                    SpecialistSignature = reportDto.SpecialistSignature,
                    // Date and "Pending" status are set by the model's constructor
                };

                Console.WriteLine($"Creating report for student: {reportDto.StudentName}");
                var createdReport = await _repository.CreateReportAsync(report);
                Console.WriteLine($"ReportSpecialist created with ID: {createdReport.Id}");

                // Create notification for managers after successful report creation
                Console.WriteLine("Creating notification...");
                await CreateReportNotificationAsync(reportDto.StudentName);
                Console.WriteLine("Notification creation completed");

                // Return a 201 Created status with the new report object
                return CreatedAtAction(nameof(GetReports), new { id = createdReport.Id }, createdReport);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SubmitReport: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "An error occurred while submitting the report.", error = ex.Message });
            }
        }

        // PUT /api/reports/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateReportStatus(int id, [FromBody] UpdateReportStatusDto statusDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

                                                                                                            // Validate the status to prevent incorrect values
            if (statusDto.Status != "Accepted" && statusDto.Status != "Declined" && statusDto.Status != "Pending")
            {
                return BadRequest("Status must be 'Accepted', 'Declined', or 'Pending'.");
            }

            var success = await _repository.UpdateReportStatusAsync(id, statusDto.Status);

            if (!success)
            {
                return NotFound("ReportSpecialist not found.");
            }

            return NoContent(); // Success
        }

        private async Task CreateReportNotificationAsync(string studentName)
        {
            try
            {
                Console.WriteLine($"Starting notification creation for student: {studentName}");
                
                var notification = new Notification
                {
                    Title = "New Specialist ReportSpecialist Submitted",
                    Message = $"A new report for student {studentName} is awaiting your review.",
                    AccountId = null, // null means it's a general notification (broadcast to all managers)
                    ReadStatusId = 0, // 0 = Unread
                    CreatedAt = DateTime.Now
                };

                Console.WriteLine($"Notification object created: Title={notification.Title}, Message={notification.Message}");
                
                await _notificationRepository.AddNotificationAsync(notification);
                Console.WriteLine("Notification successfully added to database");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to create notification: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                // Don't throw the exception to avoid failing the report creation
            }
        }
    }
}
