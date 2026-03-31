using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.Data;
using SocialNetwork.Api.DTOs.Notification;
using SocialNetwork.Api.DTOs.User;
using SocialNetwork.Api.Entities;
using SocialNetwork.Api.Hubs;
using SocialNetwork.Api.Services.Interfaces;

namespace SocialNetwork.Api.Services.Implementations
{
    public class NotificationService : INotificationService
    {
        private readonly SocialDbContext _db;
        private readonly IHubContext<NotificationHub> _notifHub;

        public NotificationService(SocialDbContext db, IHubContext<NotificationHub> notifHub)
        {
            _db = db;
            _notifHub = notifHub;
        }

        // ─── GetAllAsync ───────────────────────────────────────────────────────

        public async Task<PagedResult<NotificationDto>> GetAllAsync(int userId, int page, int pageSize)
        {
            var query = _db.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(n => n.Actor)
                .Select(n => new NotificationDto
                {
                    Id               = n.Id,
                    Actor            = new UserSummaryDto
                    {
                        Id        = n.Actor.Id,
                        Username  = n.Actor.Username,
                        FullName  = n.Actor.FullName,
                        AvatarUrl = n.Actor.AvatarUrl
                    },
                    NotificationType = n.NotificationType,
                    EntityId         = n.EntityId,
                    IsRead           = n.IsRead,
                    CreatedAt        = n.CreatedAt
                })
                .ToListAsync();

            return PagedResult<NotificationDto>.Create(items, totalCount, page, pageSize);
        }

        // ─── MarkReadAsync ─────────────────────────────────────────────────────

        public async Task MarkReadAsync(int notificationId, int userId)
        {
            var n = await _db.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId)
                ?? throw new KeyNotFoundException("Không tìm thấy thông báo.");
            n.IsRead = true;
            await _db.SaveChangesAsync();
        }

        // ─── MarkAllReadAsync ──────────────────────────────────────────────────

        public async Task MarkAllReadAsync(int userId)
        {
            await _db.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
        }

        // ─── GetUnreadCountAsync ───────────────────────────────────────────────

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _db.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }

        // ─── CreateAsync (internal) ────────────────────────────────────────────

        public async Task CreateAsync(int recipientId, int actorId, string type, int? entityId = null)
        {
            // Không tạo thông báo tự gửi cho mình
            if (recipientId == actorId) return;

            // Tránh duplicate: cùng actor, type, entity trong 30 giây gần nhất
            var cutoff = DateTime.UtcNow.AddSeconds(-30);
            var duplicate = await _db.Notifications.AnyAsync(n =>
                n.UserId   == recipientId &&
                n.ActorId  == actorId &&
                n.NotificationType == type &&
                n.EntityId == entityId &&
                n.CreatedAt >= cutoff);

            if (duplicate) return;

            var notification = new Notification
            {
                UserId           = recipientId,
                ActorId          = actorId,
                NotificationType = type,
                EntityId         = entityId,
                IsRead           = false,
                CreatedAt        = DateTime.UtcNow
            };
            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync();

            // Push real-time qua SignalR
            var actor = await _db.Users.FindAsync(actorId);
            if (actor != null)
            {
                var notifDto = new NotificationDto
                {
                    Id               = notification.Id,
                    Actor            = new UserSummaryDto
                    {
                        Id        = actor.Id,
                        Username  = actor.Username,
                        FullName  = actor.FullName,
                        AvatarUrl = actor.AvatarUrl
                    },
                    NotificationType = type,
                    EntityId         = entityId,
                    IsRead           = false,
                    CreatedAt        = notification.CreatedAt
                };
                await _notifHub.Clients.Group($"user_{recipientId}")
                    .SendAsync("ReceiveNotification", notifDto);
            }
        }
    }
}
