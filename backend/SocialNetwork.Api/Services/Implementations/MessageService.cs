using Microsoft.EntityFrameworkCore;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.Data;
using SocialNetwork.Api.DTOs.Message;
using SocialNetwork.Api.DTOs.User;
using SocialNetwork.Api.Entities;
using SocialNetwork.Api.Services.Interfaces;

namespace SocialNetwork.Api.Services.Implementations
{
    public class MessageService : IMessageService
    {
        private readonly SocialDbContext _db;

        public MessageService(SocialDbContext db)
        {
            _db = db;
        }

        // ─── GetConversationsAsync ─────────────────────────────────────────────

        public async Task<PagedResult<ConversationDto>> GetConversationsAsync(int userId, int page, int pageSize)
        {
            // Lấy ID các conversation có userId tham gia
            var query = _db.ConversationParticipants
                .Where(cp => cp.UserId == userId)
                .Select(cp => cp.ConversationId);

            var totalCount = await query.CountAsync();

            var convIds = await query
                .OrderByDescending(id => id) // gần đây nhất trước (tạm dùng ID)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Load conversations với participants + last message
            var conversations = await _db.Conversations
                .Where(c => convIds.Contains(c.Id))
                .Include(c => c.Participants).ThenInclude(cp => cp.User)
                .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                .ToListAsync();

            // Đếm unread per conversation
            var unreadCounts = await _db.Messages
                .Where(m => convIds.Contains(m.ConversationId) && !m.IsRead && m.SenderId != userId)
                .GroupBy(m => m.ConversationId)
                .Select(g => new { ConversationId = g.Key, Count = g.Count() })
                .ToListAsync();

            var unreadMap = unreadCounts.ToDictionary(x => x.ConversationId, x => x.Count);

            // Sắp xếp lại theo thứ tự convIds (đã được sort)
            var dtos = convIds
                .Select(id => conversations.FirstOrDefault(c => c.Id == id))
                .Where(c => c != null)
                .Select(c => MapToDto(c!, userId, unreadMap))
                .ToList();

            return PagedResult<ConversationDto>.Create(dtos, totalCount, page, pageSize);
        }

        // ─── GetOrCreateConversationAsync ─────────────────────────────────────

        public async Task<ConversationDto> GetOrCreateConversationAsync(int userId, int targetUserId)
        {
            if (userId == targetUserId)
                throw new InvalidOperationException("Không thể chat với chính mình.");

            // Tìm conversation 1-1 đã tồn tại (lấy conversation nhỏ nhất nếu có duplicate)
            var existingConvId = await _db.ConversationParticipants
                .Where(cp => cp.UserId == userId)
                .Select(cp => cp.ConversationId)
                .Intersect(
                    _db.ConversationParticipants
                        .Where(cp => cp.UserId == targetUserId)
                        .Select(cp => cp.ConversationId)
                )
                .OrderBy(id => id)
                .FirstOrDefaultAsync();

            if (existingConvId > 0)
            {
                var existing = await _db.Conversations
                    .Include(c => c.Participants).ThenInclude(cp => cp.User)
                    .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                    .FirstAsync(c => c.Id == existingConvId);
                return MapToDto(existing, userId, new Dictionary<int, int>());
            }

            // Tạo mới — atomic: conversation + participants trong 1 lần SaveChanges
            var conv = new Conversation
            {
                Participants = new List<ConversationParticipant>
                {
                    new() { UserId = userId },
                    new() { UserId = targetUserId }
                }
            };
            _db.Conversations.Add(conv);

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Race condition: conversation đã được tạo bởi request khác
                // Retry tìm conversation đã tồn tại
                _db.ChangeTracker.Clear();
                var retryConvId = await _db.ConversationParticipants
                    .Where(cp => cp.UserId == userId)
                    .Select(cp => cp.ConversationId)
                    .Intersect(
                        _db.ConversationParticipants
                            .Where(cp => cp.UserId == targetUserId)
                            .Select(cp => cp.ConversationId)
                    )
                    .OrderBy(id => id)
                    .FirstOrDefaultAsync();

                if (retryConvId > 0)
                {
                    var retryConv = await _db.Conversations
                        .Include(c => c.Participants).ThenInclude(cp => cp.User)
                        .FirstAsync(c => c.Id == retryConvId);
                    return MapToDto(retryConv, userId, new Dictionary<int, int>());
                }
                throw;
            }

