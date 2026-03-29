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

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
