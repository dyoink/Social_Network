using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.Admin;

namespace SocialNetwork.Api.Services.Interfaces;

public interface IAdminService
{
    Task<AdminStatsDto> GetStatsAsync();
    Task<GrowthChartDto> GetGrowthChartAsync(int days);
    Task<PagedResult<AdminUserDto>> GetUsersAsync(string? q, string? role, string? status, string? sortBy, string? isDescending, int page, int pageSize);
    Task BanUserAsync(int userId, bool ban);
    Task ChangeRoleAsync(int userId, string role);
    Task ResetPasswordAsync(int userId, string newPassword);
    Task DeleteUserAsync(int userId);
    Task BulkBanUsersAsync(List<int> userIds, bool ban);
    Task BulkDeleteUsersAsync(List<int> userIds);
    Task<PagedResult<AdminPostDto>> GetPostsAsync(string? q, string? sortBy, string? isDescending, int page, int pageSize);
    Task DeletePostAsync(int postId);
    Task BulkDeletePostsAsync(List<int> postIds);
    Task<PagedResult<AdminCommentDto>> GetCommentsAsync(string? q, int? postId, int page, int pageSize);
    Task DeleteCommentAsync(int commentId);
    Task BulkDeleteCommentsAsync(List<int> commentIds);
    Task<PagedResult<ReportDto>> GetReportsAsync(string? status, int page, int pageSize);
    Task ResolveReportAsync(int reportId);
    Task BulkResolveReportsAsync(List<int> reportIds);
    Task DeleteReportAsync(int reportId);
    Task BulkDeleteReportsAsync(List<int> reportIds);
    Task<List<LeaderboardEntryDto>> GetLeaderboardAsync(int limit = 10);
}
