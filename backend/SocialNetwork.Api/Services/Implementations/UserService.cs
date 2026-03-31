using Microsoft.EntityFrameworkCore;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.Data;
using SocialNetwork.Api.DTOs.User;
using SocialNetwork.Api.Entities;
using SocialNetwork.Api.Services.Interfaces;

namespace SocialNetwork.Api.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly SocialDbContext _context;
        private readonly ILogger<UserService> _logger;
        private readonly IBadgeService _badgeService;

        public UserService(SocialDbContext context, ILogger<UserService> logger, IBadgeService badgeService)
        {
            _context = context;
            _logger = logger;
            _badgeService = badgeService;
        }

        // ─── GetProfile ────────────────────────────────────────────────────────

        public async Task<UserDto> GetProfileAsync(string username, int? currentUserId)
        {
            // Tìm user không phân biệt hoa thường
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());

            if (user is null)
                throw new KeyNotFoundException($"Không tìm thấy user '{username}'.");

            return await BuildUserDtoAsync(user, currentUserId);
        }

        // ─── UpdateProfile ─────────────────────────────────────────────────────

        public async Task<UserDto> UpdateProfileAsync(int userId, UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("Không tìm thấy user.");

            // Chỉ cập nhật field nào được gửi lên (không null)
            if (dto.FullName is not null) user.FullName = dto.FullName.Trim();
            if (dto.Bio is not null)      user.Bio = dto.Bio.Trim();
            if (dto.AvatarUrl is not null) user.AvatarUrl = dto.AvatarUrl.Trim();
            if (dto.CoverUrl is not null)  user.CoverUrl = dto.CoverUrl.Trim();
            if (dto.DateOfBirth.HasValue)  user.DateOfBirth = dto.DateOfBirth;
            if (dto.Hometown is not null)  user.Hometown = dto.Hometown.Trim();
            if (dto.Gender is not null)    user.Gender = dto.Gender.Trim();

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} cập nhật profile.", userId);
            return await BuildUserDtoAsync(user, currentUserId: userId);
        }

        // ─── ToggleFollow ──────────────────────────────────────────────────────

        public async Task<FollowResultDto> ToggleFollowAsync(int currentUserId, int targetUserId)
        {
            if (currentUserId == targetUserId)
                throw new InvalidOperationException("Không thể tự follow bản thân.");

            // Kiểm tra target user tồn tại
            var targetExists = await _context.Users.AnyAsync(u => u.Id == targetUserId);
            if (!targetExists)
                throw new KeyNotFoundException("Không tìm thấy user.");

            var existing = await _context.Follows
                .FirstOrDefaultAsync(f => f.FollowerId == currentUserId && f.FollowingId == targetUserId);

            bool isFollowing;

            if (existing is not null)
            {
                // Đang follow → unfollow
                _context.Follows.Remove(existing);
                isFollowing = false;
                _logger.LogInformation("User {From} unfollow User {To}", currentUserId, targetUserId);
            }
            else
            {
                // Chưa follow → follow
                _context.Follows.Add(new Follow
                {
                    FollowerId = currentUserId,
                    FollowingId = targetUserId,
                    CreatedAt = DateTime.UtcNow
                });
                isFollowing = true;
                _logger.LogInformation("User {From} follow User {To}", currentUserId, targetUserId);
            }

            await _context.SaveChangesAsync();

            // Đếm lại followers của target sau khi toggle
            var newFollowersCount = await _context.Follows
                .CountAsync(f => f.FollowingId == targetUserId);

            // Kiểm tra badge cho target user (FollowersCount) khi follow
            if (isFollowing)
            {
                try { await _badgeService.CheckAndAwardBadgesAsync(targetUserId); } catch { /* log elsewhere */ }
            }

            return new FollowResultDto
            {
                IsFollowing = isFollowing,
                FollowersCount = newFollowersCount
            };
        }

        // ─── GetFollowers ──────────────────────────────────────────────────────

        public async Task<PagedResult<UserSummaryDto>> GetFollowersAsync(int userId, int page, int pageSize)
        {
            var query = _context.Follows
                .Where(f => f.FollowingId == userId)
                .Select(f => f.Follower);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => MapToSummary(u))
                .ToListAsync();

            return PagedResult<UserSummaryDto>.Create(items, total, page, pageSize);
        }

        // ─── GetFollowing ──────────────────────────────────────────────────────

        public async Task<PagedResult<UserSummaryDto>> GetFollowingAsync(int userId, int page, int pageSize)
        {
            var query = _context.Follows
                .Where(f => f.FollowerId == userId)
                .Select(f => f.Following);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => MapToSummary(u))
                .ToListAsync();

            return PagedResult<UserSummaryDto>.Create(items, total, page, pageSize);
        }

        // ─── SearchUsers ───────────────────────────────────────────────────────

        public async Task<List<UserSummaryDto>> SearchUsersAsync(string query, int? currentUserId)
        {
            if (string.IsNullOrWhiteSpace(query))
                return [];

            var q = query.Trim().ToLower();

            return await _context.Users
                .Where(u =>
                    // Loại bản thân ra khỏi kết quả tìm kiếm
                    (!currentUserId.HasValue || u.Id != currentUserId.Value) &&
                    (u.Username.ToLower().Contains(q) ||
                     (u.FullName != null && u.FullName.ToLower().Contains(q))))
                .OrderBy(u => u.Username)
                .Take(20)
                .Select(u => MapToSummary(u))
                .ToListAsync();
        }

        // ─── GetSuggestions ────────────────────────────────────────────────────

        public async Task<List<UserSummaryDto>> GetSuggestionsAsync(int currentUserId)
        {
            // Lấy danh sách id mà currentUser đã follow
            var alreadyFollowing = await _context.Follows
                .Where(f => f.FollowerId == currentUserId)
                .Select(f => f.FollowingId)
                .ToHashSetAsync();

            // Đề xuất: chưa follow + không phải bản thân, sắp xếp theo số followers
            return await _context.Users
                .Where(u => u.Id != currentUserId && !alreadyFollowing.Contains(u.Id))
                .Select(u => new
                {
                    User = u,
                    // Đếm followers để sắp xếp phổ biến nhất lên đầu
                    FollowerCount = _context.Follows.Count(f => f.FollowingId == u.Id)
                })
                .OrderByDescending(x => x.FollowerCount)
                .Take(10)
                .Select(x => MapToSummary(x.User))
                .ToListAsync();
        }

        // ─── Helpers ───────────────────────────────────────────────────────────

        /// <summary>
        /// Tổng hợp UserDto đầy đủ gồm followers/following/posts count và isFollowing.
        /// </summary>
        private async Task<UserDto> BuildUserDtoAsync(User user, int? currentUserId)
        {
            var followersCount = await _context.Follows.CountAsync(f => f.FollowingId == user.Id);
            var followingCount = await _context.Follows.CountAsync(f => f.FollowerId == user.Id);
            var postsCount     = await _context.Posts.CountAsync(p => p.UserId == user.Id);

            // isFollowing chỉ có ý nghĩa khi đang đăng nhập và xem người khác
            bool isFollowing = false;
            if (currentUserId.HasValue && currentUserId.Value != user.Id)
            {
                isFollowing = await _context.Follows
                    .AnyAsync(f => f.FollowerId == currentUserId.Value && f.FollowingId == user.Id);
            }

            return new UserDto
            {
                Id             = user.Id,
                Username       = user.Username,
                Email          = user.Email,
                FullName       = user.FullName,
                DateOfBirth    = user.DateOfBirth,
                Hometown       = user.Hometown,
                Gender         = user.Gender,
                AvatarUrl      = user.AvatarUrl,
                CoverUrl       = user.CoverUrl,
                Bio            = user.Bio,
                Role           = user.Role,
                CreatedAt      = user.CreatedAt,
                FollowersCount = followersCount,
                FollowingCount = followingCount,
                PostsCount     = postsCount,
                IsFollowing    = isFollowing,
                DisplayedBadge = await _badgeService.GetDisplayedBadgeAsync(user.Id)
            };
        }

        // ─── ChangePassword ────────────────────────────────────────────────────

        public async Task ChangePasswordAsync(int userId, ChangePasswordDto dto)
        {
            var user = await _context.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("Không tìm thấy user.");

            // Xác thực mật khẩu hiện tại trước khi đổi
            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                throw new UnauthorizedAccessException("Mật khẩu hiện tại không đúng.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword, workFactor: 12);
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} đổi mật khẩu thành công.", userId);
        }

        // ─── Helpers ───────────────────────────────────────────────────────────

        /// <summary>
        /// Map User entity sang UserSummaryDto (dùng trong danh sách followers/following/search).
        /// </summary>
        private static UserSummaryDto MapToSummary(User user) => new()
        {
            Id        = user.Id,
            Username  = user.Username,
            FullName  = user.FullName,
            AvatarUrl = user.AvatarUrl
        };
    }
}
