using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.User;
using SocialNetwork.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialNetwork.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        /// <summary>Id của user đang đăng nhập, null nếu chưa đăng nhập.</summary>
        private int? CurrentUserId =>
            User.Identity?.IsAuthenticated == true
                ? int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!)
                : null;

        // ─── GET /api/users/{username} ─────────────────────────────────────────

        /// <summary>Lấy profile công khai theo username.</summary>
        [HttpGet("{username}")]
        [ProducesResponseType<ApiResponse<UserDto>>(200)]
        public async Task<IActionResult> GetProfile(string username)
        {
            var dto = await _userService.GetProfileAsync(username, CurrentUserId);
            return Ok(ApiResponse<UserDto>.Ok(dto));
        }

        // ─── PUT /api/users/me ─────────────────────────────────────────────────

        /// <summary>Cập nhật profile của user đang đăng nhập.</summary>
        [HttpPut("me")]
        [Authorize]
        [ProducesResponseType<ApiResponse<UserDto>>(200)]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserDto dto)
        {
            var updated = await _userService.UpdateProfileAsync(CurrentUserId!.Value, dto);
            return Ok(ApiResponse<UserDto>.Ok(updated));
        }

        // ─── POST /api/users/{id}/follow ───────────────────────────────────────

        /// <summary>Toggle follow/unfollow một user. Trả về trạng thái sau khi toggle.</summary>
        [HttpPost("{id:int}/follow")]
        [Authorize]
        [ProducesResponseType<ApiResponse<FollowResultDto>>(200)]
        public async Task<IActionResult> ToggleFollow(int id)
        {
            var result = await _userService.ToggleFollowAsync(CurrentUserId!.Value, id);
            return Ok(ApiResponse<FollowResultDto>.Ok(result));
        }

        // ─── GET /api/users/{id}/followers ─────────────────────────────────────

        /// <summary>Danh sách followers của user (paged).</summary>
        [HttpGet("{id:int}/followers")]
        [ProducesResponseType<ApiResponse<PagedResult<UserSummaryDto>>>(200)]
        public async Task<IActionResult> GetFollowers(
            int id,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await _userService.GetFollowersAsync(id, page, pageSize);
            return Ok(ApiResponse<PagedResult<UserSummaryDto>>.Ok(result));
        }

        // ─── GET /api/users/{id}/following ─────────────────────────────────────

        /// <summary>Danh sách following của user (paged).</summary>
        [HttpGet("{id:int}/following")]
        [ProducesResponseType<ApiResponse<PagedResult<UserSummaryDto>>>(200)]
        public async Task<IActionResult> GetFollowing(
            int id,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await _userService.GetFollowingAsync(id, page, pageSize);
            return Ok(ApiResponse<PagedResult<UserSummaryDto>>.Ok(result));
        }

        // ─── GET /api/users/search?q= ──────────────────────────────────────────

        /// <summary>Tìm kiếm user theo username hoặc họ tên.</summary>
        [HttpGet("search")]
        [ProducesResponseType<ApiResponse<List<UserSummaryDto>>>(200)]
        public async Task<IActionResult> Search([FromQuery] string q = "")
        {
            var results = await _userService.SearchUsersAsync(q, CurrentUserId);
            return Ok(ApiResponse<List<UserSummaryDto>>.Ok(results));
        }

        // ─── GET /api/users/suggestions ────────────────────────────────────────

        /// <summary>Gợi ý follow: những người chưa follow, phổ biến nhất.</summary>
        [HttpGet("suggestions")]
        [Authorize]
        [ProducesResponseType<ApiResponse<List<UserSummaryDto>>>(200)]
        public async Task<IActionResult> GetSuggestions()
        {
            var results = await _userService.GetSuggestionsAsync(CurrentUserId!.Value);
            return Ok(ApiResponse<List<UserSummaryDto>>.Ok(results));
        }

        // ─── PUT /api/users/me/password ────────────────────────────────────────

        /// <summary>Đổi mật khẩu của user đang đăng nhập.</summary>
        [HttpPut("me/password")]
        [Authorize]
        [ProducesResponseType(200)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            await _userService.ChangePasswordAsync(CurrentUserId!.Value, dto);
            return Ok(ApiResponse.Ok("Đổi mật khẩu thành công."));
        }
    }
}
