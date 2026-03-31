using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.Admin;

namespace SocialNetwork.Api.Services.Interfaces;

public interface IAdminService
{
    Task<AdminStatsDto> GetStatsAsync();
    Task<GrowthChartDto> GetGrowthChartAsync(int days);
    Task<PagedResult<AdminUserDto>> GetUsersAsync(string? q, string? role, string? status, int page, int pageSize);
    Task BanUserAsync(int userId, bool ban);
    Task ChangeRoleAsync(int userId, string role);
    Task ResetPasswordAsync(int userId, string newPassword);
    Task DeleteUserAsync(int userId);
    Task<PagedResult<AdminPostDto>> GetPostsAsync(string? q, int page, int pageSize);
    Task DeletePostAsync(int postId);
    Task<PagedResult<AdminCommentDto>> GetCommentsAsync(string? q, int? postId, int page, int pageSize);
    Task DeleteCommentAsync(int commentId);
    Task<PagedResult<ReportDto>> GetReportsAsync(string? status, int page, int pageSize);
    Task ResolveReportAsync(int reportId);
    Task DeleteReportAsync(int reportId);
    Task<List<LeaderboardEntryDto>> GetLeaderboardAsync(int limit = 10);
}
