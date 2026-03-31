using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.Data;
using SocialNetwork.Api.DTOs.Badge;
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
        private readonly IBadgeService _badgeService;

        public PostService(SocialDbContext context, ILogger<PostService> logger, IBadgeService badgeService)
        {
            _context = context;
            _logger = logger;
            _badgeService = badgeService;
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
                // Visibility filter: thấy Public từ tất cả, FollowersOnly từ following, Private chỉ của mình
                .Where(p => p.Visibility == "Public"
                         || (p.Visibility == "FollowersOnly" && followingIds.Contains(p.UserId))
                         || p.UserId == currentUserId)
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
            var isOwner = currentUserId.HasValue && currentUserId.Value == userId;
            var isFollower = !isOwner && currentUserId.HasValue
                && await _context.Follows.AnyAsync(f => f.FollowerId == currentUserId.Value && f.FollowingId == userId);

            var query = _context.Posts
                .Include(p => p.User)
                .Where(p => p.UserId == userId)
                // Owner thấy tất cả, follower thấy Public + FollowersOnly, người lạ chỉ Public
                .Where(p => isOwner
                         || p.Visibility == "Public"
                         || (isFollower && p.Visibility == "FollowersOnly"))
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
                UserId     = userId,
                Content    = dto.Content.Trim(),
                ImageUrl   = dto.ImageUrl?.Trim(),
                VideoUrl   = dto.VideoUrl?.Trim(),
                Visibility = ValidateVisibility(dto.Visibility),
                CreatedAt  = DateTime.UtcNow,
                UpdatedAt  = DateTime.UtcNow
            };

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();

            // Parse và lưu hashtags
            await SyncHashtagsAsync(post);

            // Reload với User navigation để map đúng
            await _context.Entry(post).Reference(p => p.User).LoadAsync();

            _logger.LogInformation("User {UserId} tạo bài viết {PostId}", userId, post.Id);

            // Kiểm tra badge sau khi tạo bài viết
            try { await _badgeService.CheckAndAwardBadgesAsync(userId); } catch (Exception ex) { _logger.LogWarning(ex, "Badge check failed for user {UserId}", userId); }

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
            post.VideoUrl  = dto.VideoUrl?.Trim();
            if (dto.Visibility is not null) post.Visibility = ValidateVisibility(dto.Visibility);
            post.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Re-sync hashtags sau khi edit
            await SyncHashtagsAsync(post);

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

        public async Task<LikeResultDto> ToggleLikeAsync(int postId, int currentUserId, string reactionType = "Like")
        {
            // Validate reaction type
            var validReactions = new HashSet<string> { "Like", "Love", "Wow", "Angry", "Sad" };
            if (!validReactions.Contains(reactionType)) reactionType = "Like";

            var postExists = await _context.Posts.AnyAsync(p => p.Id == postId);
            if (!postExists)
                throw new KeyNotFoundException("Không tìm thấy bài viết.");

            var existing = await _context.PostLikes
                .FirstOrDefaultAsync(pl => pl.PostId == postId && pl.UserId == currentUserId);

            bool isLiked;
            string? finalReaction = null;

            if (existing is not null)
            {
                if (existing.ReactionType == reactionType)
                {
                    // Cùng loại → unlike (xóa)
                    _context.PostLikes.Remove(existing);

                    var likeNotif = await _context.Notifications
                        .FirstOrDefaultAsync(n =>
                            n.ActorId == currentUserId &&
                            n.NotificationType == "like" &&
                            n.EntityId == postId);
                    if (likeNotif is not null) _context.Notifications.Remove(likeNotif);

                    isLiked = false;
                }
                else
                {
                    // Khác loại → đổi reaction
                    existing.ReactionType = reactionType;
                    existing.CreatedAt = DateTime.UtcNow;
                    isLiked = true;
                    finalReaction = reactionType;
                }
            }
            else
            {
                // Chưa react → thêm mới
                _context.PostLikes.Add(new PostLike
                {
                    PostId       = postId,
                    UserId       = currentUserId,
                    ReactionType = reactionType,
                    CreatedAt    = DateTime.UtcNow
                });

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
                finalReaction = reactionType;
            }

            await _context.SaveChangesAsync();

            var newCount = await _context.PostLikes.CountAsync(pl => pl.PostId == postId);
            var reactionCounts = await _context.PostLikes
                .Where(pl => pl.PostId == postId)
                .GroupBy(pl => pl.ReactionType)
                .Select(g => new { Type = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Type, x => x.Count);

            // Kiểm tra badge cho post owner (LikesReceived) khi like
            if (isLiked)
            {
                var postOwnerId = await _context.Posts.Where(p => p.Id == postId).Select(p => p.UserId).FirstOrDefaultAsync();
                if (postOwnerId > 0)
                {
                    try { await _badgeService.CheckAndAwardBadgesAsync(postOwnerId); } catch (Exception ex) { _logger.LogWarning(ex, "Badge check failed for post owner {UserId}", postOwnerId); }
                }
            }

            return new LikeResultDto
            {
                IsLiked = isLiked,
                LikesCount = newCount,
                ReactionType = finalReaction,
                ReactionCounts = reactionCounts
            };
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
                .Where(c => postIds.Contains(c.PostId))
                .GroupBy(c => c.PostId)
                .Select(g => new { PostId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.PostId, x => x.Count);

            // Reaction counts per post per type
            var reactionData = await _context.PostLikes
                .Where(pl => postIds.Contains(pl.PostId))
                .GroupBy(pl => new { pl.PostId, pl.ReactionType })
                .Select(g => new { g.Key.PostId, g.Key.ReactionType, Count = g.Count() })
                .ToListAsync();
            var reactionMap = reactionData
                .GroupBy(x => x.PostId)
                .ToDictionary(g => g.Key, g => g.ToDictionary(x => x.ReactionType, x => x.Count));

            // Current user's reaction per post
            Dictionary<int, string> myReactions = new();
            HashSet<int> likedPostIds = [];
            if (currentUserId.HasValue)
            {
                var userReactions = await _context.PostLikes
                    .Where(pl => postIds.Contains(pl.PostId) && pl.UserId == currentUserId.Value)
                    .Select(pl => new { pl.PostId, pl.ReactionType })
                    .ToListAsync();
                likedPostIds = userReactions.Select(x => x.PostId).ToHashSet();
                myReactions = userReactions.ToDictionary(x => x.PostId, x => x.ReactionType);
            }

            // Hashtags per post
            var hashtagData = await _context.PostHashtags
                .Where(ph => postIds.Contains(ph.PostId))
                .Select(ph => new { ph.PostId, ph.Tag })
                .ToListAsync();
            var hashtagMap = hashtagData
                .GroupBy(x => x.PostId)
                .ToDictionary(g => g.Key, g => g.Select(x => x.Tag).ToList());

            // Displayed badges cho tất cả post authors (batch)
            var authorIds = posts.Select(p => p.UserId).Distinct();
            var badgeMap = await _badgeService.GetDisplayedBadgesForUsersAsync(authorIds);

            return posts.Select(p => new PostDto
            {
                Id             = p.Id,
                User           = MapUserSummary(p.User, badgeMap.GetValueOrDefault(p.UserId)),
                Content        = p.Content,
                ImageUrl       = p.ImageUrl,
                VideoUrl       = p.VideoUrl,
                Visibility     = p.Visibility,
                CreatedAt      = p.CreatedAt,
                UpdatedAt      = p.UpdatedAt,
                LikesCount     = likeCounts.GetValueOrDefault(p.Id, 0),
                CommentsCount  = commentCounts.GetValueOrDefault(p.Id, 0),
                IsLiked        = likedPostIds.Contains(p.Id),
                MyReaction     = myReactions.GetValueOrDefault(p.Id),
                ReactionCounts = reactionMap.GetValueOrDefault(p.Id, new Dictionary<string, int>()),
                Hashtags       = hashtagMap.GetValueOrDefault(p.Id, new List<string>())
            }).ToList();
        }

        /// <summary>Map một Post entity sang DTO.</summary>
        private async Task<PostDto> MapToDtoAsync(Post post, int? currentUserId)
        {
            var likesCount    = await _context.PostLikes.CountAsync(pl => pl.PostId == post.Id);
            var commentsCount = await _context.Comments.CountAsync(c => c.PostId == post.Id);

            string? myReaction = null;
            bool isLiked = false;
            if (currentUserId.HasValue)
            {
                var userReaction = await _context.PostLikes
                    .Where(pl => pl.PostId == post.Id && pl.UserId == currentUserId.Value)
                    .Select(pl => pl.ReactionType)
                    .FirstOrDefaultAsync();
                isLiked = userReaction != null;
                myReaction = userReaction;
            }

            var reactionCounts = await _context.PostLikes
                .Where(pl => pl.PostId == post.Id)
                .GroupBy(pl => pl.ReactionType)
                .Select(g => new { Type = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Type, x => x.Count);

            var hashtags = await _context.PostHashtags
                .Where(ph => ph.PostId == post.Id)
                .Select(ph => ph.Tag)
                .ToListAsync();

            var displayedBadge = await _badgeService.GetDisplayedBadgeAsync(post.UserId);

            return new PostDto
            {
                Id             = post.Id,
                User           = MapUserSummary(post.User, displayedBadge),
                Content        = post.Content,
                ImageUrl       = post.ImageUrl,
                VideoUrl       = post.VideoUrl,
                Visibility     = post.Visibility,
                CreatedAt      = post.CreatedAt,
                UpdatedAt      = post.UpdatedAt,
                LikesCount     = likesCount,
                CommentsCount  = commentsCount,
                IsLiked        = isLiked,
                MyReaction     = myReaction,
                ReactionCounts = reactionCounts,
                Hashtags       = hashtags
            };
        }

        private static string ValidateVisibility(string visibility)
        {
            return visibility switch
            {
                "Public" or "FollowersOnly" or "Private" => visibility,
                _ => "Public"
            };
        }

        private static UserSummaryDto MapUserSummary(User user, UserBadgeDto? displayedBadge = null) => new()
        {
            Id        = user.Id,
            Username  = user.Username,
            FullName  = user.FullName,
            AvatarUrl = user.AvatarUrl,
            DisplayedBadge = displayedBadge
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

        // ─── Hashtag Helpers ───────────────────────────────────────────────────

        private static readonly Regex HashtagRegex = new(@"#(\w{1,100})", RegexOptions.Compiled);

        /// <summary>Parse hashtags từ content và đồng bộ vào PostHashtags table.</summary>
        private async Task SyncHashtagsAsync(Post post)
        {
            // Xóa hashtags cũ
            var existing = await _context.PostHashtags
                .Where(ph => ph.PostId == post.Id)
                .ToListAsync();
            if (existing.Count > 0) _context.PostHashtags.RemoveRange(existing);

            // Parse hashtags mới từ content
            var matches = HashtagRegex.Matches(post.Content);
            var tags = matches
                .Select(m => m.Groups[1].Value.ToLowerInvariant())
                .Distinct()
                .Take(20) // Giới hạn 20 hashtags per post
                .ToList();

            foreach (var tag in tags)
            {
                _context.PostHashtags.Add(new PostHashtag { PostId = post.Id, Tag = tag });
            }

            if (tags.Count > 0) await _context.SaveChangesAsync();
        }

        /// <summary>Lấy posts theo hashtag.</summary>
        public async Task<PagedResult<PostDto>> GetByHashtagAsync(string tag, int? currentUserId, int page, int pageSize)
        {
            var normalizedTag = tag.TrimStart('#').ToLowerInvariant();

            var postIds = _context.PostHashtags
                .Where(ph => ph.Tag == normalizedTag)
                .Select(ph => ph.PostId);

            var query = _context.Posts
                .Include(p => p.User)
                .Where(p => postIds.Contains(p.Id))
                .OrderByDescending(p => p.CreatedAt);

            var total = await query.CountAsync();
            var posts = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = await MapToDtoListAsync(posts, currentUserId);
            return PagedResult<PostDto>.Create(items, total, page, pageSize);
        }

        /// <summary>Top trending hashtags trong 24h.</summary>
        public async Task<List<TrendingHashtagDto>> GetTrendingHashtagsAsync(int limit = 10)
        {
            var cutoff = DateTime.UtcNow.AddHours(-24);

            return await _context.PostHashtags
                .Where(ph => _context.Posts.Any(p => p.Id == ph.PostId && p.CreatedAt >= cutoff))
                .GroupBy(ph => ph.Tag)
                .Select(g => new TrendingHashtagDto
                {
                    Tag = g.Key,
                    PostCount = g.Count()
                })
                .OrderByDescending(x => x.PostCount)
                .Take(limit)
                .ToListAsync();
        }

        /// <summary>Lấy batch Reels ngẫu nhiên (posts có video, public).</summary>
        public async Task<List<PostDto>> GetReelsAsync(int? currentUserId, int count = 10)
        {
            var reels = await _context.Posts
                .Include(p => p.User)
                .Where(p => p.VideoUrl != null && p.Visibility == "Public")
                .OrderBy(_ => EF.Functions.Random())
                .Take(count)
                .ToListAsync();

            return await MapToDtoListAsync(reels, currentUserId);
        }
    }
}
