using System;
using System.ComponentModel.DataAnnotations;

namespace SocialNetwork.Api.Entities
{
    public class Message
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ConversationId { get; set; }
        public virtual Conversation Conversation { get; set; } = null!;

        [Required]
        public int SenderId { get; set; }
        public virtual User Sender { get; set; } = null!;

        [Required]
        public string Content { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
