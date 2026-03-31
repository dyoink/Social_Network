using System;
using System.ComponentModel.DataAnnotations;

namespace SocialNetwork.Api.Entities
{
    public class PostLike
    {
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        public int PostId { get; set; }
        public virtual Post Post { get; set; } = null!;

        /// <summary>Loại reaction: Like, Love, Wow, Angry, Sad. Default = Like.</summary>
        [StringLength(10)]
        public string ReactionType { get; set; } = "Like";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
