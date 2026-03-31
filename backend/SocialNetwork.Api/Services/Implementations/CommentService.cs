using Microsoft.EntityFrameworkCore;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.Data;
using SocialNetwork.Api.DTOs.Badge;
using SocialNetwork.Api.DTOs.Comment;
using SocialNetwork.Api.DTOs.User;
using SocialNetwork.Api.Entities;
using SocialNetwork.Api.Services.Interfaces;

namespace SocialNetwork.Api.Services.Implementations
{
    public class CommentService : ICommentService
    {
        private readonly SocialDbContext _context;
        private readonly ILogger<CommentService> _logger;
        private readonly IBadgeService _badgeService;

        public CommentService(SocialDbContext context, ILogger<CommentService> logger, IBadgeService badgeService)
        {
            _context = context;
            _logger = logger;
            _badgeService = badgeService;
        }

        // ─── GetByPost ─────────────────────────────────────────────────────────

        public async Task<PagedResult<CommentDto>> GetByPostAsync(int postId, int page, int pageSize)
        {
            // Chỉ lấy comment gốc (không phải reply)
            var query = _context.Comments
                .Include(c => c.User)
                .Where(c => c.PostId == postId && c.ParentId == null)
                .OrderBy(c => c.CreatedAt);

            var total = await query.CountAsync();
            var comments = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            if (comments.Count == 0)
                return PagedResult<CommentDto>.Create([], total, page, pageSize);

            // Batch đếm replies để tránh N+1
            var commentIds = comments.Select(c => c.Id).ToList();
            var replyCounts = await _context.Comments
                .Where(c => c.ParentId != null && commentIds.Contains(c.ParentId.Value))
                .GroupBy(c => c.ParentId!.Value)
                .Select(g => new { ParentId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.ParentId, x => x.Count);

            var items = comments.Select(c => MapToDto(c, replyCounts.GetValueOrDefault(c.Id, 0))).ToList();

            // Batch fetch displayed badges for comment authors
            var authorIds = comments.Select(c => c.UserId).Distinct();
            var badgeMap = await _badgeService.GetDisplayedBadgesForUsersAsync(authorIds);
            foreach (var item in items)
            {
                if (item.User is not null && badgeMap.TryGetValue(item.User.Id, out var badge))
                    item.User.DisplayedBadge = badge;
            }

            return PagedResult<CommentDto>.Create(items, total, page, pageSize);
        }

        // ─── GetReplies ────────────────────────────────────────────────────────

        public async Task<List<CommentDto>> GetRepliesAsync(int commentId)
        {
            return await _context.Comments
                .Include(c => c.User)
                .Where(c => c.ParentId == commentId)
                .OrderBy(c => c.CreatedAt)
                .Select(c => MapToDto(c, 0)) // replies không có nested reply
                .ToListAsync();
        }

        // ─── Create ────────────────────────────────────────────────────────────

        public async Task<CommentDto> CreateAsync(int userId, CreateCommentDto dto)
        {
            // Kiểm tra bài viết tồn tại
            var post = await _context.Posts.FindAsync(dto.PostId)
                ?? throw new KeyNotFoundException("Không tìm thấy bài viết.");

            Comment? parentComment = null;
            if (dto.ParentId.HasValue)
            {
                parentComment = await _context.Comments.FindAsync(dto.ParentId.Value)
                    ?? throw new KeyNotFoundException("Không tìm thấy comment gốc.");

                // Đảm bảo reply cùng bài viết với comment gốc
                if (parentComment.PostId != dto.PostId)
                    throw new InvalidOperationException("Comment gốc không thuộc bài viết này.");
            }

            var comment = new Comment
            {
                PostId    = dto.PostId,
                UserId    = userId,
                ParentId  = dto.ParentId,
                Content   = dto.Content.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);

            // ── Tạo Notification ──────────────────────────────────────────────
            if (dto.ParentId.HasValue && parentComment is not null)
            {
                // Reply comment → thông báo cho chủ comment gốc (nếu khác người)
                if (parentComment.UserId != userId)
                {
                    _context.Notifications.Add(new Notification
                    {
                        UserId           = parentComment.UserId,
                        ActorId          = userId,
                        NotificationType = "reply",
                        EntityId         = dto.PostId,
                        IsRead           = false,
                        CreatedAt        = DateTime.UtcNow
                    });
                }
            }
            else
            {
                // Comment bài viết → thông báo cho chủ bài (nếu khác người)
                if (post.UserId != userId)
                {
                    _context.Notifications.Add(new Notification
                    {
                        UserId           = post.UserId,
                        ActorId          = userId,
                        NotificationType = "comment",
                        EntityId         = dto.PostId,
                        IsRead           = false,
                        CreatedAt        = DateTime.UtcNow
                    });
                }
            }

            await _context.SaveChangesAsync();

            // Reload User để map sang DTO
            await _context.Entry(comment).Reference(c => c.User).LoadAsync();

            _logger.LogInformation("User {UserId} comment bài {PostId} (ParentId: {ParentId})",
                userId, dto.PostId, dto.ParentId);

            // Kiểm tra badge sau khi comment
            try { await _badgeService.CheckAndAwardBadgesAsync(userId); } catch (Exception ex) { _logger.LogWarning(ex, "Badge check failed for user {UserId}", userId); }

            var result = MapToDto(comment, repliesCount: 0);
            var displayedBadge = await _badgeService.GetDisplayedBadgeAsync(userId);
            if (result.User is not null) result.User.DisplayedBadge = displayedBadge;
            return result;
        }

        // ─── Delete ────────────────────────────────────────────────────────────

        public async Task DeleteAsync(int commentId, int currentUserId)
        {
            var comment = await _context.Comments.FindAsync(commentId)
                ?? throw new KeyNotFoundException("Không tìm thấy comment.");

            if (comment.UserId != currentUserId)
                throw new UnauthorizedAccessException("Bạn không có quyền xóa comment này.");

            // EF Core sẽ cascade delete các reply theo config trong DbContext
            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} xóa comment {CommentId}", currentUserId, commentId);
        }

        // ─── Helpers ───────────────────────────────────────────────────────────

        private static CommentDto MapToDto(Comment c, int repliesCount) => new()
        {
            Id           = c.Id,
            PostId       = c.PostId,
            ParentId     = c.ParentId,
            Content      = c.Content,
            CreatedAt    = c.CreatedAt,
            RepliesCount = repliesCount,
            User = new UserSummaryDto
            {
                Id        = c.User.Id,
                Username  = c.User.Username,
                FullName  = c.User.FullName,
                AvatarUrl = c.User.AvatarUrl
            }
        };
    }
}
