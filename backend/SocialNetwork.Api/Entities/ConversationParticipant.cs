using System;
using System.ComponentModel.DataAnnotations;

namespace SocialNetwork.Api.Entities
{
    public class ConversationParticipant
    {
        public int ConversationId { get; set; }
        public virtual Conversation Conversation { get; set; } = null!;

        public int UserId { get; set; }
        public virtual User User { get; set; } = null!;
    }
}
