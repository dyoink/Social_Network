using SocialNetwork.Api.Common;
using SocialNetwork.Api.Data;
using SocialNetwork.Api.DTOs.Admin;
using SocialNetwork.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SocialNetwork.Api.Services.Implementations;

public class AdminService(SocialDbContext db) : IAdminService
{
    public async Task<AdminStatsDto> GetStatsAsync()
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var totalUsers    = await db.Users.CountAsync();
        var totalPosts    = await db.Posts.CountAsync();
        var totalComments = await db.Comments.CountAsync();
        var pendingReports = await db.Reports.CountAsync(r => r.Status == "Pending");
        var newUsersToday  = await db.Users.CountAsync(u => u.CreatedAt >= today && u.CreatedAt < tomorrow);
        var newPostsToday  = await db.Posts.CountAsync(p => p.CreatedAt >= today && p.CreatedAt < tomorrow);

        return new AdminStatsDto
        {
            TotalUsers     = totalUsers,
            TotalPosts     = totalPosts,
            TotalComments  = totalComments,
            PendingReports = pendingReports,
            NewUsersToday  = newUsersToday,
            NewPostsToday  = newPostsToday,
        };
    }

    public async Task<PagedResult<AdminUserDto>> GetUsersAsync(string? q, string? role, int page, int pageSize)
    {
        var query = db.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(u => u.Username.Contains(q) || (u.FullName != null && u.FullName.Contains(q)) || u.Email.Contains(q));

        if (!string.IsNullOrWhiteSpace(role))
            query = query.Where(u => u.Role == role);

        var total = await query.CountAsync();

        // Đếm follower và post bằng subquery
        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserDto
            {
                Id             = u.Id,
                Username       = u.Username,
                FullName       = u.FullName,
                Email          = u.Email,
                Role           = u.Role,
                IsActive       = u.IsActive,
                AvatarUrl      = u.AvatarUrl,
                PostCount      = u.Posts.Count,
                FollowerCount  = u.Followers.Count,
                CreatedAt      = u.CreatedAt,
            })
            .ToListAsync();

        return PagedResult<AdminUserDto>.Create(items, total, page, pageSize);
    }

    public async Task BanUserAsync(int userId, bool ban)
    {
        await db.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.IsActive, !ban));
    }

    public async Task ChangeRoleAsync(int userId, string role)
    {
        if (role != "Member" && role != "Admin")
            throw new InvalidOperationException("Role không hợp lệ. Chỉ chấp nhận Member hoặc Admin.");

        await db.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.Role, role));
    }

    public async Task DeleteUserAsync(int userId)
    {
        var user = await db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Không tìm thấy user.");
        db.Users.Remove(user);
        await db.SaveChangesAsync();
    }

    public async Task<PagedResult<AdminPostDto>> GetPostsAsync(string? q, int page, int pageSize)
    {
        var query = db.Posts.AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(p => p.Content.Contains(q) || p.User.Username.Contains(q));

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new AdminPostDto
            {
                Id               = p.Id,
                AuthorUsername   = p.User.Username,
                AuthorAvatarUrl  = p.User.AvatarUrl,
                Content          = p.Content,
                ImageUrl         = p.ImageUrl,
                LikesCount       = p.Likes.Count,
                CommentsCount    = p.Comments.Count,
                ReportCount      = db.Reports.Count(r => r.TargetPostId == p.Id),
                CreatedAt        = p.CreatedAt,
            })
            .ToListAsync();

        return PagedResult<AdminPostDto>.Create(items, total, page, pageSize);
    }

    public async Task DeletePostAsync(int postId)
    {
        var post = await db.Posts.FindAsync(postId)
            ?? throw new KeyNotFoundException("Không tìm thấy bài viết.");
        db.Posts.Remove(post);
        await db.SaveChangesAsync();
    }

    public async Task<PagedResult<ReportDto>> GetReportsAsync(string? status, int page, int pageSize)
    {
        var query = db.Reports.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(r => r.Status == status);

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ReportDto
            {
                Id                  = r.Id,
                ReporterUsername    = r.Reporter.Username,
                TargetUsername      = r.TargetUser != null ? r.TargetUser.Username : null,
                TargetPostId        = r.TargetPostId,
                TargetPostContent   = r.TargetPost != null ? r.TargetPost.Content.Substring(0, Math.Min(r.TargetPost.Content.Length, 100)) : null,
                Reason              = r.Reason,
                Detail              = r.Detail,
                Status              = r.Status,
                CreatedAt           = r.CreatedAt,
                ResolvedAt          = r.ResolvedAt,
            })
            .ToListAsync();

        return PagedResult<ReportDto>.Create(items, total, page, pageSize);
    }

    public async Task ResolveReportAsync(int reportId)
    {
        await db.Reports
            .Where(r => r.Id == reportId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(r => r.Status, "Resolved")
                .SetProperty(r => r.ResolvedAt, DateTime.UtcNow));
    }
}
