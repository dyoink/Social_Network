using Microsoft.EntityFrameworkCore;
using SocialNetwork.Api.Data;
using SocialNetwork.Api.DTOs.Badge;
using SocialNetwork.Api.Entities;
using SocialNetwork.Api.Services.Interfaces;

namespace SocialNetwork.Api.Services.Implementations
{
    public class BadgeService : IBadgeService
    {
        private readonly SocialDbContext _context;
        private readonly ILogger<BadgeService> _logger;

        private static readonly HashSet<string> ValidConditionTypes = new()
        {
            "PostCount", "LikesReceived", "CommentsCount",
            "FollowersCount", "DaysActive", "PokesSent", "Manual"
        };

        public BadgeService(SocialDbContext context, ILogger<BadgeService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ─── Auto Award ────────────────────────────────────────────────────────

        public async Task CheckAndAwardBadgesAsync(int userId)
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
            if (!userExists) return;

            // Lấy tất cả badges tự động (không phải ManualOnly)
            var autoBadges = await _context.Badges
                .Where(b => !b.IsManualOnly && b.ConditionValue != null)
                .ToListAsync();

            // Lấy badges đã có của user
            var earnedBadgeIds = await _context.UserBadges
                .Where(ub => ub.UserId == userId)
                .Select(ub => ub.BadgeId)
                .ToHashSetAsync();

            // Tính toán các metrics 1 lần
            var metrics = await GetUserMetricsAsync(userId);

            foreach (var badge in autoBadges)
            {
                if (earnedBadgeIds.Contains(badge.Id)) continue;

                var currentValue = GetMetricValue(metrics, badge.ConditionType);
                if (currentValue >= badge.ConditionValue!.Value)
                {
                    _context.UserBadges.Add(new UserBadge
                    {
                        UserId = userId,
                        BadgeId = badge.Id,
                        EarnedAt = DateTime.UtcNow,
                        IsDisplayed = false
                    });

                    _logger.LogInformation(
                        "User {UserId} nhận badge {BadgeName} (#{BadgeId})",
                        userId, badge.Name, badge.Id);
                }
            }

            await _context.SaveChangesAsync();
        }

        // ─── Manual Award/Revoke ───────────────────────────────────────────────

        public async Task AwardBadgeAsync(int userId, int badgeId)
        {
            var badge = await _context.Badges.FindAsync(badgeId)
                ?? throw new KeyNotFoundException("Không tìm thấy badge.");

            var user = await _context.Users.AnyAsync(u => u.Id == userId);
            if (!user) throw new KeyNotFoundException("Không tìm thấy user.");

            var exists = await _context.UserBadges
                .AnyAsync(ub => ub.UserId == userId && ub.BadgeId == badgeId);
            if (exists) throw new InvalidOperationException("User đã có badge này.");

            _context.UserBadges.Add(new UserBadge
            {
                UserId = userId,
                BadgeId = badgeId,
                EarnedAt = DateTime.UtcNow,
                IsDisplayed = false
            });
            await _context.SaveChangesAsync();

            _logger.LogInformation("Admin cấp badge {BadgeName} cho User {UserId}", badge.Name, userId);
        }

        public async Task RevokeBadgeAsync(int userId, int badgeId)
        {
            var ub = await _context.UserBadges
                .FirstOrDefaultAsync(x => x.UserId == userId && x.BadgeId == badgeId)
                ?? throw new KeyNotFoundException("User chưa có badge này.");

            _context.UserBadges.Remove(ub);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Admin thu hồi badge #{BadgeId} của User {UserId}", badgeId, userId);
        }

        // ─── User Badges ───────────────────────────────────────────────────────

        public async Task<List<UserBadgeDto>> GetUserBadgesAsync(int userId)
        {
            return await _context.UserBadges
                .Include(ub => ub.Badge)
                .Where(ub => ub.UserId == userId)
                .OrderByDescending(ub => ub.EarnedAt)
                .Select(ub => new UserBadgeDto
                {
                    BadgeId = ub.BadgeId,
                    Name = ub.Badge.Name,
                    Description = ub.Badge.Description,
                    Icon = ub.Badge.Icon,
                    Color = ub.Badge.Color,
                    EarnedAt = ub.EarnedAt,
                    IsDisplayed = ub.IsDisplayed
                })
                .ToListAsync();
        }

