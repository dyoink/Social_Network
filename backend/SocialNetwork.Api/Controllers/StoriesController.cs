using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.Story;
using SocialNetwork.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialNetwork.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StoriesController(IStoryService storyService) : ControllerBase
{
    private int CurrentUserId =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;

    /// <summary>Stories của following + bản thân, grouped theo user.</summary>
    [HttpGet]
    public async Task<IActionResult> GetFeed()
    {
        var groups = await storyService.GetFeedStoriesAsync(CurrentUserId);
        return Ok(ApiResponse<List<StoryGroupDto>>.Ok(groups));
    }

    /// <summary>Stories của chính mình (active).</summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyStories()
    {
        var stories = await storyService.GetMyStoriesAsync(CurrentUserId);
        return Ok(ApiResponse<List<StoryDto>>.Ok(stories));
    }

    /// <summary>Tạo story mới (24h).</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStoryDto dto)
    {
        try
        {
            var story = await storyService.CreateAsync(CurrentUserId, dto);
            return Ok(ApiResponse<StoryDto>.Ok(story));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse.Fail(ex.Message));
        }
    }

    /// <summary>Đánh dấu đã xem story.</summary>
    [HttpPost("{id}/view")]
    public async Task<IActionResult> MarkViewed(int id)
    {
        await storyService.MarkViewedAsync(id, CurrentUserId);
        return Ok(ApiResponse.Ok());
    }

    /// <summary>Danh sách viewers (chỉ chủ story).</summary>
    [HttpGet("{id}/viewers")]
    public async Task<IActionResult> GetViewers(int id)
    {
        try
        {
            var viewers = await storyService.GetViewersAsync(id, CurrentUserId);
            return Ok(ApiResponse<List<StoryViewerDto>>.Ok(viewers));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse.Fail(ex.Message));
        }
    }

    /// <summary>Xóa story sớm.</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await storyService.DeleteAsync(id, CurrentUserId);
            return Ok(ApiResponse.Ok("Đã xóa story."));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse.Fail(ex.Message));
        }
    }
}
