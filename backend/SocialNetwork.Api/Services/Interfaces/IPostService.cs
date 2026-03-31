using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.Post;

namespace SocialNetwork.Api.Services.Interfaces
{
    public interface IPostService
    {
        /// <summary>
        /// Feed của currentUser: bài viết của những người đang follow + bài của chính mình.
        /// Sắp xếp mới nhất trước.
        /// </summary>
        Task<PagedResult<PostDto>> GetFeedAsync(int currentUserId, int page, int pageSize);

        /// <summary>Tất cả bài viết của một user, mới nhất trước (dùng trên trang Profile).</summary>
        Task<PagedResult<PostDto>> GetUserPostsAsync(int userId, int? currentUserId, int page, int pageSize);

        /// <summary>Lấy chi tiết một bài viết. Throw KeyNotFoundException nếu không tồn tại.</summary>
        Task<PostDto> GetByIdAsync(int postId, int? currentUserId);

        /// <summary>Tạo bài viết mới. Trả về bài vừa tạo.</summary>
        Task<PostDto> CreateAsync(int userId, CreatePostDto dto);

        /// <summary>
        /// Cập nhật bài viết. 
        /// Throw KeyNotFoundException nếu không tồn tại.
        /// Throw UnauthorizedAccessException nếu không phải chủ bài.
        /// </summary>
        Task<PostDto> UpdateAsync(int postId, int currentUserId, UpdatePostDto dto);

        /// <summary>
        /// Xóa bài viết.
        /// Throw KeyNotFoundException nếu không tồn tại.
        /// Throw UnauthorizedAccessException nếu không phải chủ bài.
        /// </summary>
        Task DeleteAsync(int postId, int currentUserId);

        /// <summary>
        /// Toggle reaction. Nếu cùng loại → unlike, khác loại → đổi reaction.
        /// Tự động tạo/xóa Notification 'like'.
        /// </summary>
        Task<LikeResultDto> ToggleLikeAsync(int postId, int currentUserId, string reactionType = "Like");

        /// <summary>
        /// Tìm kiếm bài viết theo nội dung (full-text, case-insensitive).
        /// </summary>
        Task<PagedResult<PostDto>> SearchPostsAsync(string query, int? currentUserId, int page, int pageSize);

        /// <summary>Lấy posts theo hashtag.</summary>
        Task<PagedResult<PostDto>> GetByHashtagAsync(string tag, int? currentUserId, int page, int pageSize);

        /// <summary>Top trending hashtags trong 24h.</summary>
        Task<List<TrendingHashtagDto>> GetTrendingHashtagsAsync(int limit = 10);

        /// <summary>Lấy batch Reels ngẫu nhiên (posts có video).</summary>
        Task<List<PostDto>> GetReelsAsync(int? currentUserId, int count = 10);
    }
}
