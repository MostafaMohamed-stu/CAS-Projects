using System.Text.Json;

namespace AttendanceBehaviour_Backend.Services
{
    public class PushSubscriptionDto
    {
        public long UserId { get; set; }
        public string Endpoint { get; set; } = string.Empty;
        public string P256dh { get; set; } = string.Empty;
        public string Auth { get; set; } = string.Empty;
    }

    public interface IPushSubscriptionStore
    {
        Task AddOrUpdateAsync(PushSubscriptionDto subscription);
        Task RemoveAsync(long userId, string endpoint);
        Task RemoveAllForUserAsync(long userId);
        Task<IReadOnlyList<PushSubscriptionDto>> GetByUserIdsAsync(IEnumerable<long> userIds);
    }

    public class PushSubscriptionFileStore : IPushSubscriptionStore
    {
        private readonly string _filePath;
        private static readonly SemaphoreSlim _mutex = new(1, 1);
        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };

        public PushSubscriptionFileStore(IWebHostEnvironment env)
        {
            var dataDir = Path.Combine(env.ContentRootPath, "App_Data");
            if (!Directory.Exists(dataDir))
            {
                Directory.CreateDirectory(dataDir);
            }
            _filePath = Path.Combine(dataDir, "push_subscriptions.json");
            if (!File.Exists(_filePath))
            {
                File.WriteAllText(_filePath, "[]");
            }
        }

        public async Task AddOrUpdateAsync(PushSubscriptionDto subscription)
        {
            await _mutex.WaitAsync();
            try
            {
                var list = await ReadAllAsync();
                var existing = list.FirstOrDefault(s => s.UserId == subscription.UserId && s.Endpoint == subscription.Endpoint);
                if (existing != null)
                {
                    existing.P256dh = subscription.P256dh;
                    existing.Auth = subscription.Auth;
                }
                else
                {
                    list.Add(subscription);
                }
                await WriteAllAsync(list);
            }
            finally
            {
                _mutex.Release();
            }
        }

        public async Task RemoveAsync(long userId, string endpoint)
        {
            await _mutex.WaitAsync();
            try
            {
                var list = await ReadAllAsync();
                list.RemoveAll(s => s.UserId == userId && s.Endpoint == endpoint);
                await WriteAllAsync(list);
            }
            finally
            {
                _mutex.Release();
            }
        }

        public async Task RemoveAllForUserAsync(long userId)
        {
            await _mutex.WaitAsync();
            try
            {
                var list = await ReadAllAsync();
                list.RemoveAll(s => s.UserId == userId);
                await WriteAllAsync(list);
            }
            finally
            {
                _mutex.Release();
            }
        }

        public async Task<IReadOnlyList<PushSubscriptionDto>> GetByUserIdsAsync(IEnumerable<long> userIds)
        {
            await _mutex.WaitAsync();
            try
            {
                var set = new HashSet<long>(userIds);
                var list = await ReadAllAsync();
                return list.Where(s => set.Contains(s.UserId)).ToList();
            }
            finally
            {
                _mutex.Release();
            }
        }

        private async Task<List<PushSubscriptionDto>> ReadAllAsync()
        {
            try
            {
                using var fs = File.OpenRead(_filePath);
                if (fs.Length == 0) return new List<PushSubscriptionDto>();
                var items = await JsonSerializer.DeserializeAsync<List<PushSubscriptionDto>>(fs, _jsonOptions);
                return items ?? new List<PushSubscriptionDto>();
            }
            catch
            {
                return new List<PushSubscriptionDto>();
            }
        }

        private async Task WriteAllAsync(List<PushSubscriptionDto> items)
        {
            using var fs = File.Create(_filePath);
            await JsonSerializer.SerializeAsync(fs, items, _jsonOptions);
        }
    }
}
