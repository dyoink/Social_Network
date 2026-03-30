using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.Comment;

namespace SocialNetwork.Api.Services.Interfaces
{
    public interface ICommentService
    {
        /// <summary>
        /// Lấy danh sách comment gốc (ParentId == null) của một bài viết, kèm số replies.
        /// </summary>
        Task<PagedResult<CommentDto>> GetByPostAsync(int postId, int page, int pageSize);

        /// <summary>
        /// Lấy replies của một comment (ParentId == commentId).
        /// </summary>
        Task<List<CommentDto>> GetRepliesAsync(int commentId);

        /// <summary>
        /// Tạo comment hoặc reply.
        /// Throw KeyNotFoundException nếu post không tồn tại.
        /// Tự động tạo Notification 'comment' hoặc 'reply'.
        /// </summary>
        Task<CommentDto> CreateAsync(int userId, CreateCommentDto dto);

        /// <summary>
        /// Xóa comment.
        /// Throw KeyNotFoundException nếu không tồn tại.
        /// Throw UnauthorizedAccessException nếu không phải chủ comment.
        /// </summary>
        Task DeleteAsync(int commentId, int currentUserId);
    }
}
