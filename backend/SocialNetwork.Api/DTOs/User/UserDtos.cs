using System;
using SocialNetwork.Api.DTOs.Badge;

namespace SocialNetwork.Api.DTOs.User
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Hometown { get; set; }
        public string? Gender { get; set; }
        public string? AvatarUrl { get; set; }
        public string? CoverUrl { get; set; }
        public string? Bio { get; set; }
        public string Role { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        public int FollowersCount { get; set; }
        public int FollowingCount { get; set; }
        public int PostsCount { get; set; }

        /// <summary>
        /// true nếu currentUser đang follow người này (chỉ có ý nghĩa khi xem profile người khác)
        /// </summary>
        public bool IsFollowing { get; set; }

        /// <summary>Badge đang hiển thị</summary>
        public UserBadgeDto? DisplayedBadge { get; set; }
    }

    public class UpdateUserDto
    {
        public string? FullName { get; set; }
        public string? Bio { get; set; }
        public string? AvatarUrl { get; set; }
        public string? CoverUrl { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Hometown { get; set; }
        public string? Gender { get; set; }
    }

    public class UserSummaryDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string? AvatarUrl { get; set; }

        /// <summary>Badge đang hiển thị (nếu có)</summary>
        public UserBadgeDto? DisplayedBadge { get; set; }
    }

    /// <summary>
    /// Kết quả sau khi toggle follow/unfollow
    /// </summary>
    public class FollowResultDto
    {
        public bool IsFollowing { get; set; }
        public int FollowersCount { get; set; }
    }

    /// <summary>
    /// Payload để đổi mật khẩu — phải cung cấp mật khẩu cũ để xác thực.
    /// </summary>
    public class ChangePasswordDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required, System.ComponentModel.DataAnnotations.MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }
}
