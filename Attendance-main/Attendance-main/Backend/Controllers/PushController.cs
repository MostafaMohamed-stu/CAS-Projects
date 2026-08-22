using AttendanceBehaviour_Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace AttendanceBehaviour_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PushController : ControllerBase
    {
        private readonly IPushSubscriptionStore _store;
        private readonly IFcmTokenStore _fcmStore;
        private readonly IConfiguration _config;

        public PushController(IPushSubscriptionStore store, IFcmTokenStore fcmStore, IConfiguration config)
        {
            _store = store;
            _fcmStore = fcmStore;
            _config = config;
        }

        public class SubscribeRequest
        {
            public long UserId { get; set; }
            public string Endpoint { get; set; } = string.Empty;
            public KeysDto Keys { get; set; } = new();
        }

        public class FcmSubscribeRequest
        {
            public long UserId { get; set; }
            public string FcmToken { get; set; } = string.Empty;
        }

        public class KeysDto
        {
            public string P256dh { get; set; } = string.Empty;
            public string Auth { get; set; } = string.Empty;
        }

        [HttpGet("public-key")]
        public IActionResult GetPublicKey()
        {
            var key = _config["Vapid:PublicKey"] ?? "";
            return Ok(new { publicKey = key });
        }

        [HttpPost("subscribe")]
        public async Task<IActionResult> Subscribe([FromBody] SubscribeRequest req)
        {
            if (req.UserId <= 0 || string.IsNullOrWhiteSpace(req.Endpoint) || string.IsNullOrWhiteSpace(req.Keys?.P256dh) || string.IsNullOrWhiteSpace(req.Keys?.Auth))
            {
                return BadRequest("Invalid subscription payload");
            }
            await _store.AddOrUpdateAsync(new PushSubscriptionDto
            {
                UserId = req.UserId,
                Endpoint = req.Endpoint,
                P256dh = req.Keys.P256dh,
                Auth = req.Keys.Auth
            });
            return Ok();
        }

        [HttpPost("subscribe-fcm")]
        public async Task<IActionResult> SubscribeFcm([FromBody] FcmSubscribeRequest req)
        {
            if (req.UserId <= 0 || string.IsNullOrWhiteSpace(req.FcmToken))
            {
                return BadRequest("Invalid FCM subscription payload");
            }
            await _fcmStore.AddOrUpdateAsync(req.UserId, req.FcmToken);
            return Ok(new { message = "FCM token registered successfully." });
        }

        [HttpPost("unsubscribe")]
        public async Task<IActionResult> Unsubscribe([FromBody] SubscribeRequest req)
        {
            if (req.UserId <= 0 || string.IsNullOrWhiteSpace(req.Endpoint))
            {
                return BadRequest("Invalid unsubscribe payload");
            }
            await _store.RemoveAsync(req.UserId, req.Endpoint);
            return Ok();
        }

        [HttpPost("unsubscribe-fcm")]
        public async Task<IActionResult> UnsubscribeFcm([FromBody] FcmSubscribeRequest req)
        {
            if (req.UserId <= 0 || string.IsNullOrWhiteSpace(req.FcmToken))
            {
                return BadRequest("Invalid FCM unsubscribe payload");
            }
            await _fcmStore.RemoveAsync(req.UserId, req.FcmToken);
            return Ok(new { message = "FCM token removed successfully." });
        }

        [HttpPost("logout/{userId:long}")]
        public async Task<IActionResult> Logout(long userId)
        {
            if (userId <= 0)
            {
                return BadRequest("Invalid user ID");
            }
            // Remove all FCM tokens and WebPush subscriptions for this user
            await _fcmStore.RemoveAllForUserAsync(userId);
            await _store.RemoveAllForUserAsync(userId);
            return Ok(new { message = "All push tokens removed for user." });
        }
    }
}
