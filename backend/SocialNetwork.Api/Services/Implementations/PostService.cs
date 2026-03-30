using Microsoft.EntityFrameworkCore;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.Data;
using SocialNetwork.Api.DTOs.Post;
using SocialNetwork.Api.DTOs.User;
using SocialNetwork.Api.Entities;
using SocialNetwork.Api.Services.Interfaces;

namespace SocialNetwork.Api.Services.Implementations
{
    public class PostService : IPostService
    {
        private readonly SocialDbContext _context;
        private readonly ILogger<PostService> _logger;

        public PostService(SocialDbContext context, ILogger<PostService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ─── GetFeed ───────────────────────────────────────────────────────────

        public async Task<PagedResult<PostDto>> GetFeedAsync(int currentUserId, int page, int pageSize)
        {
            // Lấy danh sách id những người mình đang follow
            var followingIds = await _context.Follows
                .Where(f => f.FollowerId == currentUserId)
                .Select(f => f.FollowingId)
                .ToListAsync();

            // Feed = posts của following + posts của chính mình
            var feedIds = followingIds.Append(currentUserId).ToHashSet();

            var query = _context.Posts
                .Include(p => p.User)
                .Where(p => feedIds.Contains(p.UserId))
                .OrderByDescending(p => p.CreatedAt);

            var total = await query.CountAsync();
            var posts = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = await MapToDtoListAsync(posts, currentUserId);
            return PagedResult<PostDto>.Create(items, total, page, pageSize);
        }

        // ─── GetUserPosts ──────────────────────────────────────────────────────

        public async Task<PagedResult<PostDto>> GetUserPostsAsync(int userId, int? currentUserId, int page, int pageSize)
        {
            var query = _context.Posts
                .Include(p => p.User)
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.CreatedAt);

            var total = await query.CountAsync();
            var posts = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = await MapToDtoListAsync(posts, currentUserId);
            return PagedResult<PostDto>.Create(items, total, page, pageSize);
        }

        // ─── GetById ───────────────────────────────────────────────────────────

        public async Task<PostDto> GetByIdAsync(int postId, int? currentUserId)
        {
            var post = await _context.Posts
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == postId)
                ?? throw new KeyNotFoundException("Không tìm thấy bài viết.");

            return await MapToDtoAsync(post, currentUserId);
        }

        // ─── Create ────────────────────────────────────────────────────────────

