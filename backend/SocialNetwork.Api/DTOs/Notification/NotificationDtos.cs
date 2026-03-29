using System;
using SocialNetwork.Api.DTOs.User;

namespace SocialNetwork.Api.DTOs.Notification
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public UserSummaryDto Actor { get; set; } = null!;
        public string NotificationType { get; set; } = string.Empty;
        public int? EntityId { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
