using System.ComponentModel.DataAnnotations;

namespace SocialNetwork.Api.Entities
{
    public class Report
    {
        [Key]
        public int Id { get; set; }

        /// <summary>Người gửi báo cáo</summary>
        public int ReporterId { get; set; }
        public virtual User Reporter { get; set; } = null!;

        /// <summary>User bị báo cáo (null nếu báo cáo bài viết)</summary>
        public int? TargetUserId { get; set; }
        public virtual User? TargetUser { get; set; }

        /// <summary>Bài viết bị báo cáo (null nếu báo cáo user)</summary>
        public int? TargetPostId { get; set; }
        public virtual Post? TargetPost { get; set; }

        /// <summary>spam | hate | nude | violence | other</summary>
        [Required, StringLength(50)]
        public string Reason { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Detail { get; set; }

        /// <summary>Pending | Resolved</summary>
        [StringLength(20)]
        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ResolvedAt { get; set; }
    }
}
