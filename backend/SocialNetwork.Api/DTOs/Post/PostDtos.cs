using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using SocialNetwork.Api.DTOs.User;

namespace SocialNetwork.Api.DTOs.Post
{
    public class PostDto
    {
        public int Id { get; set; }
        public UserSummaryDto User { get; set; } = null!;
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? VideoUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        /// <summary>Public | FollowersOnly | Private</summary>
        public string Visibility { get; set; } = "Public";

        public int LikesCount { get; set; }
        public int CommentsCount { get; set; }
        public bool IsLiked { get; set; }

        /// <summary>Loại reaction của current user (null nếu chưa react).</summary>
        public string? MyReaction { get; set; }

        /// <summary>Số lượng từng loại reaction: { "Like": 5, "Love": 3, ... }</summary>
        public Dictionary<string, int> ReactionCounts { get; set; } = new();

        /// <summary>Hashtags được parse từ content.</summary>
        public List<string> Hashtags { get; set; } = new();
    }

    public class CreatePostDto
    {
        [Required, StringLength(2000, MinimumLength = 1)]
        public string Content { get; set; } = string.Empty;

        public string? ImageUrl { get; set; }

        public string? VideoUrl { get; set; }

        /// <summary>Public | FollowersOnly | Private. Default = Public.</summary>
        public string Visibility { get; set; } = "Public";
    }

    public class UpdatePostDto
    {
        [Required, StringLength(2000, MinimumLength = 1)]
        public string Content { get; set; } = string.Empty;

        public string? ImageUrl { get; set; }

        public string? VideoUrl { get; set; }

        /// <summary>Public | FollowersOnly | Private.</summary>
        public string? Visibility { get; set; }
    }

    /// <summary>Trả về sau khi toggle like/unlike.</summary>
    public class LikeResultDto
    {
        public bool IsLiked { get; set; }
        public int LikesCount { get; set; }
        /// <summary>Loại reaction after toggle (null nếu unlike).</summary>
        public string? ReactionType { get; set; }
        /// <summary>Số lượng từng loại reaction sau khi toggle.</summary>
        public Dictionary<string, int> ReactionCounts { get; set; } = new();
    }

    /// <summary>Body cho POST /api/posts/{id}/like</summary>
    public class ReactDto
    {
        /// <summary>Like | Love | Wow | Angry | Sad. Default = Like.</summary>
        public string ReactionType { get; set; } = "Like";
    }

    public class TrendingHashtagDto
    {
        public string Tag { get; set; } = string.Empty;
        public int PostCount { get; set; }
    }
}
