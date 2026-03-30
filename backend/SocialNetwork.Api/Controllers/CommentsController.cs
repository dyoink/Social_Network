using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.Comment;
using SocialNetwork.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialNetwork.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommentsController : ControllerBase
    {
        private readonly ICommentService _commentService;

        public CommentsController(ICommentService commentService)
        {
            _commentService = commentService;
        }

        private int? CurrentUserId =>
            User.Identity?.IsAuthenticated == true
                ? int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!)
                : null;

        // ─── GET /api/comments/post/{postId} ───────────────────────────────────

        /// <summary>Danh sách comment gốc của một bài viết (paged).</summary>
        [HttpGet("post/{postId:int}")]
        [ProducesResponseType<ApiResponse<PagedResult<CommentDto>>>(200)]
        public async Task<IActionResult> GetByPost(
            int postId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await _commentService.GetByPostAsync(postId, page, pageSize);
            return Ok(ApiResponse<PagedResult<CommentDto>>.Ok(result));
        }

        // ─── GET /api/comments/{commentId}/replies ─────────────────────────────

        /// <summary>Danh sách replies của một comment.</summary>
        [HttpGet("{commentId:int}/replies")]
        [ProducesResponseType<ApiResponse<List<CommentDto>>>(200)]
        public async Task<IActionResult> GetReplies(int commentId)
        {
            var replies = await _commentService.GetRepliesAsync(commentId);
            return Ok(ApiResponse<List<CommentDto>>.Ok(replies));
        }

        // ─── POST /api/comments ────────────────────────────────────────────────

        /// <summary>
        /// Tạo comment hoặc reply.
        /// Body: { postId, content, parentId? }
        /// </summary>
        [HttpPost]
        [Authorize]
        [ProducesResponseType<ApiResponse<CommentDto>>(201)]
        public async Task<IActionResult> Create([FromBody] CreateCommentDto dto)
        {
            var created = await _commentService.CreateAsync(CurrentUserId!.Value, dto);
            return CreatedAtAction(
                nameof(GetByPost),
                new { postId = created.PostId },
                ApiResponse<CommentDto>.Ok(created, "Đã thêm bình luận."));
        }

        // ─── DELETE /api/comments/{id} ─────────────────────────────────────────

        /// <summary>Xóa comment (chỉ chủ comment).</summary>
        [HttpDelete("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            await _commentService.DeleteAsync(id, CurrentUserId!.Value);
            return Ok(ApiResponse.Ok("Đã xóa bình luận."));
        }
    }
}
