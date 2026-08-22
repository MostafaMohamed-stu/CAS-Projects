using Microsoft.EntityFrameworkCore;
using AttendanceBehaviour_Backend.Data;
//using AttendanceBehaviour_Backend.DATA;
using AttendanceBehaviour_Backend.DTOs;
using AttendanceBehaviour_Backend.Interfaces;
using AttendanceBehaviour_Backend.Models;
using System.Text.Json;

namespace AttendanceBehaviour_Backend.Repos
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly ElsewedySchoolContext _context;
        public NotificationRepository(ElsewedySchoolContext context)
        {
            _context = context;
        }


        public async Task<List<Notification>> GetAllNotificationsAsync()
        {
            var notifications = await _context.Notifications.ToListAsync();
            return notifications;
        }

        public async Task<Notification> GetNotificationByIdAsync(long id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            return notification;
        }

        public async Task AddNotificationAsync(Notification notification)
        {
            try
            {
                Console.WriteLine($"NotificationRepository: Adding notification - Title: {notification.Title}");
                Console.WriteLine($"NotificationRepository: Notification details - AccountId: {notification.AccountId}, ReadStatusId: {notification.ReadStatusId}");
                
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
                
                Console.WriteLine($"NotificationRepository: Notification saved successfully with ID: {notification.Id}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"NotificationRepository Error: {ex.Message}");
                Console.WriteLine($"NotificationRepository Stack trace: {ex.StackTrace}");
                throw; // Re-throw to let the controller handle it
            }
        }

        public async Task UpdateNotificationAsync(Notification notification)
        {
            // Fetch the existing notification from your data source (e.g., database)
            var existingNotification = await _context.Notifications.FindAsync(notification.Id);
            if (existingNotification != null)
            {
                existingNotification.Title = notification.Title;
                existingNotification.Message = notification.Message;
                existingNotification.AccountId = notification.AccountId;
                existingNotification.ReadStatusId = notification.ReadStatusId;
                // Don't update CreatedAt - keep original creation time

                await _context.SaveChangesAsync();
            }
        }


        public async Task DeleteNotificationAsync(long id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification != null)
            {
                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();
            }
        }


        public async Task<bool> MarkAsReadAsync(long notificationId)
        {
            try
            {
                Console.WriteLine($"Repository: Attempting to mark notification {notificationId} as read");
                
                // 1. Find the notification in the database by its ID
                var notification = await _context.Notifications.FindAsync(notificationId);

                // 2. Check if it was found
                if (notification == null)
                {
                    Console.WriteLine($"Repository: Notification {notificationId} not found");
                    return false; // Not found, so we can't update it
                }

                Console.WriteLine($"Repository: Found notification {notificationId}. Current ReadStatusId: {notification.ReadStatusId}");
                
                // 3. Update the property
                notification.ReadStatusId = 1;
                Console.WriteLine($"Repository: Set ReadStatusId to 1 for notification {notificationId}");

                // 4. Save the changes to the database
                await _context.SaveChangesAsync();
                Console.WriteLine($"Repository: Successfully saved changes for notification {notificationId}");

                return true; // Success!
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Repository: Error marking notification {notificationId} as read: {ex.Message}");
                Console.WriteLine($"Repository: Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task ClearAllNotificationsAsync()
        {
            try
            {
                var allNotifications = await _context.Notifications.ToListAsync();
                _context.Notifications.RemoveRange(allNotifications);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error clearing all notifications: {ex.Message}");
                throw;
            }
        }
    }
}
