using System;
using SocialNetwork.Api.DTOs.User;

namespace SocialNetwork.Api.DTOs.Comment
{
    public class CommentDto
    {
        public int Id { get; set; }
        public int PostId { get; set; }
        public UserSummaryDto User { get; set; } = null!;
        public string Content { get; set; } = string.Empty;
        public int? ParentId { get; set; }
        public DateTime CreatedAt { get; set; }
        public int RepliesCount { get; set; }
    }

    public class CreateCommentDto
    {
        public int PostId { get; set; }
        public string Content { get; set; } = string.Empty;
        public int? ParentId { get; set; }
    }
}