        public async Task<PostDto> CreateAsync(int userId, CreatePostDto dto)
        {
            var post = new Post
            {
                UserId    = userId,
                Content   = dto.Content.Trim(),
                ImageUrl  = dto.ImageUrl?.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();

            // Reload với User navigation để map đúng
            await _context.Entry(post).Reference(p => p.User).LoadAsync();

            _logger.LogInformation("User {UserId} tạo bài viết {PostId}", userId, post.Id);
            return await MapToDtoAsync(post, currentUserId: userId);
        }

        // ─── Update ────────────────────────────────────────────────────────────

        public async Task<PostDto> UpdateAsync(int postId, int currentUserId, UpdatePostDto dto)
        {
            var post = await _context.Posts
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == postId)
                ?? throw new KeyNotFoundException("Không tìm thấy bài viết.");

            if (post.UserId != currentUserId)
                throw new UnauthorizedAccessException("Bạn không có quyền sửa bài viết này.");

            post.Content   = dto.Content.Trim();
            post.ImageUrl  = dto.ImageUrl?.Trim();
            post.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} cập nhật bài viết {PostId}", currentUserId, postId);
            return await MapToDtoAsync(post, currentUserId);
        }

        // ─── Delete ────────────────────────────────────────────────────────────

        public async Task DeleteAsync(int postId, int currentUserId)
        {
            var post = await _context.Posts.FindAsync(postId)
                ?? throw new KeyNotFoundException("Không tìm thấy bài viết.");

            if (post.UserId != currentUserId)
                throw new UnauthorizedAccessException("Bạn không có quyền xóa bài viết này.");

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} xóa bài viết {PostId}", currentUserId, postId);
        }

        // ─── ToggleLike ────────────────────────────────────────────────────────

        public async Task<LikeResultDto> ToggleLikeAsync(int postId, int currentUserId)
        {
            var postExists = await _context.Posts.AnyAsync(p => p.Id == postId);
            if (!postExists)
                throw new KeyNotFoundException("Không tìm thấy bài viết.");

            var existing = await _context.PostLikes
                .FirstOrDefaultAsync(pl => pl.PostId == postId && pl.UserId == currentUserId);

            bool isLiked;

            if (existing is not null)
            {
                // Đã like → unlike
                _context.PostLikes.Remove(existing);

                // Xóa notification like tương ứng nếu có
                var likeNotif = await _context.Notifications
                    .FirstOrDefaultAsync(n =>
                        n.ActorId == currentUserId &&
                        n.NotificationType == "like" &&
                        n.EntityId == postId);

                if (likeNotif is not null)
                    _context.Notifications.Remove(likeNotif);

                isLiked = false;
            }
            else
            {
                // Chưa like → like
                _context.PostLikes.Add(new PostLike
                {
                    PostId    = postId,
                    UserId    = currentUserId,
                    CreatedAt = DateTime.UtcNow
                });

                // Tạo notification cho chủ bài (không tạo nếu tự like bài mình)
                var post = await _context.Posts.FindAsync(postId);
                if (post is not null && post.UserId != currentUserId)
                {
                    _context.Notifications.Add(new Notification
                    {
                        UserId           = post.UserId,
                        ActorId          = currentUserId,
                        NotificationType = "like",
                        EntityId         = postId,
                        IsRead           = false,
                        CreatedAt        = DateTime.UtcNow
                    });
                }

                isLiked = true;
            }

            await _context.SaveChangesAsync();

            var newCount = await _context.PostLikes.CountAsync(pl => pl.PostId == postId);
            return new LikeResultDto { IsLiked = isLiked, LikesCount = newCount };
        }

        // ─── Helpers ───────────────────────────────────────────────────────────

        /// <summary>Map danh sách Post entity sang DTO, batch query likes để tránh N+1.</summary>
        private async Task<List<PostDto>> MapToDtoListAsync(List<Post> posts, int? currentUserId)
        {
            if (posts.Count == 0) return [];

            var postIds = posts.Select(p => p.Id).ToList();

            // Batch query: đếm likes và comments cho tất cả posts trong 1 lần
            var likeCounts = await _context.PostLikes
                .Where(pl => postIds.Contains(pl.PostId))
                .GroupBy(pl => pl.PostId)
                .Select(g => new { PostId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.PostId, x => x.Count);

            var commentCounts = await _context.Comments
                .Where(c => postIds.Contains(c.PostId) && c.ParentId == null)
                .GroupBy(c => c.PostId)
                .Select(g => new { PostId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.PostId, x => x.Count);

            // Lấy những post mà currentUser đã like
            HashSet<int> likedPostIds = [];
            if (currentUserId.HasValue)
            {
                likedPostIds = (await _context.PostLikes
                    .Where(pl => postIds.Contains(pl.PostId) && pl.UserId == currentUserId.Value)
                    .Select(pl => pl.PostId)
                    .ToListAsync())
                    .ToHashSet();
            }

            return posts.Select(p => new PostDto
            {
                Id            = p.Id,
                User          = MapUserSummary(p.User),
                Content       = p.Content,
                ImageUrl      = p.ImageUrl,
                CreatedAt     = p.CreatedAt,
                UpdatedAt     = p.UpdatedAt,
                LikesCount    = likeCounts.GetValueOrDefault(p.Id, 0),
                CommentsCount = commentCounts.GetValueOrDefault(p.Id, 0),
                IsLiked       = likedPostIds.Contains(p.Id)
            }).ToList();
        }

        /// <summary>Map một Post entity sang DTO.</summary>
        private async Task<PostDto> MapToDtoAsync(Post post, int? currentUserId)
        {
            var likesCount    = await _context.PostLikes.CountAsync(pl => pl.PostId == post.Id);
            var commentsCount = await _context.Comments.CountAsync(c => c.PostId == post.Id && c.ParentId == null);
            var isLiked = currentUserId.HasValue &&
                          await _context.PostLikes.AnyAsync(pl => pl.PostId == post.Id && pl.UserId == currentUserId.Value);

            return new PostDto
            {
                Id            = post.Id,
                User          = MapUserSummary(post.User),
                Content       = post.Content,
                ImageUrl      = post.ImageUrl,
                CreatedAt     = post.CreatedAt,
                UpdatedAt     = post.UpdatedAt,
                LikesCount    = likesCount,
                CommentsCount = commentsCount,
                IsLiked       = isLiked
            };
        }

        private static UserSummaryDto MapUserSummary(User user) => new()
        {
            Id        = user.Id,
            Username  = user.Username,
            FullName  = user.FullName,
            AvatarUrl = user.AvatarUrl
        };

        // ─── SearchPosts ───────────────────────────────────────────────────────

        public async Task<PagedResult<PostDto>> SearchPostsAsync(string query, int? currentUserId, int page, int pageSize)
        {
            var trimmed = query.Trim();
            var baseQuery = _context.Posts
                .Include(p => p.User)
                .Where(p => EF.Functions.ILike(p.Content, $"%{trimmed}%"))
                .OrderByDescending(p => p.CreatedAt);

            var total = await baseQuery.CountAsync();
            var posts = await baseQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = await MapToDtoListAsync(posts, currentUserId);
            return PagedResult<PostDto>.Create(items, total, page, pageSize);
        }
    }
}
