using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.Post;
using SocialNetwork.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialNetwork.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostsController : ControllerBase
    {
        private readonly IPostService _postService;

        public PostsController(IPostService postService)
        {
            _postService = postService;
        }

        /// <summary>Id của user đang đăng nhập (null nếu anonymous).</summary>
        private int? CurrentUserId =>
            User.Identity?.IsAuthenticated == true
                && int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
                ? id : null;

        // ─── GET /api/posts/feed ───────────────────────────────────────────────

        /// <summary>Feed cá nhân: bài của following + bản thân, mới nhất trước.</summary>
        [HttpGet("feed")]
        [Authorize]
        [ProducesResponseType<ApiResponse<PagedResult<PostDto>>>(200)]
        public async Task<IActionResult> GetFeed(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var result = await _postService.GetFeedAsync(CurrentUserId.GetValueOrDefault(), page, pageSize);
            return Ok(ApiResponse<PagedResult<PostDto>>.Ok(result));
        }

        // ─── GET /api/posts/user/{userId} ──────────────────────────────────────

        /// <summary>Tất cả bài viết của một user (dùng trên trang Profile).</summary>
        [HttpGet("user/{userId:int}")]
        [ProducesResponseType<ApiResponse<PagedResult<PostDto>>>(200)]
        public async Task<IActionResult> GetUserPosts(
            int userId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var result = await _postService.GetUserPostsAsync(userId, CurrentUserId, page, pageSize);
            return Ok(ApiResponse<PagedResult<PostDto>>.Ok(result));
        }

        // ─── GET /api/posts/{id} ───────────────────────────────────────────────

        /// <summary>Chi tiết một bài viết.</summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType<ApiResponse<PostDto>>(200)]
        public async Task<IActionResult> GetById(int id)
        {
            var dto = await _postService.GetByIdAsync(id, CurrentUserId);
            return Ok(ApiResponse<PostDto>.Ok(dto));
        }

        // ─── POST /api/posts ───────────────────────────────────────────────────

        /// <summary>Tạo bài viết mới.</summary>
        [HttpPost]
        [Authorize]
        [ProducesResponseType<ApiResponse<PostDto>>(201)]
        public async Task<IActionResult> Create([FromBody] CreatePostDto dto)
        {
            var created = await _postService.CreateAsync(CurrentUserId.GetValueOrDefault(), dto);
            // 201 Created với Location header trỏ đến bài vừa tạo
            return CreatedAtAction(
                nameof(GetById),
                new { id = created.Id },
                ApiResponse<PostDto>.Ok(created, "Bài viết đã được tạo."));
        }

        // ─── PUT /api/posts/{id} ───────────────────────────────────────────────

        /// <summary>Cập nhật bài viết (chỉ chủ bài).</summary>
        [HttpPut("{id:int}")]
        [Authorize]
        [ProducesResponseType<ApiResponse<PostDto>>(200)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePostDto dto)
        {
            var updated = await _postService.UpdateAsync(id, CurrentUserId.GetValueOrDefault(), dto);
            return Ok(ApiResponse<PostDto>.Ok(updated));
        }

        // ─── DELETE /api/posts/{id} ────────────────────────────────────────────

        /// <summary>Xóa bài viết (chỉ chủ bài).</summary>
        [HttpDelete("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            await _postService.DeleteAsync(id, CurrentUserId.GetValueOrDefault());
            return Ok(ApiResponse.Ok("Bài viết đã được xóa."));
        }

        // ─── POST /api/posts/{id}/like ─────────────────────────────────────────

        /// <summary>Toggle reaction. Body: { "reactionType": "Like|Love|Wow|Angry|Sad" }</summary>
        [HttpPost("{id:int}/like")]
        [Authorize]
        [ProducesResponseType<ApiResponse<LikeResultDto>>(200)]
        public async Task<IActionResult> ToggleLike(int id, [FromBody] ReactDto? dto)
        {
            var reactionType = dto?.ReactionType ?? "Like";
            var result = await _postService.ToggleLikeAsync(id, CurrentUserId.GetValueOrDefault(), reactionType);
            return Ok(ApiResponse<LikeResultDto>.Ok(result));
        }

        // ─── GET /api/posts/hashtag/{tag} ──────────────────────────────────────

        /// <summary>Lấy bài viết theo hashtag.</summary>
        [HttpGet("hashtag/{tag}")]
        [ProducesResponseType<ApiResponse<PagedResult<PostDto>>>(200)]
        public async Task<IActionResult> GetByHashtag(
            string tag,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var result = await _postService.GetByHashtagAsync(tag, CurrentUserId, page, pageSize);
            return Ok(ApiResponse<PagedResult<PostDto>>.Ok(result));
        }

        // ─── GET /api/posts/trending-hashtags ──────────────────────────────────

        /// <summary>Top trending hashtags 24h.</summary>
        [HttpGet("trending-hashtags")]
        [ProducesResponseType<ApiResponse<List<TrendingHashtagDto>>>(200)]
        public async Task<IActionResult> GetTrendingHashtags([FromQuery] int limit = 10)
        {
            var result = await _postService.GetTrendingHashtagsAsync(limit);
            return Ok(ApiResponse<List<TrendingHashtagDto>>.Ok(result));
        }

        // ─── GET /api/posts/reels ──────────────────────────────────────────────

        /// <summary>Batch Reels ngẫu nhiên (posts có video).</summary>
        [HttpGet("reels")]
        [ProducesResponseType<ApiResponse<List<PostDto>>>(200)]
        public async Task<IActionResult> GetReels([FromQuery] int count = 10)
        {
            var result = await _postService.GetReelsAsync(CurrentUserId, count);
            return Ok(ApiResponse<List<PostDto>>.Ok(result));
        }

        // ─── GET /api/posts/search?q= ──────────────────────────────────────────

        /// <summary>Tìm kiếm bài viết theo nội dung (case-insensitive).</summary>
        [HttpGet("search")]
        [ProducesResponseType<ApiResponse<PagedResult<PostDto>>>(200)]
        public async Task<IActionResult> Search(
            [FromQuery] string q = "",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var result = await _postService.SearchPostsAsync(q, CurrentUserId, page, pageSize);
            return Ok(ApiResponse<PagedResult<PostDto>>.Ok(result));
        }
    }
}