            // Reload với navigation props
            var full = await _db.Conversations
                .Include(c => c.Participants).ThenInclude(cp => cp.User)
                .FirstAsync(c => c.Id == conv.Id);

            return MapToDto(full, userId, new Dictionary<int, int>());
        }

        // ─── GetMessagesAsync ──────────────────────────────────────────────────

        public async Task<PagedResult<MessageDto>> GetMessagesAsync(int conversationId, int userId, int page, int pageSize)
        {
            // Kiểm tra user có quyền xem không
            var isMember = await _db.ConversationParticipants
                .AnyAsync(cp => cp.ConversationId == conversationId && cp.UserId == userId);
            if (!isMember)
                throw new UnauthorizedAccessException("Bạn không phải thành viên conversation này.");

            var totalCount = await _db.Messages
                .Where(m => m.ConversationId == conversationId)
                .CountAsync();

            // Lấy mới nhất trước (client sẽ reverse)
            var messages = await _db.Messages
                .Where(m => m.ConversationId == conversationId)
                .OrderByDescending(m => m.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(m => new MessageDto
                {
                    Id             = m.Id,
                    ConversationId = m.ConversationId,
                    SenderId       = m.SenderId,
                    Content        = m.Content,
                    IsRead         = m.IsRead,
                    CreatedAt      = m.CreatedAt
                })
                .ToListAsync();

            return PagedResult<MessageDto>.Create(messages, totalCount, page, pageSize);
        }

        // ─── SendMessageAsync ──────────────────────────────────────────────────

        public async Task<MessageDto> SendMessageAsync(int senderId, CreateMessageDto dto)
        {
            // Kiểm tra sender có trong conversation không
            var isMember = await _db.ConversationParticipants
                .AnyAsync(cp => cp.ConversationId == dto.ConversationId && cp.UserId == senderId);
            if (!isMember)
                throw new UnauthorizedAccessException("Bạn không phải thành viên conversation này.");

            var message = new Message
            {
                ConversationId = dto.ConversationId,
                SenderId       = senderId,
                Content        = dto.Content.Trim(),
                IsRead         = false,
                CreatedAt      = DateTime.UtcNow
            };

            _db.Messages.Add(message);
            await _db.SaveChangesAsync();

            return new MessageDto
            {
                Id             = message.Id,
                ConversationId = message.ConversationId,
                SenderId       = message.SenderId,
                Content        = message.Content,
                IsRead         = message.IsRead,
                CreatedAt      = message.CreatedAt
            };
        }

        // ─── MarkReadAsync ─────────────────────────────────────────────────────

        public async Task MarkReadAsync(int conversationId, int userId)
        {
            // Chỉ mark các tin nhắn của người khác gửi, chưa đọc
            await _db.Messages
                .Where(m => m.ConversationId == conversationId && m.SenderId != userId && !m.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(m => m.IsRead, true));
        }

        // ─── GetUnreadCountAsync ───────────────────────────────────────────────

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            // Conversations của user
            var myConvIds = await _db.ConversationParticipants
                .Where(cp => cp.UserId == userId)
                .Select(cp => cp.ConversationId)
                .ToListAsync();

            return await _db.Messages
                .Where(m => myConvIds.Contains(m.ConversationId) && m.SenderId != userId && !m.IsRead)
                .CountAsync();
        }

        // ─── Private helper ────────────────────────────────────────────────────

        private static ConversationDto MapToDto(
            Conversation c,
            int currentUserId,
            Dictionary<int, int> unreadMap)
        {
            var lastMsg = c.Messages.OrderByDescending(m => m.CreatedAt).FirstOrDefault();

            return new ConversationDto
            {
                Id           = c.Id,
                CreatedAt    = c.CreatedAt,
                Participants = c.Participants
                    .Where(cp => cp.UserId != currentUserId)
                    .Select(cp => new UserSummaryDto
                    {
                        Id        = cp.User.Id,
                        Username  = cp.User.Username,
                        FullName  = cp.User.FullName,
                        AvatarUrl = cp.User.AvatarUrl
                    })
                    .ToList(),
                LastMessage  = lastMsg is null ? null : new MessageDto
                {
                    Id             = lastMsg.Id,
                    ConversationId = lastMsg.ConversationId,
                    SenderId       = lastMsg.SenderId,
                    Content        = lastMsg.Content,
                    IsRead         = lastMsg.IsRead,
                    CreatedAt      = lastMsg.CreatedAt
                },
                UnreadCount = unreadMap.GetValueOrDefault(c.Id, 0)
            };
        }
    }
}
