using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.Message;

namespace SocialNetwork.Api.Services.Interfaces
{
    public interface IMessageService
    {
        /// <summary>Lấy danh sách conversation của user (paged), mới nhất trước.</summary>
        Task<PagedResult<ConversationDto>> GetConversationsAsync(int userId, int page, int pageSize);

        /// <summary>Lấy hoặc tạo conversation 1-1 với targetUserId. Trả về conversationId.</summary>
        Task<ConversationDto> GetOrCreateConversationAsync(int userId, int targetUserId);

        /// <summary>Lịch sử tin nhắn của một conversation (paged), mới nhất trước.</summary>
        Task<PagedResult<MessageDto>> GetMessagesAsync(int conversationId, int userId, int page, int pageSize);

        /// <summary>Gửi tin nhắn mới.</summary>
        Task<MessageDto> SendMessageAsync(int senderId, CreateMessageDto dto);

        /// <summary>Đánh dấu tất cả tin nhắn chưa đọc trong conversation là đã đọc.</summary>
        Task MarkReadAsync(int conversationId, int userId);

        /// <summary>Tổng số tin nhắn chưa đọc trên tất cả conversation.</summary>
        Task<int> GetUnreadCountAsync(int userId);

        /// <summary>Xóa conversation cho user hiện tại (soft delete hoặc xóa hẳn tùy logic).</summary>
        Task DeleteConversationAsync(int conversationId, int userId);
    }
}
