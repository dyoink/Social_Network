using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.Notification;
using SocialNetwork.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialNetwork.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        private int CurrentUserId =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // ─── GET /api/notifications ────────────────────────────────────────────

        /// <summary>Danh sách thông báo của user, mới nhất trước (paged).</summary>
        [HttpGet]
        [ProducesResponseType<ApiResponse<PagedResult<NotificationDto>>>(200)]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await _notificationService.GetAllAsync(CurrentUserId, page, pageSize);
            return Ok(ApiResponse<PagedResult<NotificationDto>>.Ok(result));
        }

        // ─── PUT /api/notifications/{id}/read ─────────────────────────────────

        /// <summary>Đánh dấu một thông báo là đã đọc.</summary>
        [HttpPut("{id:int}/read")]
        [ProducesResponseType<ApiResponse>(200)]
        public async Task<IActionResult> MarkRead(int id)
        {
            await _notificationService.MarkReadAsync(id, CurrentUserId);
            return Ok(ApiResponse.Ok("Đã đọc."));
        }

        // ─── PUT /api/notifications/read-all ──────────────────────────────────

        /// <summary>Đánh dấu tất cả thông báo là đã đọc.</summary>
        [HttpPut("read-all")]
        [ProducesResponseType<ApiResponse>(200)]
        public async Task<IActionResult> MarkAllRead()
        {
            await _notificationService.MarkAllReadAsync(CurrentUserId);
            return Ok(ApiResponse.Ok("Tất cả đã được đánh dấu đã đọc."));
        }

        // ─── GET /api/notifications/unread-count ──────────────────────────────

        /// <summary>Số thông báo chưa đọc (dùng cho badge góc NavBar).</summary>
        [HttpGet("unread-count")]
        [ProducesResponseType<ApiResponse<UnreadNotificationCountDto>>(200)]
        public async Task<IActionResult> GetUnreadCount()
        {
            var count = await _notificationService.GetUnreadCountAsync(CurrentUserId);
            return Ok(ApiResponse<UnreadNotificationCountDto>.Ok(new UnreadNotificationCountDto { Count = count }));
        }
    }
}
