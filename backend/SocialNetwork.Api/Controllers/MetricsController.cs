using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocialNetwork.Api.Data;
using SocialNetwork.Api.Middleware;

namespace SocialNetwork.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MetricsController(ServerMetricsService metrics, SocialDbContext db) : ControllerBase
{
    /// <summary>
    /// Lấy toàn bộ server metrics (không cần auth).
    /// Dùng cho landing page dashboard.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMetrics()
    {
        var snapshot = metrics.GetSnapshot();

        // Thêm database stats
        var dbStats = new
        {
            TotalUsers = await db.Users.CountAsync(),
            TotalPosts = await db.Posts.CountAsync(),
            TotalComments = await db.Comments.CountAsync(),
            TotalMessages = await db.Messages.CountAsync(),
            TotalNotifications = await db.Notifications.CountAsync(),
            TotalReports = await db.Reports.CountAsync(),
            TotalFollows = await db.Follows.CountAsync(),
            TotalLikes = await db.PostLikes.CountAsync(),
            DatabaseConnected = true,
        };

        return Ok(new
        {
            Server = snapshot,
            Database = dbStats,
        });
    }

    /// <summary>
    /// Endpoint nhẹ chỉ trả server metrics (không query DB).
    /// Phù hợp cho polling nhanh.
    /// </summary>
    [HttpGet("server")]
    public IActionResult GetServerMetrics()
    {
        return Ok(metrics.GetSnapshot());
    }
}
