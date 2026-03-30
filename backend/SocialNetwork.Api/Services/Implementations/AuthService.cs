using Microsoft.EntityFrameworkCore;
using SocialNetwork.Api.Data;
using SocialNetwork.Api.DTOs.Auth;
using SocialNetwork.Api.DTOs.User;
using SocialNetwork.Api.Entities;
using SocialNetwork.Api.Helpers;
using SocialNetwork.Api.Services.Interfaces;

namespace SocialNetwork.Api.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly SocialDbContext _context;
        private readonly JwtHelper _jwt;
        private readonly ILogger<AuthService> _logger;

        public AuthService(SocialDbContext context, JwtHelper jwt, ILogger<AuthService> logger)
        {
            _context = context;
            _jwt = jwt;
            _logger = logger;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            // Kiểm tra username đã tồn tại
            if (await _context.Users.AnyAsync(u => u.Username == dto.Username.Trim()))
                throw new InvalidOperationException("Username đã được sử dụng.");

            // Kiểm tra email đã tồn tại (so sánh lowercase)
            var emailNormalized = dto.Email.Trim().ToLowerInvariant();
            if (await _context.Users.AnyAsync(u => u.Email == emailNormalized))
                throw new InvalidOperationException("Email đã được sử dụng.");

            var user = new User
            {
                Username = dto.Username.Trim(),
                Email = emailNormalized,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 12),
                FullName = dto.FullName?.Trim(),
                DateOfBirth = dto.DateOfBirth,
                Role = "Member",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User đăng ký thành công: {Username} (Id: {UserId})",
                user.Username, user.Id);

            var token = _jwt.GenerateToken(user);
            return BuildAuthResponse(user, token, followersCount: 0, followingCount: 0);
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            // Tìm user bằng email hoặc username (case-insensitive)
            var input = dto.EmailOrUsername.Trim().ToLowerInvariant();
            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.Email == input ||
                    u.Username.ToLower() == input);

            // Trả cùng thông báo cho cả 2 trường hợp để tránh user enumeration
            if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Tài khoản hoặc mật khẩu không đúng.");

            // Kiểm tra tài khoản bị ban
            if (!user.IsActive)
                throw new UnauthorizedAccessException("Tài khoản đã bị vô hiệu hóa.");

            _logger.LogInformation("User đăng nhập: {Username} (Id: {UserId})",
                user.Username, user.Id);

            var followersCount = await _context.Follows.CountAsync(f => f.FollowingId == user.Id);
            var followingCount = await _context.Follows.CountAsync(f => f.FollowerId == user.Id);

            var token = _jwt.GenerateToken(user);
            return BuildAuthResponse(user, token, followersCount, followingCount);
        }

        public async Task<UserDto> GetCurrentUserAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId)
                ?? throw new KeyNotFoundException("Không tìm thấy user.");

            var followersCount = await _context.Follows.CountAsync(f => f.FollowingId == userId);
            var followingCount = await _context.Follows.CountAsync(f => f.FollowerId == userId);

            return MapToUserDto(user, followersCount, followingCount);
        }

        // --- Private helpers ---

        private static AuthResponseDto BuildAuthResponse(
            User user, string token, int followersCount, int followingCount)
        {
            return new AuthResponseDto
            {
                Token = token,
                User = MapToUserDto(user, followersCount, followingCount)
            };
        }

        private static UserDto MapToUserDto(User user, int followersCount, int followingCount)
        {
            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                DateOfBirth = user.DateOfBirth,
                AvatarUrl = user.AvatarUrl,
                CoverUrl = user.CoverUrl,
                Bio = user.Bio,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                FollowersCount = followersCount,
                FollowingCount = followingCount
            };
        }
    }
}
