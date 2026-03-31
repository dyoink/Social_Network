using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SocialNetwork.Api.Entities
{
    public class Badge
    {
        [Key]
        public int Id { get; set; }

        [Required, StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        /// <summary>Emoji hoặc URL ảnh icon</summary>
        [StringLength(200)]
        public string Icon { get; set; } = "🏆";

        /// <summary>Màu hex (#f59e0b)</summary>
        [StringLength(10)]
        public string Color { get; set; } = "#f59e0b";

        /// <summary>PostCount | LikesReceived | CommentsCount | FollowersCount | DaysActive | PokesSent | Manual</summary>
        [Required, StringLength(30)]
        public string ConditionType { get; set; } = "Manual";

        /// <summary>Giá trị điều kiện (VD: 10 = cần 10 bài viết). Null nếu Manual.</summary>
        public int? ConditionValue { get; set; }

        /// <summary>true = chỉ admin mới cấp được</summary>
        public bool IsManualOnly { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual ICollection<UserBadge> UserBadges { get; set; } = new List<UserBadge>();
    }
}
