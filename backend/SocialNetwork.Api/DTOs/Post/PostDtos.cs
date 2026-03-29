using System;
using System.Collections.Generic;
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
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
    }

    public class UpdatePostDto
    {
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
    }
}
