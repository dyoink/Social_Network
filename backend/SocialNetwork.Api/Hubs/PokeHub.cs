using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SocialNetwork.Api.Data;
using SocialNetwork.Api.Entities;
using System.Collections.Concurrent;
using System.Security.Claims;

namespace SocialNetwork.Api.Hubs
{
    /// <summary>
    /// SignalR Hub cho tính năng Poke / "Khủng bố".
    /// Rate limit: max 5 pokes/phút per user.
    /// </summary>
    [Authorize]
    public class PokeHub : Hub
    {
        private readonly SocialDbContext _context;
        private readonly ILogger<PokeHub> _logger;

        // Rate limiting: userId → list of timestamps
        private static readonly ConcurrentDictionary<int, List<DateTime>> _pokeTimes = new();
        private const int MaxPokesPerMinute = 5;

        public PokeHub(SocialDbContext context, ILogger<PokeHub> logger)
        {
            _context = context;
            _logger = logger;
        }

        private int CurrentUserId =>
            int.TryParse(Context.User?.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;

        /// <summary>
        /// Gửi poke tới user khác.
        /// pokeType: "debt" | "drink" | "bell" | "boo"
        /// </summary>
        public async Task Poke(int targetUserId, string pokeType)
        {
            var senderId = CurrentUserId;
            if (senderId == 0 || senderId == targetUserId) return;

            // Validate poke type
            var validTypes = new HashSet<string> { "debt", "drink", "bell", "boo" };
            if (!validTypes.Contains(pokeType)) pokeType = "boo";

            // Rate limiting
            var now = DateTime.UtcNow;
            var times = _pokeTimes.GetOrAdd(senderId, _ => new List<DateTime>());
            lock (times)
            {
                // Xóa entries cũ hơn 1 phút
                times.RemoveAll(t => (now - t).TotalMinutes > 1);
                if (times.Count >= MaxPokesPerMinute)
                {
                    _logger.LogWarning("User {SenderId} bị rate limit poke.", senderId);
                    return;
                }
                times.Add(now);
            }

            // Lưu notification vào DB để có thể hiển thị trong lịch sử thông báo + đếm badge
            try
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = targetUserId,
                    ActorId = senderId,
                    NotificationType = "poke",
                    EntityId = null,
                    IsRead = false,
                    CreatedAt = now
                });
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi lưu poke notification từ {Sender} đến {Target}", senderId, targetUserId);
            }

            // Gửi real-time event tới target user
            await Clients.Group($"user_{targetUserId}")
                .SendAsync("ReceivePoke", new
                {
                    fromUserId = senderId,
                    pokeType,
                    timestamp = now
                });

            _logger.LogInformation("User {Sender} chọc {Target} kiểu {Type}", senderId, targetUserId, pokeType);
        }

        public override async Task OnConnectedAsync()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{CurrentUserId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{CurrentUserId}");
            await base.OnDisconnectedAsync(exception);
        }
    }
}
