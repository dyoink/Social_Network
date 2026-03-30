using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.Admin;
using SocialNetwork.Api.Services.Interfaces;

namespace SocialNetwork.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController(IAdminService adminService) : ControllerBase
{
    // ─── Stats ────────────────────────────────────────────────────────────────

    [HttpGet("stats")]
    [ProducesResponseType<ApiResponse<AdminStatsDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStats()
    {
        var stats = await adminService.GetStatsAsync();
        return Ok(ApiResponse<AdminStatsDto>.Ok(stats));
    }

    // ─── Users ────────────────────────────────────────────────────────────────

    [HttpGet("users")]
    [ProducesResponseType<ApiResponse<PagedResult<AdminUserDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? q,
        [FromQuery] string? role,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await adminService.GetUsersAsync(q, role, page, pageSize);
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
}
