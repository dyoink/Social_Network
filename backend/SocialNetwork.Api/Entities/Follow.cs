using System;
using System.ComponentModel.DataAnnotations;

namespace SocialNetwork.Api.Entities
{
    public class Follow
    {
        public int FollowerId { get; set; }
        public virtual User Follower { get; set; } = null!;

        public int FollowingId { get; set; }
        public virtual User Following { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
