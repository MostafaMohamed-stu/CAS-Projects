using Microsoft.Extensions.Caching.Memory;
using System.Collections.Concurrent;

namespace Elsewedy_Capstone_System.Services
{
    public class RequestCounterService
    {
        private readonly ConcurrentDictionary<string, RequestCounter> _counters = new();

        public class RequestCounter
        {
            public int RemainingRequests { get; set; } = 7;
            public DateTime WindowStart { get; set; } = DateTime.UtcNow;
            public DateTime LastRequest { get; set; } = DateTime.UtcNow;
        }

        public RequestCounter GetOrCreateCounter(string key)
        {
            var now = DateTime.UtcNow;
            
            return _counters.AddOrUpdate(key, 
                new RequestCounter { RemainingRequests = 7, WindowStart = now, LastRequest = now },
                (k, existing) => {
                    // Reset counter if window has passed (1 minute)
                    if (now - existing.WindowStart >= TimeSpan.FromMinutes(1))
                    {
                        return new RequestCounter { RemainingRequests = 7, WindowStart = now, LastRequest = now };
                    }
                    return existing;
                });
        }

        public bool TryConsumeRequest(string key)
        {
            var counter = GetOrCreateCounter(key);
            
            if (counter.RemainingRequests > 0)
            {
                counter.RemainingRequests--;
                counter.LastRequest = DateTime.UtcNow;
                return true;
            }
            
            return false;
        }

        public int GetRemainingRequests(string key)
        {
            var counter = GetOrCreateCounter(key);
            return counter.RemainingRequests;
        }

        public TimeSpan GetTimeUntilReset(string key)
        {
            var counter = GetOrCreateCounter(key);
            var timeSinceStart = DateTime.UtcNow - counter.WindowStart;
            var remainingTime = TimeSpan.FromMinutes(1) - timeSinceStart;
            return remainingTime > TimeSpan.Zero ? remainingTime : TimeSpan.Zero;
        }

        public void CleanupOldCounters()
        {
            var cutoff = DateTime.UtcNow.AddMinutes(-5); // Keep counters for 5 minutes
            var keysToRemove = _counters
                .Where(kvp => kvp.Value.LastRequest < cutoff)
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var key in keysToRemove)
            {
                _counters.TryRemove(key, out _);
            }
        }
    }
}
