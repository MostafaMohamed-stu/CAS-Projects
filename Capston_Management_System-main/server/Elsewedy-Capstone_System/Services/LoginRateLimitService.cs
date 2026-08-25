using Microsoft.Extensions.Caching.Memory;
using System.Collections.Concurrent;

namespace Elsewedy_Capstone_System.Services
{
    public class LoginRateLimitService
    {
        private readonly IMemoryCache _cache;
        private readonly ConcurrentDictionary<string, LoginAttemptInfo> _attempts = new();

        public LoginRateLimitService(IMemoryCache cache)
        {
            _cache = cache;
        }

        public class LoginAttemptInfo
        {
            public int FailedAttempts { get; set; }
            public DateTime LastAttempt { get; set; }
            public DateTime? LockedUntil { get; set; }
            public bool IsLocked => LockedUntil.HasValue && LockedUntil.Value > DateTime.UtcNow;
        }

        public bool IsAccountLocked(string email)
        {
            var key = $"login_attempts_{email.ToLower()}";
            if (_attempts.TryGetValue(key, out var info))
            {
                return info.IsLocked;
            }
            return false;
        }

        public TimeSpan? GetRemainingLockTime(string email)
        {
            var key = $"login_attempts_{email.ToLower()}";
            if (_attempts.TryGetValue(key, out var info) && info.IsLocked)
            {
                return info.LockedUntil!.Value - DateTime.UtcNow;
            }
            return null;
        }

        public void RecordFailedAttempt(string email)
        {
            var key = $"login_attempts_{email.ToLower()}";
            var info = _attempts.GetOrAdd(key, new LoginAttemptInfo());

            info.FailedAttempts++;
            info.LastAttempt = DateTime.UtcNow;

            // Progressive lockout times (more user-friendly)
            var lockoutMinutes = info.FailedAttempts switch
            {
                1 => 0,      // No lockout
                2 => 0,      // No lockout (was 1 minute)
                3 => 1,      // 1 minute (was 5 minutes)
                4 => 3,      // 3 minutes (was 15 minutes)
                5 => 10,     // 10 minutes (was 60 minutes)
                _ => 30      // 30 minutes for 6+ attempts (was 240 minutes)
            };

            if (lockoutMinutes > 0)
            {
                info.LockedUntil = DateTime.UtcNow.AddMinutes(lockoutMinutes);
            }

            // Clean up old entries (older than 24 hours)
            CleanupOldEntries();
        }

        public void RecordSuccessfulLogin(string email)
        {
            var key = $"login_attempts_{email.ToLower()}";
            _attempts.TryRemove(key, out _);
        }

        public int GetFailedAttemptCount(string email)
        {
            var key = $"login_attempts_{email.ToLower()}";
            if (_attempts.TryGetValue(key, out var info))
            {
                return info.FailedAttempts;
            }
            return 0;
        }

        private void CleanupOldEntries()
        {
            var cutoff = DateTime.UtcNow.AddHours(-24);
            var keysToRemove = _attempts
                .Where(kvp => kvp.Value.LastAttempt < cutoff)
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var key in keysToRemove)
            {
                _attempts.TryRemove(key, out _);
            }
        }

        public bool ShouldShowCaptcha(string email)
        {
            var failedCount = GetFailedAttemptCount(email);
            return failedCount >= 3; // Show CAPTCHA after 3 failed attempts
        }
    }
}
