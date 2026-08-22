using AttendanceBehaviour_Backend.Models;
using System.Collections.Generic;
using System.Security.Claims;

namespace AttendanceBehaviour_Backend.Interfaces
{
    public interface INotificationRepository
    {
        Task<List<Notification>> GetAllNotificationsAsync();
        Task<Notification> GetNotificationByIdAsync(long id);
        Task AddNotificationAsync(Notification notification);

        Task<bool> MarkAsReadAsync(long id);

        Task UpdateNotificationAsync(Notification notification);
        Task DeleteNotificationAsync(long id);
        Task ClearAllNotificationsAsync();

    }
}
