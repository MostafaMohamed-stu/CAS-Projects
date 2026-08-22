using System.Text.Json;

namespace AttendanceBehaviour_Backend.Services
{
    public class FcmTokenDto
    {
        public long UserId { get; set; }
        public string Token { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; }
    }

    public interface IFcmTokenStore
    {
        Task AddOrUpdateAsync(long userId, string token);
        Task RemoveAsync(long userId, string token);
        Task RemoveAllForUserAsync(long userId);
        Task<IReadOnlyList<string>> GetTokensByUserIdsAsync(IEnumerable<long> userIds);
    }

    public class FcmTokenFileStore : IFcmTokenStore
    {
        private readonly string _filePath;
        private static readonly SemaphoreSlim _mutex = new(1, 1);
        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };

        public FcmTokenFileStore(IWebHostEnvironment env)
        {
            var dataDir = Path.Combine(env.ContentRootPath, "App_Data");
            if (!Directory.Exists(dataDir))
            {
                Directory.CreateDirectory(dataDir);
            }
            _filePath = Path.Combine(dataDir, "fcm_tokens.json");
            if (!File.Exists(_filePath))
            {
                File.WriteAllText(_filePath, "[]");
            }
        }

        public async Task AddOrUpdateAsync(long userId, string token)
        {
            await _mutex.WaitAsync();
            try
            {
                var list = await ReadAllAsync();
                var existing = list.FirstOrDefault(s => s.UserId == userId && s.Token == token);
                if (existing != null)
                {
                    existing.LastUpdated = DateTime.UtcNow;
                }
                else
                {
                    list.Add(new FcmTokenDto
                    {
                        UserId = userId,
                        Token = token,
                        LastUpdated = DateTime.UtcNow
                    });
                }
                await WriteAllAsync(list);
            }
            finally
            {
                _mutex.Release();
            }
        }

        public async Task RemoveAsync(long userId, string token)
        {
            await _mutex.WaitAsync();
            try
            {
                var list = await ReadAllAsync();
                list.RemoveAll(s => s.UserId == userId && s.Token == token);
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

        public async Task<IReadOnlyList<string>> GetTokensByUserIdsAsync(IEnumerable<long> userIds)
        {
            await _mutex.WaitAsync();
            try
            {
                var set = new HashSet<long>(userIds);
                var list = await ReadAllAsync();
                return list.Where(s => set.Contains(s.UserId)).Select(s => s.Token).ToList();
            }
            finally
            {
                _mutex.Release();
            }
        }

        private async Task<List<FcmTokenDto>> ReadAllAsync()
        {
            try
            {
                using var fs = File.OpenRead(_filePath);
                if (fs.Length == 0) return new List<FcmTokenDto>();
                return await JsonSerializer.DeserializeAsync<List<FcmTokenDto>>(fs, _jsonOptions) ?? new List<FcmTokenDto>();
            }
            catch
            {
                return new List<FcmTokenDto>();
            }
        }

        private async Task WriteAllAsync(List<FcmTokenDto> list)
        {
            using var fs = File.Create(_filePath);
            await JsonSerializer.SerializeAsync(fs, list, _jsonOptions);
        }
    }
}
