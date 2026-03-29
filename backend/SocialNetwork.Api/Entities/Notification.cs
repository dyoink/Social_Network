using System;
using System.ComponentModel.DataAnnotations;

namespace SocialNetwork.Api.Entities
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; } // Recipient
        public virtual User User { get; set; } = null!;

        [Required]
        public int ActorId { get; set; } // Person who triggered the notification
        public virtual User Actor { get; set; } = null!;

        [Required, StringLength(20)]
        public string NotificationType { get; set; } = string.Empty; // 'like', 'comment', 'follow', 'message'

        public int? EntityId { get; set; } // ID of the related post/comment/etc

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
