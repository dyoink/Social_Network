using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.Notification;

namespace SocialNetwork.Api.Services.Interfaces
{
    public interface INotificationService
    {
        /// <summary>Danh sách thông báo của user (paged), mới nhất trước.</summary>
        Task<PagedResult<NotificationDto>> GetAllAsync(int userId, int page, int pageSize);

        /// <summary>Đánh dấu một thông báo là đã đọc.</summary>
        Task MarkReadAsync(int notificationId, int userId);

        /// <summary>Đánh dấu tất cả thông báo là đã đọc.</summary>
        Task MarkAllReadAsync(int userId);

        /// <summary>Số thông báo chưa đọc (dùng cho badge).</summary>
        Task<int> GetUnreadCountAsync(int userId);

        /// <summary>Tạo thông báo nội bộ (gọi từ PostService, CommentService, UserService).</summary>
        Task CreateAsync(int recipientId, int actorId, string type, int? entityId = null);
    }
}
