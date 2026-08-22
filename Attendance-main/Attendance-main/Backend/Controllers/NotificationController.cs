using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using AttendanceBehaviour_Backend.DTOs;
using AttendanceBehaviour_Backend.Interfaces;
using AttendanceBehaviour_Backend.Models;
using AttendanceBehaviour_Backend.Services;

namespace AttendanceBehaviour_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IFcmTokenStore _fcmStore;
        private readonly IFcmSender _fcmSender;

        public NotificationController(INotificationRepository notificationRepository, IFcmTokenStore fcmStore, IFcmSender fcmSender)
        {
            _notificationRepository = notificationRepository;
            _fcmStore = fcmStore;
            _fcmSender = fcmSender;
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllNotifications()
        {
            try
            {
                var notifications = await _notificationRepository.GetAllNotificationsAsync();
                Console.WriteLine($"Fetched {notifications.Count} notifications from database");
                
                foreach (var notification in notifications)
                {
                    Console.WriteLine($"Notification {notification.Id}: Title='{notification.Title}', ReadStatusId={notification.ReadStatusId}");
                }
                
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching notifications: {ex.Message}");
                return StatusCode(500, new { Message = "An error occurred while fetching notifications.", Error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetNotificationById(long id)
        {
            var notification = await _notificationRepository.GetNotificationByIdAsync(id);

            if (notification == null)
            {
                return NotFound();
            }

            return Ok(notification);
        }

        [HttpPost]
        public async Task<IActionResult> AddNotification([FromBody] CreateNotificationDto notificationDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var notification = new Notification
            {
                Title = notificationDto.Title,
                Message = notificationDto.Message,
                AccountId = notificationDto.AccountId,
                ReadStatusId = 0, // 0 = Unread
                CreatedAt = DateTime.Now
            };

            await _notificationRepository.AddNotificationAsync(notification);

            // Send push notification if accountId is provided
            if (notification.AccountId.HasValue)
            {
                var tokens = await _fcmStore.GetTokensByUserIdsAsync(new[] { notification.AccountId.Value });
                if (tokens.Any())
                {
                    await _fcmSender.SendNotificationAsync(tokens, notification.Title, notification.Message);
                }
            }

            return Ok(new { message = "Notification added successfully." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNotification(long id, [FromBody] Notification notification)
        {
            if (id != notification.Id)
            {
                return BadRequest("ID in URL does not match ID in notification object");
            }

            await _notificationRepository.UpdateNotificationAsync(notification);
            return Ok(new { message = "Notification updated successfully." });
        }

        [HttpPut("{id}/read")] // e.g., PUT /api/Notification/5/read
        public async Task<IActionResult> MarkNotificationAsRead(long id)
        {
            try
            {
                Console.WriteLine($"Attempting to mark notification {id} as read");
                
                // Check if notification exists
                var notification = await _notificationRepository.GetNotificationByIdAsync(id);
                if (notification == null)
                {
                    Console.WriteLine($"Notification {id} not found");
                    return NotFound(new { Message = "Notification not found." });
                }
                
                Console.WriteLine($"Notification {id} found. Current ReadStatusId: {notification.ReadStatusId}");
                
                // Mark as read
                var success = await _notificationRepository.MarkAsReadAsync(id);
                
                if (success)
                {
                    Console.WriteLine($"Notification {id} successfully marked as read");
                    return NoContent(); // Success
                }
                else
                {
                    Console.WriteLine($"Failed to mark notification {id} as read");
                    return StatusCode(500, new { Message = "Failed to update notification status." });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error marking notification {id} as read: {ex.Message}");
                return StatusCode(500, new { Message = "An error occurred while updating notification status.", Error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(long id)
        {
            await _notificationRepository.DeleteNotificationAsync(id);
            return Ok(new { message = "Notification deleted successfully." });
        }

        [HttpDelete("clear-all")]
        public async Task<IActionResult> ClearAllNotifications()
        {
            try
            {
                await _notificationRepository.ClearAllNotificationsAsync();
                return Ok(new { message = "All notifications cleared successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while clearing notifications.", error = ex.Message });
            }
        }
    }
}
