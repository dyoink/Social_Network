using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace SocialNetwork.Api.Hubs
{
    /// <summary>
    /// SignalR Hub cho real-time notifications.
    /// Mỗi user tự join group "user_{userId}" khi connect.
    /// Backend push notification mới qua IHubContext từ NotificationService.
    /// </summary>
    [Authorize]
    public class NotificationHub : Hub
    {
        private int CurrentUserId =>
            int.TryParse(Context.User?.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;

        public override async Task OnConnectedAsync()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{CurrentUserId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{CurrentUserId}");
            await base.OnDisconnectedAsync(exception);
        }
    }
}