        public async Task<UserBadgeDto?> GetDisplayedBadgeAsync(int userId)
        {
            return await _context.UserBadges
                .Include(ub => ub.Badge)
                .Where(ub => ub.UserId == userId && ub.IsDisplayed)
                .Select(ub => new UserBadgeDto
                {
                    BadgeId = ub.BadgeId,
                    Name = ub.Badge.Name,
                    Description = ub.Badge.Description,
                    Icon = ub.Badge.Icon,
                    Color = ub.Badge.Color,
                    EarnedAt = ub.EarnedAt,
                    IsDisplayed = true
                })
                .FirstOrDefaultAsync();
        }

        public async Task<Dictionary<int, UserBadgeDto>> GetDisplayedBadgesForUsersAsync(IEnumerable<int> userIds)
        {
            var idList = userIds.ToList();
            if (idList.Count == 0) return new();

            return await _context.UserBadges
                .Include(ub => ub.Badge)
                .Where(ub => idList.Contains(ub.UserId) && ub.IsDisplayed)
                .ToDictionaryAsync(
                    ub => ub.UserId,
                    ub => new UserBadgeDto
                    {
                        BadgeId = ub.BadgeId,
                        Name = ub.Badge.Name,
                        Description = ub.Badge.Description,
                        Icon = ub.Badge.Icon,
                        Color = ub.Badge.Color,
                        EarnedAt = ub.EarnedAt,
                        IsDisplayed = true
                    });
        }

        // ─── Display Toggle ────────────────────────────────────────────────────

        public async Task SetDisplayBadgeAsync(int userId, int? badgeId)
        {
            // Tắt tất cả badge đang display
            var displayedBadges = await _context.UserBadges
                .Where(ub => ub.UserId == userId && ub.IsDisplayed)
                .ToListAsync();

            foreach (var b in displayedBadges)
                b.IsDisplayed = false;

            // Bật badge mới nếu có
            if (badgeId.HasValue)
            {
                var target = await _context.UserBadges
                    .FirstOrDefaultAsync(ub => ub.UserId == userId && ub.BadgeId == badgeId.Value)
                    ?? throw new KeyNotFoundException("Bạn chưa có badge này.");

                target.IsDisplayed = true;
            }

            await _context.SaveChangesAsync();
        }

        // ─── Progress ──────────────────────────────────────────────────────────

        public async Task<List<BadgeProgressDto>> GetBadgeProgressAsync(int userId)
        {
            var metrics = await GetUserMetricsAsync(userId);

            var earnedBadges = await _context.UserBadges
                .Where(ub => ub.UserId == userId)
                .ToDictionaryAsync(ub => ub.BadgeId, ub => ub.EarnedAt);

            var badges = await _context.Badges
                .OrderBy(b => b.ConditionType)
                .ThenBy(b => b.ConditionValue)
                .ToListAsync();

            return badges.Select(b => new BadgeProgressDto
            {
                BadgeId = b.Id,
                Name = b.Name,
                Description = b.Description,
                Icon = b.Icon,
                Color = b.Color,
                ConditionType = b.ConditionType,
                ConditionValue = b.ConditionValue ?? 0,
                CurrentValue = b.IsManualOnly ? 0 : GetMetricValue(metrics, b.ConditionType),
                IsEarned = earnedBadges.ContainsKey(b.Id),
                EarnedAt = earnedBadges.GetValueOrDefault(b.Id)
            }).ToList();
        }

        // ─── Admin CRUD ────────────────────────────────────────────────────────

        public async Task<List<BadgeDto>> GetAllBadgesAsync()
        {
            return await _context.Badges
                .Select(b => new BadgeDto
                {
                    Id = b.Id,
                    Name = b.Name,
                    Description = b.Description,
                    Icon = b.Icon,
                    Color = b.Color,
                    ConditionType = b.ConditionType,
                    ConditionValue = b.ConditionValue,
                    IsManualOnly = b.IsManualOnly,
                    UsersCount = b.UserBadges.Count
                })
                .OrderBy(b => b.Id)
                .ToListAsync();
        }

