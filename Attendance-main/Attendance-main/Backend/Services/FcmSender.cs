using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;

namespace AttendanceBehaviour_Backend.Services
{
    public interface IFcmSender
    {
        Task SendNotificationAsync(IEnumerable<string> tokens, string title, string body, IDictionary<string, string>? data = null);
    }

    public class FcmSender : IFcmSender
    {
        private readonly ILogger<FcmSender> _logger;
        private readonly FirebaseApp _app;

        public FcmSender(IWebHostEnvironment env, ILogger<FcmSender> logger)
        {
            _logger = logger;
            var pathToKey = Path.Combine(env.ContentRootPath, "attendance-28f89-firebase-adminsdk-fbsvc-5fb934f7da.json");
            
            if (!File.Exists(pathToKey))
            {
                _logger.LogError($"Firebase Admin SDK key file not found at {pathToKey}");
                throw new FileNotFoundException("Firebase Admin SDK key file not found.");
            }

            if (FirebaseApp.DefaultInstance == null)
            {
                _app = FirebaseApp.Create(new AppOptions()
                {
                    Credential = GoogleCredential.FromFile(pathToKey)
                });
            }
            else
            {
                _app = FirebaseApp.DefaultInstance;
            }
        }

        public async Task SendNotificationAsync(IEnumerable<string> tokens, string title, string body, IDictionary<string, string>? data = null)
        {
            if (tokens == null || !tokens.Any())
            {
                _logger.LogWarning("No FCM tokens provided for notification.");
                return;
            }

            var messaging = FirebaseMessaging.GetMessaging(_app);
            
            var message = new MulticastMessage()
            {
                Tokens = tokens.ToList(),
                Notification = new Notification()
                {
                    Title = title,
                    Body = body
                },
                Data = data != null ? new Dictionary<string, string>(data) : null
            };

            try
            {
                var response = await messaging.SendMulticastAsync(message);
                _logger.LogInformation($"Successfully sent FCM message: {response.SuccessCount} successes, {response.FailureCount} failures.");
                
                if (response.FailureCount > 0)
                {
                    for (var i = 0; i < response.Responses.Count; i++)
                    {
                        if (!response.Responses[i].IsSuccess)
                        {
                            _logger.LogError($"Failure sending to token {tokens.ElementAt(i)}: {response.Responses[i].Exception.Message}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending FCM message: {ex.Message}");
            }
        }
    }
}
