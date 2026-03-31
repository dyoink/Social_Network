using System;
using System.Collections.Generic;

namespace SocialNetwork.Api.DTOs.Badge
{
    public class BadgeDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Icon { get; set; } = "🏆";
        public string Color { get; set; } = "#f59e0b";
        public string ConditionType { get; set; } = "Manual";
        public int? ConditionValue { get; set; }
        public bool IsManualOnly { get; set; }

        /// <summary>Số user đã nhận badge này</summary>
        public int UsersCount { get; set; }
    }

    public class UserBadgeDto
    {
        public int BadgeId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Icon { get; set; } = "🏆";
        public string Color { get; set; } = "#f59e0b";
        public DateTime EarnedAt { get; set; }
        public bool IsDisplayed { get; set; }
    }

    public class BadgeProgressDto
    {
        public int BadgeId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Icon { get; set; } = "🏆";
        public string Color { get; set; } = "#f59e0b";
        public string ConditionType { get; set; } = string.Empty;
        public int ConditionValue { get; set; }
        public int CurrentValue { get; set; }
        public bool IsEarned { get; set; }
        public DateTime? EarnedAt { get; set; }
    }

    public class CreateBadgeDto
    {
        [System.ComponentModel.DataAnnotations.Required, System.ComponentModel.DataAnnotations.StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.StringLength(500)]
        public string? Description { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string Icon { get; set; } = "🏆";

        [System.ComponentModel.DataAnnotations.StringLength(10)]
        public string Color { get; set; } = "#f59e0b";

        [System.ComponentModel.DataAnnotations.Required, System.ComponentModel.DataAnnotations.StringLength(30)]
        public string ConditionType { get; set; } = "Manual";

        public int? ConditionValue { get; set; }
        public bool IsManualOnly { get; set; } = false;
    }

    public class UpdateBadgeDto
    {
        [System.ComponentModel.DataAnnotations.StringLength(100)]
        public string? Name { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(500)]
        public string? Description { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string? Icon { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(10)]
        public string? Color { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(30)]
        public string? ConditionType { get; set; }

        public int? ConditionValue { get; set; }
        public bool? IsManualOnly { get; set; }
    }

    public class SetDisplayBadgeDto
    {
        /// <summary>BadgeId muốn hiển thị. null = tắt tất cả badge.</summary>
        public int? BadgeId { get; set; }
    }
}
