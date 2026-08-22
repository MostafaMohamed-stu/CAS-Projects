using System.Text.Json;
using AttendanceBehaviour_Backend.Models;

namespace AttendanceBehaviour_Backend.Services
{
    public class NotificationItem
    {
        public long Id { get; set; }
        public long RecipientUserId { get; set; }
        public string Message { get; set; } = string.Empty;
        public long? ClassId { get; set; }
        public int[]? SessionsMissing { get; set; }
        public string Date { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public interface INotificationFileStore
    {
        Task<IReadOnlyList<NotificationItem>> GetForUserAsync(long userId);
        Task AddAsync(IEnumerable<NotificationItem> items);
        Task MarkAsReadAsync(long userId, long notificationId);
        Task ClearForUserAsync(long userId);
    }

    public class NotificationFileStore : INotificationFileStore
    {
        private readonly string _filePath;
        private static readonly SemaphoreSlim _mutex = new(1, 1);
        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };

        public NotificationFileStore(IWebHostEnvironment env)
        {
            var dataDir = Path.Combine(env.ContentRootPath, "App_Data");
            if (!Directory.Exists(dataDir))
            {
                Directory.CreateDirectory(dataDir);
            }
            _filePath = Path.Combine(dataDir, "notifications.json");
            if (!File.Exists(_filePath))
            {
                File.WriteAllText(_filePath, "[]");
            }
        }

        public async Task<IReadOnlyList<NotificationItem>> GetForUserAsync(long userId)
        {
            await _mutex.WaitAsync();
            try
            {
                var list = await ReadAllAsync();
                return list.Where(n => n.RecipientUserId == userId)
                           .OrderByDescending(n => n.CreatedAt)
                           .ToList();
            }
            finally
            {
                _mutex.Release();
            }
        }

        public async Task AddAsync(IEnumerable<NotificationItem> items)
        {
            await _mutex.WaitAsync();
            try
            {
                var list = await ReadAllAsync();
                var now = DateTime.UtcNow;
                long nextId = list.Count == 0 ? 1 : list.Max(n => n.Id) + 1;
                foreach (var item in items)
                {
                    item.Id = nextId++;
                    item.CreatedAt = now;
                    item.IsRead = false;
                    list.Add(item);
                }
                await WriteAllAsync(list);
            }
            finally
            {
                _mutex.Release();
            }
        }

        public async Task MarkAsReadAsync(long userId, long notificationId)
        {
            await _mutex.WaitAsync();
            try
            {
                var list = await ReadAllAsync();
                var target = list.FirstOrDefault(n => n.Id == notificationId && n.RecipientUserId == userId);
                if (target != null)
                {
                    target.IsRead = true;
                    await WriteAllAsync(list);
                }
            }
            finally
            {
                _mutex.Release();
            }
        }

        public async Task ClearForUserAsync(long userId)
        {
            await _mutex.WaitAsync();
            try
            {
                var list = await ReadAllAsync();
                list.RemoveAll(n => n.RecipientUserId == userId);
                await WriteAllAsync(list);
            }
            finally
            {
                _mutex.Release();
            }
        }

        private async Task<List<NotificationItem>> ReadAllAsync()
        {
            try
            {
                using var fs = File.OpenRead(_filePath);
                if (fs.Length == 0) return new List<NotificationItem>();
                var items = await JsonSerializer.DeserializeAsync<List<NotificationItem>>(fs, _jsonOptions);
                return items ?? new List<NotificationItem>();
            }
            catch
            {
                return new List<NotificationItem>();
            }
        }

        private async Task WriteAllAsync(List<NotificationItem> items)
        {
            using var fs = File.Create(_filePath);
            await JsonSerializer.SerializeAsync(fs, items, _jsonOptions);
        }
    }
}
