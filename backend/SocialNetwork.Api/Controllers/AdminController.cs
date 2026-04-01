using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.Admin;
using SocialNetwork.Api.DTOs.Badge;
using SocialNetwork.Api.Services.Interfaces;

namespace SocialNetwork.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController(IAdminService adminService, IBadgeService badgeService) : ControllerBase
{
    // ─── Stats ────────────────────────────────────────────────────────────────

    [HttpGet("stats")]
    [ProducesResponseType<ApiResponse<AdminStatsDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStats()
    {
        var stats = await adminService.GetStatsAsync();
        return Ok(ApiResponse<AdminStatsDto>.Ok(stats));
    }

    [HttpGet("growth-chart")]
    [ProducesResponseType<ApiResponse<GrowthChartDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetGrowthChart([FromQuery] int days = 30)
    {
        var chart = await adminService.GetGrowthChartAsync(days);
        return Ok(ApiResponse<GrowthChartDto>.Ok(chart));
    }

    [HttpGet("leaderboard")]
    [ProducesResponseType<ApiResponse<List<LeaderboardEntryDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLeaderboard([FromQuery] int limit = 10)
    {
        var result = await adminService.GetLeaderboardAsync(limit);
        return Ok(ApiResponse<List<LeaderboardEntryDto>>.Ok(result));
    }

    // ─── Users ────────────────────────────────────────────────────────────────

    [HttpGet("users")]
    [ProducesResponseType<ApiResponse<PagedResult<AdminUserDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? q,
        [FromQuery] string? role,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await adminService.GetUsersAsync(q, role, status, page, pageSize);
        return Ok(ApiResponse<PagedResult<AdminUserDto>>.Ok(result));
    }

    [HttpPut("users/{id}/ban")]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> BanUser(int id, [FromQuery] bool ban = true)
    {
        await adminService.BanUserAsync(id, ban);
        return Ok(ApiResponse.Ok(ban ? "User đã bị ban." : "User đã được mở ban."));
    }

    [HttpPut("users/{id}/role")]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangeRole(int id, [FromBody] ChangeRoleDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse.Fail("Dữ liệu không hợp lệ."));
        try
        {
            await adminService.ChangeRoleAsync(id, dto.Role);
            return Ok(ApiResponse.Ok("Role đã được cập nhật."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse.Fail(ex.Message));
        }
    }

    [HttpPut("users/{id}/reset-password")]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] AdminResetPasswordDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse.Fail("Dữ liệu không hợp lệ."));
        try
        {
            await adminService.ResetPasswordAsync(id, dto.NewPassword);
            return Ok(ApiResponse.Ok("Mật khẩu đã được đặt lại."));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse.Fail("Không tìm thấy user."));
        }
    }

    [HttpDelete("users/{id}")]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(int id)
    {
        try
        {
            await adminService.DeleteUserAsync(id);
            return Ok(ApiResponse.Ok("User đã bị xóa vĩnh viễn."));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse.Fail("Không tìm thấy user."));
        }
    }

    [HttpPut("users/bulk-ban")]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> BulkBanUsers([FromBody] List<int> ids, [FromQuery] bool ban = true)
    {
        await adminService.BulkBanUsersAsync(ids, ban);
        return Ok(ApiResponse.Ok(ban ? "Các user đã bị ban." : "Các user đã được mở ban."));
    }

    [HttpDelete("users/bulk-delete")]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> BulkDeleteUsers([FromBody] List<int> ids)
    {
        await adminService.BulkDeleteUsersAsync(ids);
        return Ok(ApiResponse.Ok("Các user đã bị xóa vĩnh viễn."));
    }

    // ─── Posts ────────────────────────────────────────────────────────────────

    [HttpGet("posts")]
    [ProducesResponseType<ApiResponse<PagedResult<AdminPostDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPosts(
        [FromQuery] string? q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await adminService.GetPostsAsync(q, page, pageSize);
        return Ok(ApiResponse<PagedResult<AdminPostDto>>.Ok(result));
    }

    [HttpDelete("posts/{id}")]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePost(int id)
    {
        try
        {
            await adminService.DeletePostAsync(id);
            return Ok(ApiResponse.Ok("Bài viết đã bị xóa."));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse.Fail("Không tìm thấy bài viết."));
        }
    }

    [HttpDelete("posts/bulk-delete")]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> BulkDeletePosts([FromBody] List<int> ids)
    {
        await adminService.BulkDeletePostsAsync(ids);
        return Ok(ApiResponse.Ok("Các bài viết đã bị xóa."));
    }

    // ─── Comments ──────────────────────────────────────────────────────────────

    [HttpGet("comments")]
    [ProducesResponseType<ApiResponse<PagedResult<AdminCommentDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetComments(
        [FromQuery] string? q,
        [FromQuery] int? postId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await adminService.GetCommentsAsync(q, postId, page, pageSize);
        return Ok(ApiResponse<PagedResult<AdminCommentDto>>.Ok(result));
    }

    [HttpDelete("comments/{id}")]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteComment(int id)
    {
        try
        {
            await adminService.DeleteCommentAsync(id);
            return Ok(ApiResponse.Ok("Bình luận đã bị xóa."));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse.Fail("Không tìm thấy bình luận."));
        }
    }

    [HttpDelete("comments/bulk-delete")]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> BulkDeleteComments([FromBody] List<int> ids)
    {
        await adminService.BulkDeleteCommentsAsync(ids);
        return Ok(ApiResponse.Ok("Các bình luận đã bị xóa."));
    }

    // ─── Reports ──────────────────────────────────────────────────────────────

    [HttpGet("reports")]
    [ProducesResponseType<ApiResponse<PagedResult<ReportDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReports(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await adminService.GetReportsAsync(status, page, pageSize);
        return Ok(ApiResponse<PagedResult<ReportDto>>.Ok(result));
    }

    [HttpPut("reports/{id}/resolve")]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> ResolveReport(int id)
    {
        await adminService.ResolveReportAsync(id);
        return Ok(ApiResponse.Ok("Báo cáo đã được xử lý."));
    }

    [HttpPut("reports/bulk-resolve")]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> BulkResolveReports([FromBody] List<int> ids)
    {
        await adminService.BulkResolveReportsAsync(ids);
        return Ok(ApiResponse.Ok("Các báo cáo đã được xử lý."));
    }

    [HttpDelete("reports/{id}")]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteReport(int id)
    {
        try
        {
            await adminService.DeleteReportAsync(id);
            return Ok(ApiResponse.Ok("Báo cáo đã bị xóa."));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse.Fail("Không tìm thấy báo cáo."));
        }
    }

    [HttpDelete("reports/bulk-delete")]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> BulkDeleteReports([FromBody] List<int> ids)
    {
        await adminService.BulkDeleteReportsAsync(ids);
        return Ok(ApiResponse.Ok("Các báo cáo đã bị xóa."));
    }

    // ─── Badges ────────────────────────────────────────────────────────────────

    [HttpGet("badges")]
    [ProducesResponseType<ApiResponse<List<BadgeDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBadges()
    {
        var badges = await badgeService.GetAllBadgesAsync();
        return Ok(ApiResponse<List<BadgeDto>>.Ok(badges));
    }

    [HttpPost("badges")]
    [ProducesResponseType<ApiResponse<BadgeDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateBadge([FromBody] CreateBadgeDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse.Fail("Dữ liệu không hợp lệ."));
        try
        {
            var badge = await badgeService.CreateBadgeAsync(dto);
            return Ok(ApiResponse<BadgeDto>.Ok(badge));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse.Fail(ex.Message));
        }
    }

    [HttpPut("badges/{id}")]
    [ProducesResponseType<ApiResponse<BadgeDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateBadge(int id, [FromBody] UpdateBadgeDto dto)
    {
        try
        {
            var badge = await badgeService.UpdateBadgeAsync(id, dto);
            return Ok(ApiResponse<BadgeDto>.Ok(badge));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse.Fail("Không tìm thấy badge."));
        }
    }

    [HttpDelete("badges/{id}")]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteBadge(int id)
    {
        try
        {
            await badgeService.DeleteBadgeAsync(id);
            return Ok(ApiResponse.Ok("Badge đã bị xóa."));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse.Fail("Không tìm thấy badge."));
        }
    }

    [HttpPost("users/{userId}/badges/{badgeId}")]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> AwardBadge(int userId, int badgeId)
    {
        try
        {
            await badgeService.AwardBadgeAsync(userId, badgeId);
            return Ok(ApiResponse.Ok("Đã cấp badge thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse.Fail(ex.Message));
        }
    }

    [HttpDelete("users/{userId}/badges/{badgeId}")]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> RevokeBadge(int userId, int badgeId)
    {
        try
        {
            await badgeService.RevokeBadgeAsync(userId, badgeId);
            return Ok(ApiResponse.Ok("Đã thu hồi badge."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse.Fail(ex.Message));
        }
    }
}
