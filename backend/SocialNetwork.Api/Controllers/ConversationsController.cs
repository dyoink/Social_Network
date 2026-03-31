using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.Data;
using SocialNetwork.Api.DTOs.Message;
using SocialNetwork.Api.Hubs;
using SocialNetwork.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialNetwork.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ConversationsController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly IHubContext<ChatHub> _chatHub;
        private readonly SocialDbContext _db;

        public ConversationsController(
            IMessageService messageService,
            IHubContext<ChatHub> chatHub,
            SocialDbContext db)
        {
            _messageService = messageService;
            _chatHub = chatHub;
            _db = db;
        }

        private int CurrentUserId =>
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;

        // ─── GET /api/conversations ────────────────────────────────────────────

        /// <summary>Danh sách conversation của user đang đăng nhập, mới nhất trước.</summary>
        [HttpGet]
        [ProducesResponseType<ApiResponse<PagedResult<ConversationDto>>>(200)]
        public async Task<IActionResult> GetConversations(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await _messageService.GetConversationsAsync(CurrentUserId, page, pageSize);
            return Ok(ApiResponse<PagedResult<ConversationDto>>.Ok(result));
        }

        // ─── POST /api/conversations ───────────────────────────────────────────

        /// <summary>Lấy hoặc tạo conversation 1-1 với targetUserId.</summary>
        [HttpPost]
        [ProducesResponseType<ApiResponse<ConversationDto>>(200)]
        public async Task<IActionResult> StartConversation([FromBody] StartConversationDto dto)
        {
            var conv = await _messageService.GetOrCreateConversationAsync(CurrentUserId, dto.TargetUserId);
            return Ok(ApiResponse<ConversationDto>.Ok(conv));
        }

        // ─── GET /api/conversations/{id}/messages ──────────────────────────────

        /// <summary>Lịch sử tin nhắn của một conversation (paged).</summary>
        [HttpGet("{id:int}/messages")]
        [ProducesResponseType<ApiResponse<PagedResult<MessageDto>>>(200)]
        public async Task<IActionResult> GetMessages(
            int id,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 30)
        {
            var result = await _messageService.GetMessagesAsync(id, CurrentUserId, page, pageSize);
            return Ok(ApiResponse<PagedResult<MessageDto>>.Ok(result));
        }

        // ─── POST /api/conversations/{id}/messages ─────────────────────────────

        /// <summary>Gửi tin nhắn mới vào conversation.</summary>
        [HttpPost("{id:int}/messages")]
        [ProducesResponseType<ApiResponse<MessageDto>>(201)]
        public async Task<IActionResult> SendMessage(int id, [FromBody] CreateMessageDto dto)
        {
            // Đảm bảo ConversationId trong body khớp với route
            dto.ConversationId = id;
            var message = await _messageService.SendMessageAsync(CurrentUserId, dto);

            // Broadcast qua SignalR cho tất cả clients trong conversation group
            await _chatHub.Clients.Group($"conv_{id}")
                .SendAsync("ReceiveMessage", message);

            // Gửi cập nhật conversation cho các participant khác (sidebar)
            var participantIds = await _db.ConversationParticipants
                .Where(cp => cp.ConversationId == id && cp.UserId != CurrentUserId)
                .Select(cp => cp.UserId)
                .ToListAsync();

            foreach (var userId in participantIds)
            {
                await _chatHub.Clients.Group($"user_{userId}")
                    .SendAsync("ConversationUpdated", new { conversationId = id, lastMessage = message });
            }

            return StatusCode(201, ApiResponse<MessageDto>.Ok(message, "Đã gửi tin nhắn."));
        }

        // ─── PUT /api/conversations/{id}/read ─────────────────────────────────

        /// <summary>Đánh dấu tất cả tin nhắn trong conversation là đã đọc.</summary>
        [HttpPut("{id:int}/read")]
        [ProducesResponseType<ApiResponse>(200)]
        public async Task<IActionResult> MarkRead(int id)
        {
            await _messageService.MarkReadAsync(id, CurrentUserId);
            return Ok(ApiResponse.Ok("Đã đánh dấu đã đọc."));
        }

        // ─── GET /api/conversations/unread-count ──────────────────────────────

        /// <summary>Tổng số tin nhắn chưa đọc (dùng cho badge).</summary>
        [HttpGet("unread-count")]
        [ProducesResponseType<ApiResponse<UnreadCountDto>>(200)]
        public async Task<IActionResult> GetUnreadCount()
        {
            var count = await _messageService.GetUnreadCountAsync(CurrentUserId);
            return Ok(ApiResponse<UnreadCountDto>.Ok(new UnreadCountDto { Count = count }));
        }
    }
}
