using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.Admin;

namespace SocialNetwork.Api.Services.Interfaces;

public interface IAdminService
{
    Task<AdminStatsDto> GetStatsAsync();
    Task<PagedResult<AdminUserDto>> GetUsersAsync(string? q, string? role, int page, int pageSize);
    Task BanUserAsync(int userId, bool ban);
    Task ChangeRoleAsync(int userId, string role);
    Task DeleteUserAsync(int userId);
    Task<PagedResult<AdminPostDto>> GetPostsAsync(string? q, int page, int pageSize);
    Task DeletePostAsync(int postId);
    Task<PagedResult<ReportDto>> GetReportsAsync(string? status, int page, int pageSize);
    Task ResolveReportAsync(int reportId);
}
