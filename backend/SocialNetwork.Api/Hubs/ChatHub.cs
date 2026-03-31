using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SocialNetwork.Api.DTOs.Message;
using SocialNetwork.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialNetwork.Api.Hubs
{
    /// <summary>
    /// SignalR Hub xử lý real-time messaging.
    /// Client join group "conv_{id}" khi mở conversation, nhận tin nhắn mới qua ReceiveMessage.
    /// </summary>
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private static readonly ConnectionTracker _tracker = new();

        public ChatHub(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        private int CurrentUserId =>
            int.TryParse(Context.User?.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;

        /// <summary>Client gọi khi mở conversation — join SignalR group để nhận tin nhắn.</summary>
        public async Task JoinConversation(int conversationId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"conv_{conversationId}");
        }

        /// <summary>Client gọi khi rời conversation.</summary>
        public async Task LeaveConversation(int conversationId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conv_{conversationId}");
        }

        /// <summary>
        /// Client gọi để gửi tin nhắn. Lưu vào DB rồi broadcast cho cả group.
        /// </summary>
        public async Task SendMessage(int conversationId, string content)
        {
            if (string.IsNullOrWhiteSpace(content)) return;

            using var scope = _scopeFactory.CreateScope();
            var messageService = scope.ServiceProvider.GetRequiredService<IMessageService>();

            var dto = new CreateMessageDto
            {
                ConversationId = conversationId,
                Content = content.Trim()
            };

            var message = await messageService.SendMessageAsync(CurrentUserId, dto);

            // Broadcast tin nhắn mới tới toàn bộ participants trong conversation
            await Clients.Group($"conv_{conversationId}")
                .SendAsync("ReceiveMessage", message);

            // Gửi cập nhật conversation (cho sidebar list) tới tất cả participants
            var convService = scope.ServiceProvider.GetRequiredService<IMessageService>();
            // Lấy participants để push notification cho những người không trong group
            var db = scope.ServiceProvider.GetRequiredService<Data.SocialDbContext>();
            var participantIds = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions
                .ToListAsync(
                    db.ConversationParticipants
                        .Where(cp => cp.ConversationId == conversationId)
                        .Select(cp => cp.UserId)
                );

            foreach (var userId in participantIds)
            {
                if (userId == CurrentUserId) continue;
                // Gửi event cập nhật unread count cho user
                await Clients.Group($"user_{userId}")
                    .SendAsync("ConversationUpdated", new
                    {
                        conversationId,
                        lastMessage = message
                    });
            }
        }

        /// <summary>Client thông báo đang gõ.</summary>
        public async Task Typing(int conversationId)
        {
            await Clients.OthersInGroup($"conv_{conversationId}")
                .SendAsync("UserTyping", new { userId = CurrentUserId, conversationId });
        }

        /// <summary>Client thông báo ngừng gõ.</summary>
        public async Task StopTyping(int conversationId)
        {
            await Clients.OthersInGroup($"conv_{conversationId}")
                .SendAsync("UserStopTyping", new { userId = CurrentUserId, conversationId });
        }

        public override async Task OnConnectedAsync()
        {
            var userId = CurrentUserId;
            _tracker.AddConnection(userId, Context.ConnectionId);

            // Join personal group để nhận notifications & conversation updates
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

            // Broadcast online status
            await Clients.Others.SendAsync("UserOnline", userId);

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = CurrentUserId;
            _tracker.RemoveConnection(userId, Context.ConnectionId);

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");

            // Chỉ broadcast offline khi user không còn connection nào
            if (!_tracker.IsOnline(userId))
            {
                await Clients.Others.SendAsync("UserOffline", userId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>Lấy danh sách userId đang online.</summary>
        public Task<IReadOnlyList<int>> GetOnlineUsers()
        {
            return Task.FromResult(_tracker.GetOnlineUsers());
        }
    }

    /// <summary>
    /// Thread-safe tracker quản lý connection của mỗi user.
    /// Một user có thể có nhiều connection (nhiều tab).
    /// </summary>
    internal class ConnectionTracker
    {
        private readonly Dictionary<int, HashSet<string>> _connections = new();
        private readonly object _lock = new();

        public void AddConnection(int userId, string connectionId)
        {
            lock (_lock)
            {
                if (!_connections.TryGetValue(userId, out var set))
                {
                    set = new HashSet<string>();
                    _connections[userId] = set;
                }
                set.Add(connectionId);
            }
        }

        public void RemoveConnection(int userId, string connectionId)
        {
            lock (_lock)
            {
                if (_connections.TryGetValue(userId, out var set))
                {
                    set.Remove(connectionId);
                    if (set.Count == 0) _connections.Remove(userId);
                }
            }
        }

        public bool IsOnline(int userId)
        {
            lock (_lock) { return _connections.ContainsKey(userId); }
        }

        public IReadOnlyList<int> GetOnlineUsers()
        {
            lock (_lock) { return _connections.Keys.ToList(); }
        }
    }
}
