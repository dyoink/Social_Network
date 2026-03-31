using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SocialNetwork.Api.Entities
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required, StringLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required, EmailAddress, StringLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [StringLength(100)]
        public string? FullName { get; set; }
        [DataType(DataType.Date)]
        public DateTime? DateOfBirth { get; set; }

        [StringLength(100)]
        public string? Hometown { get; set; }

        /// <summary>Male | Female | Other | null</summary>
        [StringLength(20)]
        public string? Gender { get; set; }

        public string? AvatarUrl { get; set; }
        public string? CoverUrl { get; set; }
        public string? Bio { get; set; }

        [StringLength(50)]
        public string Role { get; set; } = "Member";

        /// <summary>false = bị ban, không thể đăng nhập hoặc thực hiện thao tác</summary>
        public bool IsActive { get; set; } = true;

        /// <summary>true = tạo bởi Admin Seed tool, có thể xoá hàng loạt</summary>
        public bool IsSeeded { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<Post> Posts { get; set; } = new List<Post>();
        public virtual ICollection<PostLike> PostLikes { get; set; } = new List<PostLike>();
        public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
        
        // Follows
        public virtual ICollection<Follow> Followers { get; set; } = new List<Follow>();
        public virtual ICollection<Follow> Following { get; set; } = new List<Follow>();

        // Conversations
        public virtual ICollection<ConversationParticipant> Conversations { get; set; } = new List<ConversationParticipant>();
        public virtual ICollection<Message> MessagesSent { get; set; } = new List<Message>();

        // Notifications
        public virtual ICollection<Notification> NotificationsReceived { get; set; } = new List<Notification>();
        public virtual ICollection<Notification> NotificationsTriggered { get; set; } = new List<Notification>();

        // Badges
        public virtual ICollection<UserBadge> UserBadges { get; set; } = new List<UserBadge>();
    }
}
