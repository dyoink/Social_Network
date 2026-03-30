using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using SocialNetwork.Api.DTOs.User;

namespace SocialNetwork.Api.DTOs.Message
{
    public class MessageDto
    {
        public int Id { get; set; }
        public int ConversationId { get; set; }
        public int SenderId { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateMessageDto
    {
        public int ConversationId { get; set; }
        [Required, StringLength(2000, MinimumLength = 1)]
        public string Content { get; set; } = string.Empty;
    }

    /// <summary>Bắt đầu / lấy conversation với một user khác.</summary>
    public class StartConversationDto
    {
        [Required]
        public int TargetUserId { get; set; }
    }

    public class ConversationDto
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<UserSummaryDto> Participants { get; set; } = new();
        public MessageDto? LastMessage { get; set; }
        public int UnreadCount { get; set; }
    }

    public class UnreadCountDto
    {
        public int Count { get; set; }
    }
}

