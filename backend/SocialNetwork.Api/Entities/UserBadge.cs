using System;
using System.ComponentModel.DataAnnotations;

namespace SocialNetwork.Api.Entities
{
    public class UserBadge
    {
        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;

        public int BadgeId { get; set; }
        public virtual Badge Badge { get; set; } = null!;

        public DateTime EarnedAt { get; set; } = DateTime.UtcNow;

        /// <summary>true = badge đang được hiển thị trên profile</summary>
        public bool IsDisplayed { get; set; } = false;
    }
}
