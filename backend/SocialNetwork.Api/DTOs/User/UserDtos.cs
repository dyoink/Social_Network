using System;

namespace SocialNetwork.Api.DTOs.User
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? AvatarUrl { get; set; }
        public string? CoverUrl { get; set; }
        public string? Bio { get; set; }
        public string Role { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        
        public int FollowersCount { get; set; }
        public int FollowingCount { get; set; }
    }

    public class UpdateUserDto
    {
        public string? FullName { get; set; }
        public string? Bio { get; set; }
        public string? AvatarUrl { get; set; }
        public string? CoverUrl { get; set; }
        public DateTime? DateOfBirth { get; set; }
    }
    
    public class UserSummaryDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string? AvatarUrl { get; set; }
    }
}
