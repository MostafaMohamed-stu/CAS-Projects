using System.Text.Json;
using WebPush;

namespace AttendanceBehaviour_Backend.Services
{
    public interface IPushSender
    {
        Task SendAsync(IEnumerable<PushSubscriptionDto> subscriptions, string title, string body);
    }

    public class WebPushSender : IPushSender
    {
        private readonly string _publicKey;
        private readonly string _privateKey;
        private readonly string _subject;

        public WebPushSender(IConfiguration config)
        {
            _publicKey = config["Vapid:PublicKey"] ?? "";
            _privateKey = config["Vapid:PrivateKey"] ?? "";
            _subject = config["Vapid:Subject"] ?? "mailto:admin@example.com";
        }

        public async Task SendAsync(IEnumerable<PushSubscriptionDto> subscriptions, string title, string body)
        {
            if (string.IsNullOrWhiteSpace(_publicKey) || string.IsNullOrWhiteSpace(_privateKey))
            {
                return; // VAPID keys not configured; skip sending
            }

            var vapid = new VapidDetails(_subject, _publicKey, _privateKey);
            var client = new WebPushClient();
            var payload = JsonSerializer.Serialize(new
            {
                title,
                body
            });

            foreach (var sub in subscriptions)
            {
                try
                {
                    Console.WriteLine($"[WebPush] Attempting send to endpoint: {sub.Endpoint}");
                    var subscription = new PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth);
                    await client.SendNotificationAsync(subscription, payload, vapid);
                    Console.WriteLine($"[WebPush] SUCCESS: Notification sent to {sub.Endpoint}");
                }
                catch (WebPushException ex)
                {
                    Console.WriteLine($"[WebPush] ERROR (WebPushException): Status Code: {ex.StatusCode}, Message: {ex.Message}");
                    if (ex.StatusCode == System.Net.HttpStatusCode.Gone || ex.StatusCode == System.Net.HttpStatusCode.NotFound)
                    {
                        Console.WriteLine($"[WebPush] Subscription expired or not found. Should remove: {sub.Endpoint}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[WebPush] FATAL ERROR sending to {sub.Endpoint}: {ex.GetType().Name} - {ex.Message}");
                    if (ex.InnerException != null)
                    {
                        Console.WriteLine($"[WebPush] Inner Exception: {ex.InnerException.Message}");
                    }
                }
            }
        }
    }
}
