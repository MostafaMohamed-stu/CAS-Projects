using System.Text.Json;

namespace AttendanceBehaviour_Backend.Services
{
    public class AttendanceSubmissionItem
    {
        public long ClassId { get; set; }
        public int SessionId { get; set; }
        public string Date { get; set; } = string.Empty;
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    }

    public interface IAttendanceSubmissionStore
    {
        Task<bool> IsSessionSubmittedAsync(long classId, int sessionId, string date);
        Task MarkSessionsSubmittedAsync(long classId, IEnumerable<int> sessionIds, string date);
    }

    public class AttendanceSubmissionFileStore : IAttendanceSubmissionStore
    {
        private readonly string _filePath;
        private static readonly SemaphoreSlim _mutex = new(1, 1);
        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };

        public AttendanceSubmissionFileStore(IWebHostEnvironment env)
        {
            var dataDir = Path.Combine(env.ContentRootPath, "App_Data");
            if (!Directory.Exists(dataDir))
            {
                Directory.CreateDirectory(dataDir);
            }
            _filePath = Path.Combine(dataDir, "attendance_submissions.json");
            if (!File.Exists(_filePath))
            {
                File.WriteAllText(_filePath, "[]");
            }
        }

        public async Task<bool> IsSessionSubmittedAsync(long classId, int sessionId, string date)
        {
            await _mutex.WaitAsync();
            try
            {
                var list = await ReadAllAsync();
                return list.Any(s => s.ClassId == classId && s.SessionId == sessionId && s.Date == date);
            }
            finally
            {
                _mutex.Release();
            }
        }

        public async Task MarkSessionsSubmittedAsync(long classId, IEnumerable<int> sessionIds, string date)
        {
            await _mutex.WaitAsync();
            try
            {
                var list = await ReadAllAsync();
                var now = DateTime.UtcNow;
                foreach (var sid in sessionIds)
                {
                    if (!list.Any(s => s.ClassId == classId && s.SessionId == sid && s.Date == date))
                    {
                        list.Add(new AttendanceSubmissionItem
                        {
                            ClassId = classId,
                            SessionId = sid,
                            Date = date,
                            SubmittedAt = now
                        });
                    }
                }
                await WriteAllAsync(list);
            }
            finally
            {
                _mutex.Release();
            }
        }

        private async Task<List<AttendanceSubmissionItem>> ReadAllAsync()
        {
            try
            {
                var json = await File.ReadAllTextAsync(_filePath);
                return JsonSerializer.Deserialize<List<AttendanceSubmissionItem>>(json, _jsonOptions) ?? new List<AttendanceSubmissionItem>();
            }
            catch
            {
                return new List<AttendanceSubmissionItem>();
            }
        }

        private async Task WriteAllAsync(List<AttendanceSubmissionItem> list)
        {
            var json = JsonSerializer.Serialize(list, _jsonOptions);
            await File.WriteAllTextAsync(_filePath, json);
        }
    }
}
