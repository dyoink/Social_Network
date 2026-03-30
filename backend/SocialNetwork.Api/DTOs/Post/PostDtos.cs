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
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public int LikesCount { get; set; }
        public int CommentsCount { get; set; }
        public bool IsLiked { get; set; }
    }

    public class CreatePostDto
    {
        [Required, StringLength(2000, MinimumLength = 1)]
        public string Content { get; set; } = string.Empty;

        public string? ImageUrl { get; set; }
    }

    public class UpdatePostDto
    {
        [Required, StringLength(2000, MinimumLength = 1)]
        public string Content { get; set; } = string.Empty;

        public string? ImageUrl { get; set; }
    }

    /// <summary>Trả về sau khi toggle like/unlike.</summary>
    public class LikeResultDto
    {
        public bool IsLiked { get; set; }
        public int LikesCount { get; set; }
    }
}
