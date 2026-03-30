using System.ComponentModel.DataAnnotations;

namespace SocialNetwork.Api.DTOs.Admin
{
    // ─── Stats ────────────────────────────────────────────────────────────────

    public class AdminStatsDto
    {
        public int TotalUsers { get; set; }
        public int TotalPosts { get; set; }
        public int TotalComments { get; set; }
        public int PendingReports { get; set; }
        public int NewUsersToday { get; set; }
        public int NewPostsToday { get; set; }
    }

    // ─── Admin User view ──────────────────────────────────────────────────────

    public class AdminUserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public string? AvatarUrl { get; set; }
        public int PostCount { get; set; }
        public int FollowerCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ─── Admin Post view ──────────────────────────────────────────────────────

    public class AdminPostDto
    {
        public int Id { get; set; }
        public string AuthorUsername { get; set; } = string.Empty;
        public string? AuthorAvatarUrl { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public int LikesCount { get; set; }
        public int CommentsCount { get; set; }
        public int ReportCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ─── Reports ──────────────────────────────────────────────────────────────

    public class ReportDto
    {
        public int Id { get; set; }
        public string ReporterUsername { get; set; } = string.Empty;
        public string? TargetUsername { get; set; }
        public int? TargetPostId { get; set; }
        public string? TargetPostContent { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Detail { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }

    public class CreateReportDto
    {
        public int? TargetUserId { get; set; }
        public int? TargetPostId { get; set; }

        [Required, StringLength(50)]
        public string Reason { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Detail { get; set; }
    }

    // ─── Update DTOs ──────────────────────────────────────────────────────────

    public class ChangeRoleDto
    {
        [Required, StringLength(50)]
        public string Role { get; set; } = string.Empty;
    }
}
