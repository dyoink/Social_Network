using SocialNetwork.Api.DTOs.Badge;

namespace SocialNetwork.Api.Services.Interfaces
{
    public interface IBadgeService
    {
        /// <summary>Kiểm tra và tự động cấp badges cho user dựa trên số liệu hiện tại</summary>
        Task CheckAndAwardBadgesAsync(int userId);

        /// <summary>Admin cấp badge thủ công</summary>
        Task AwardBadgeAsync(int userId, int badgeId);

        /// <summary>Admin thu hồi badge</summary>
        Task RevokeBadgeAsync(int userId, int badgeId);

        /// <summary>Lấy danh sách badges đã nhận của user</summary>
        Task<List<UserBadgeDto>> GetUserBadgesAsync(int userId);

        /// <summary>Lấy badge đang hiển thị của user (chỉ 1)</summary>
        Task<UserBadgeDto?> GetDisplayedBadgeAsync(int userId);

        /// <summary>Lấy displayed badge cho nhiều users cùng lúc (tránh N+1)</summary>
        Task<Dictionary<int, UserBadgeDto>> GetDisplayedBadgesForUsersAsync(IEnumerable<int> userIds);

        /// <summary>Chọn badge hiển thị (set 1, tắt còn lại)</summary>
        Task SetDisplayBadgeAsync(int userId, int? badgeId);

        /// <summary>Tiến độ tất cả badges của current user</summary>
        Task<List<BadgeProgressDto>> GetBadgeProgressAsync(int userId);

        /// <summary>Lấy tất cả badges (admin)</summary>
        Task<List<BadgeDto>> GetAllBadgesAsync();

        /// <summary>Tạo badge mới (admin)</summary>
        Task<BadgeDto> CreateBadgeAsync(CreateBadgeDto dto);

        /// <summary>Sửa badge (admin)</summary>
        Task<BadgeDto> UpdateBadgeAsync(int badgeId, UpdateBadgeDto dto);

        /// <summary>Xóa badge (admin)</summary>
        Task DeleteBadgeAsync(int badgeId);
    }
}