        public async Task<BadgeDto> CreateBadgeAsync(CreateBadgeDto dto)
        {
            if (!ValidConditionTypes.Contains(dto.ConditionType))
                throw new InvalidOperationException($"ConditionType không hợp lệ: {dto.ConditionType}");

            var badge = new Badge
            {
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                Icon = dto.Icon.Trim(),
                Color = dto.Color.Trim(),
                ConditionType = dto.ConditionType,
                ConditionValue = dto.ConditionValue,
                IsManualOnly = dto.IsManualOnly,
                CreatedAt = DateTime.UtcNow
            };

            _context.Badges.Add(badge);
            await _context.SaveChangesAsync();

            return new BadgeDto
            {
                Id = badge.Id,
                Name = badge.Name,
                Description = badge.Description,
                Icon = badge.Icon,
                Color = badge.Color,
                ConditionType = badge.ConditionType,
                ConditionValue = badge.ConditionValue,
                IsManualOnly = badge.IsManualOnly,
                UsersCount = 0
            };
        }

        public async Task<BadgeDto> UpdateBadgeAsync(int badgeId, UpdateBadgeDto dto)
        {
            var badge = await _context.Badges.FindAsync(badgeId)
                ?? throw new KeyNotFoundException("Không tìm thấy badge.");

            if (dto.Name is not null) badge.Name = dto.Name.Trim();
            if (dto.Description is not null) badge.Description = dto.Description.Trim();
            if (dto.Icon is not null) badge.Icon = dto.Icon.Trim();
            if (dto.Color is not null) badge.Color = dto.Color.Trim();
            if (dto.ConditionType is not null)
            {
                if (!ValidConditionTypes.Contains(dto.ConditionType))
                    throw new InvalidOperationException($"ConditionType không hợp lệ: {dto.ConditionType}");
                badge.ConditionType = dto.ConditionType;
            }
            if (dto.ConditionValue.HasValue) badge.ConditionValue = dto.ConditionValue;
            if (dto.IsManualOnly.HasValue) badge.IsManualOnly = dto.IsManualOnly.Value;

            await _context.SaveChangesAsync();

            var usersCount = await _context.UserBadges.CountAsync(ub => ub.BadgeId == badgeId);
            return new BadgeDto
            {
                Id = badge.Id,
                Name = badge.Name,
                Description = badge.Description,
                Icon = badge.Icon,
                Color = badge.Color,
                ConditionType = badge.ConditionType,
                ConditionValue = badge.ConditionValue,
                IsManualOnly = badge.IsManualOnly,
                UsersCount = usersCount
            };
        }

        public async Task DeleteBadgeAsync(int badgeId)
        {
            var badge = await _context.Badges.FindAsync(badgeId)
                ?? throw new KeyNotFoundException("Không tìm thấy badge.");

            _context.Badges.Remove(badge);
            await _context.SaveChangesAsync();
        }

        // ─── Private Helpers ───────────────────────────────────────────────────

        private async Task<UserMetrics> GetUserMetricsAsync(int userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user is null) return new UserMetrics();

            var postCount = await _context.Posts.CountAsync(p => p.UserId == userId);
            var likesReceived = await _context.PostLikes
                .CountAsync(pl => _context.Posts.Any(p => p.Id == pl.PostId && p.UserId == userId));
            var commentsCount = await _context.Comments.CountAsync(c => c.UserId == userId);
            var followersCount = await _context.Follows.CountAsync(f => f.FollowingId == userId);
            var daysActive = (DateTime.UtcNow - user.CreatedAt).Days + 1; // +1 cho ngày đăng ký

            // Poke count: đếm notification type "poke" mà actor là user này
            var pokesSent = await _context.Notifications
                .CountAsync(n => n.ActorId == userId && n.NotificationType == "poke");

            return new UserMetrics
            {
                PostCount = postCount,
                LikesReceived = likesReceived,
                CommentsCount = commentsCount,
                FollowersCount = followersCount,
                DaysActive = daysActive,
                PokesSent = pokesSent
            };
        }

        private static int GetMetricValue(UserMetrics metrics, string conditionType) => conditionType switch
        {
            "PostCount" => metrics.PostCount,
            "LikesReceived" => metrics.LikesReceived,
            "CommentsCount" => metrics.CommentsCount,
            "FollowersCount" => metrics.FollowersCount,
            "DaysActive" => metrics.DaysActive,
            "PokesSent" => metrics.PokesSent,
            _ => 0
        };

        private class UserMetrics
        {
            public int PostCount { get; set; }
            public int LikesReceived { get; set; }
            public int CommentsCount { get; set; }
            public int FollowersCount { get; set; }
            public int DaysActive { get; set; }
            public int PokesSent { get; set; }
        }
    }
}
