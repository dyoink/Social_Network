using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.User;

namespace SocialNetwork.Api.Services.Interfaces
{
    public interface IUserService
    {
        /// <summary>
        /// Lấy profile theo username. currentUserId dùng để xác định isFollowing.
        /// Throw KeyNotFoundException nếu không tìm thấy.
        /// </summary>
        Task<UserDto> GetProfileAsync(string username, int? currentUserId);

        /// <summary>
        /// Cập nhật thông tin profile của user đang đăng nhập.
        /// Throw KeyNotFoundException nếu userId không hợp lệ.
        /// </summary>
        Task<UserDto> UpdateProfileAsync(int userId, UpdateUserDto dto);

        /// <summary>
        /// Toggle follow/unfollow. Throw InvalidOperationException nếu tự follow bản thân.
        /// </summary>
        Task<FollowResultDto> ToggleFollowAsync(int currentUserId, int targetUserId);

        /// <summary>Danh sách followers của user (paged).</summary>
        Task<PagedResult<UserSummaryDto>> GetFollowersAsync(int userId, int page, int pageSize);

        /// <summary>Danh sách following của user (paged).</summary>
        Task<PagedResult<UserSummaryDto>> GetFollowingAsync(int userId, int page, int pageSize);

        /// <summary>
        /// Tìm kiếm user theo tên hoặc username.
        /// currentUserId để loại bản thân ra khỏi kết quả.
        /// </summary>
        Task<List<UserSummaryDto>> SearchUsersAsync(string query, int? currentUserId);

        /// <summary>
        /// Gợi ý follow: những người chưa được follow, nhiều follower nhất.
        /// Loại bản thân ra khỏi kết quả. Tối đa 10 gợi ý.
        /// </summary>
        Task<List<UserSummaryDto>> GetSuggestionsAsync(int currentUserId);

        /// <summary>
        /// Đổi mật khẩu. Verify mật khẩu hiện tại trước khi cập nhật.
        /// Throw UnauthorizedAccessException nếu mật khẩu cũ sai.
        /// </summary>
        Task ChangePasswordAsync(int userId, ChangePasswordDto dto);
    }
}
