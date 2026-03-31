using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.Badge;
using SocialNetwork.Api.Services.Interfaces;

namespace SocialNetwork.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BadgesController(IBadgeService badgeService) : ControllerBase
{
    private int CurrentUserId =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;

    /// <summary>Lấy tất cả badges</summary>
    [HttpGet]
    [ProducesResponseType<ApiResponse<List<BadgeDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var badges = await badgeService.GetAllBadgesAsync();
        return Ok(ApiResponse<List<BadgeDto>>.Ok(badges));
    }

    /// <summary>Lấy badges của user</summary>
    [HttpGet("user/{userId}")]
    [ProducesResponseType<ApiResponse<List<UserBadgeDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserBadges(int userId)
    {
        var badges = await badgeService.GetUserBadgesAsync(userId);
        return Ok(ApiResponse<List<UserBadgeDto>>.Ok(badges));
    }

    /// <summary>Tiến độ badges của current user</summary>
    [HttpGet("progress")]
    [Authorize]
    [ProducesResponseType<ApiResponse<List<BadgeProgressDto>>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProgress()
    {
        var progress = await badgeService.GetBadgeProgressAsync(CurrentUserId);
        return Ok(ApiResponse<List<BadgeProgressDto>>.Ok(progress));
    }

    /// <summary>Chọn badge hiển thị</summary>
    [HttpPut("display")]
    [Authorize]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> SetDisplay([FromBody] SetDisplayBadgeDto dto)
    {
        try
        {
            await badgeService.SetDisplayBadgeAsync(CurrentUserId, dto.BadgeId);
            return Ok(ApiResponse.Ok("Badge hiển thị đã được cập nhật."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse.Fail(ex.Message));
        }
    }
}
