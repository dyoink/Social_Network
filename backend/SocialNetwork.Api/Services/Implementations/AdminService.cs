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
        var weekAgo = today.AddDays(-7);

        var totalUsers    = await db.Users.CountAsync();
        var totalPosts    = await db.Posts.CountAsync();
        var totalComments = await db.Comments.CountAsync();
        var totalMessages = await db.Messages.CountAsync();
        var totalFollows  = await db.Follows.CountAsync();
        var pendingReports = await db.Reports.CountAsync(r => r.Status == "Pending");
        var newUsersToday  = await db.Users.CountAsync(u => u.CreatedAt >= today && u.CreatedAt < tomorrow);
        var newPostsToday  = await db.Posts.CountAsync(p => p.CreatedAt >= today && p.CreatedAt < tomorrow);
        var newCommentsToday = await db.Comments.CountAsync(c => c.CreatedAt >= today && c.CreatedAt < tomorrow);
        // Ước tính active users = đã tạo post, comment, like hoặc message trong 7 ngày gần nhất
        var activeUsersWeek = await db.Users.CountAsync(u =>
            u.Posts.Any(p => p.CreatedAt >= weekAgo) ||
            u.Comments.Any(c => c.CreatedAt >= weekAgo) ||
            u.MessagesSent.Any(m => m.CreatedAt >= weekAgo));

        return new AdminStatsDto
        {
            TotalUsers       = totalUsers,
            TotalPosts       = totalPosts,
            TotalComments    = totalComments,
            TotalMessages    = totalMessages,
            TotalFollows     = totalFollows,
            PendingReports   = pendingReports,
            NewUsersToday    = newUsersToday,
            NewPostsToday    = newPostsToday,
            NewCommentsToday = newCommentsToday,
            ActiveUsersWeek  = activeUsersWeek,
        };
    }

    public async Task<GrowthChartDto> GetGrowthChartAsync(int days)
    {
        // Giới hạn tối đa 90 ngày, tối thiểu 7
        days = Math.Clamp(days, 7, 90);
        var startDate = DateTime.UtcNow.Date.AddDays(-days + 1);

        var users = await db.Users
            .Where(u => u.CreatedAt >= startDate)
            .GroupBy(u => u.CreatedAt.Date)
            .Select(g => new DailyCountDto { Date = g.Key.ToString("yyyy-MM-dd"), Count = g.Count() })
            .ToListAsync();

        var posts = await db.Posts
            .Where(p => p.CreatedAt >= startDate)
            .GroupBy(p => p.CreatedAt.Date)
            .Select(g => new DailyCountDto { Date = g.Key.ToString("yyyy-MM-dd"), Count = g.Count() })
            .ToListAsync();

        var comments = await db.Comments
            .Where(c => c.CreatedAt >= startDate)
            .GroupBy(c => c.CreatedAt.Date)
            .Select(g => new DailyCountDto { Date = g.Key.ToString("yyyy-MM-dd"), Count = g.Count() })
            .ToListAsync();

        // Đảm bảo tất cả ngày đều có entry (fill 0 cho ngày trống)
        var allDates = Enumerable.Range(0, days)
            .Select(i => startDate.AddDays(i).ToString("yyyy-MM-dd"))
            .ToList();

        var userMap = users.ToDictionary(x => x.Date, x => x.Count);
        var postMap = posts.ToDictionary(x => x.Date, x => x.Count);
        var commentMap = comments.ToDictionary(x => x.Date, x => x.Count);

        return new GrowthChartDto
        {
            Users = allDates.Select(d => new DailyCountDto { Date = d, Count = userMap.GetValueOrDefault(d) }).ToList(),
            Posts = allDates.Select(d => new DailyCountDto { Date = d, Count = postMap.GetValueOrDefault(d) }).ToList(),
            Comments = allDates.Select(d => new DailyCountDto { Date = d, Count = commentMap.GetValueOrDefault(d) }).ToList(),
        };
    }

    public async Task<PagedResult<AdminUserDto>> GetUsersAsync(string? q, string? role, string? status, string? sortBy, string? isDescending, int page, int pageSize)
    {
        var query = db.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(u => u.Username.Contains(q) || (u.FullName != null && u.FullName.Contains(q)) || u.Email.Contains(q));

        if (!string.IsNullOrWhiteSpace(role))
            query = query.Where(u => u.Role == role);

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (status == "active") query = query.Where(u => u.IsActive);
            else if (status == "banned") query = query.Where(u => !u.IsActive);
        }

        bool desc = true;
        if (!string.IsNullOrWhiteSpace(isDescending))
        {
            bool.TryParse(isDescending, out desc);
        }

        // Sorting
        query = sortBy?.ToLower() switch
        {
            "username"  => desc ? query.OrderByDescending(u => u.Username) : query.OrderBy(u => u.Username),
            "email"     => desc ? query.OrderByDescending(u => u.Email) : query.OrderBy(u => u.Email),
            "postcount" => desc ? query.OrderByDescending(u => u.Posts.Count) : query.OrderBy(u => u.Posts.Count),
            "followercount" => desc ? query.OrderByDescending(u => u.Followers.Count) : query.OrderBy(u => u.Followers.Count),
            "followingcount" => desc ? query.OrderByDescending(u => u.Following.Count) : query.OrderBy(u => u.Following.Count),
            "commentcount" => desc ? query.OrderByDescending(u => u.Comments.Count) : query.OrderBy(u => u.Comments.Count),
            "reportcount" => desc 
                ? query.OrderByDescending(u => db.Reports.Count(r => r.TargetUserId == u.Id)) 
                : query.OrderBy(u => db.Reports.Count(r => r.TargetUserId == u.Id)),
            _ => desc ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt)
        };

        var total = await query.CountAsync();

        var items = await query
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
                FollowingCount = u.Following.Count,
                CommentCount   = u.Comments.Count,
                ReportCount    = db.Reports.Count(r => r.TargetUserId == u.Id),
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

    public async Task ResetPasswordAsync(int userId, string newPassword)
    {
        var hash = BCrypt.Net.BCrypt.HashPassword(newPassword, workFactor: 12);
        var updated = await db.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.PasswordHash, hash));
        if (updated == 0) throw new KeyNotFoundException("Không tìm thấy user.");
    }

    public async Task DeleteUserAsync(int userId)
    {
        var user = await db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Không tìm thấy user.");
        db.Users.Remove(user);
        await db.SaveChangesAsync();
    }

    public async Task BulkBanUsersAsync(List<int> userIds, bool ban)
    {
        await db.Users
            .Where(u => userIds.Contains(u.Id))
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.IsActive, !ban));
    }

    public async Task BulkDeleteUsersAsync(List<int> userIds)
    {
        var users = await db.Users.Where(u => userIds.Contains(u.Id)).ToListAsync();
        db.Users.RemoveRange(users);
        await db.SaveChangesAsync();
    }

    public async Task<PagedResult<AdminPostDto>> GetPostsAsync(string? q, string? sortBy, string? isDescending, int page, int pageSize)
    {
        var query = db.Posts.AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(p => p.Content.Contains(q) || (p.User != null && p.User.Username.Contains(q)));

        bool desc = true;
        if (!string.IsNullOrWhiteSpace(isDescending))
        {
            bool.TryParse(isDescending, out desc);
        }

        // Sorting
        query = sortBy?.ToLower() switch
        {
            "content"  => desc ? query.OrderByDescending(p => p.Content) : query.OrderBy(p => p.Content),
            "username" => desc ? query.OrderByDescending(p => p.User.Username) : query.OrderBy(p => p.User.Username),
            "likescount" => desc ? query.OrderByDescending(p => p.Likes.Count) : query.OrderBy(p => p.Likes.Count),
            "commentscount" => desc ? query.OrderByDescending(p => p.Comments.Count) : query.OrderBy(p => p.Comments.Count),
            "reportcount" => desc 
                ? query.OrderByDescending(p => db.Reports.Count(r => r.TargetPostId == p.Id)) 
                : query.OrderBy(p => db.Reports.Count(r => r.TargetPostId == p.Id)),
            _ => desc ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt)
        };

        var total = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new AdminPostDto
            {
                Id               = p.Id,
                AuthorUsername   = p.User != null ? p.User.Username : "[deleted]",
                AuthorAvatarUrl  = p.User != null ? p.User.AvatarUrl : null,
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

    public async Task BulkDeletePostsAsync(List<int> postIds)
    {
        var posts = await db.Posts.Where(p => postIds.Contains(p.Id)).ToListAsync();
        db.Posts.RemoveRange(posts);
        await db.SaveChangesAsync();
    }

    public async Task<PagedResult<AdminCommentDto>> GetCommentsAsync(string? q, int? postId, int page, int pageSize)
    {
        var query = db.Comments.AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(c => c.Content.Contains(q) || c.User.Username.Contains(q));

        if (postId.HasValue)
            query = query.Where(c => c.PostId == postId.Value);

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new AdminCommentDto
            {
                Id                 = c.Id,
                PostId             = c.PostId,
                AuthorUsername     = c.User != null ? c.User.Username : "[deleted]",
                AuthorAvatarUrl    = c.User != null ? c.User.AvatarUrl : null,
                Content            = c.Content,
                ParentId           = c.ParentId,
                PostContentPreview = c.Post != null && c.Post.Content != null
                    ? c.Post.Content.Substring(0, Math.Min(c.Post.Content.Length, 80))
                    : null,
                CreatedAt          = c.CreatedAt,
            })
            .ToListAsync();

        return PagedResult<AdminCommentDto>.Create(items, total, page, pageSize);
    }

    public async Task DeleteCommentAsync(int commentId)
    {
        var comment = await db.Comments.FindAsync(commentId)
            ?? throw new KeyNotFoundException("Không tìm thấy bình luận.");
        db.Comments.Remove(comment);
        await db.SaveChangesAsync();
    }

    public async Task BulkDeleteCommentsAsync(List<int> commentIds)
    {
        var comments = await db.Comments.Where(c => commentIds.Contains(c.Id)).ToListAsync();
        db.Comments.RemoveRange(comments);
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
                ReporterUsername    = r.Reporter != null ? r.Reporter.Username : "[deleted]",
                TargetUsername      = r.TargetUser != null ? r.TargetUser.Username : null,
                TargetPostId        = r.TargetPostId,
                TargetPostContent   = r.TargetPost != null && r.TargetPost.Content != null
                    ? r.TargetPost.Content.Substring(0, Math.Min(r.TargetPost.Content.Length, 100))
                    : null,
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

    public async Task BulkResolveReportsAsync(List<int> reportIds)
    {
        await db.Reports
            .Where(r => reportIds.Contains(r.Id))
            .ExecuteUpdateAsync(s => s
                .SetProperty(r => r.Status, "Resolved")
                .SetProperty(r => r.ResolvedAt, DateTime.UtcNow));
    }

    public async Task DeleteReportAsync(int reportId)
    {
        var report = await db.Reports.FindAsync(reportId)
            ?? throw new KeyNotFoundException("Không tìm thấy báo cáo.");
        db.Reports.Remove(report);
        await db.SaveChangesAsync();
    }

    public async Task BulkDeleteReportsAsync(List<int> reportIds)
    {
        var reports = await db.Reports.Where(r => reportIds.Contains(r.Id)).ToListAsync();
        db.Reports.RemoveRange(reports);
        await db.SaveChangesAsync();
    }

    public async Task<List<LeaderboardEntryDto>> GetLeaderboardAsync(int limit = 10)
    {
        var users = await db.Users
            .Where(u => u.IsActive)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.FullName,
                u.AvatarUrl,
                PostsCount = u.Posts.Count,
                LikesReceived = u.Posts.SelectMany(p => p.Likes).Count(),
                CommentsCount = u.Comments.Count,
            })
            .OrderByDescending(u => u.PostsCount + u.LikesReceived + u.CommentsCount)
            .Take(limit)
            .ToListAsync();

        return users.Select(u => new LeaderboardEntryDto
        {
            UserId = u.Id,
            Username = u.Username,
            FullName = u.FullName,
            AvatarUrl = u.AvatarUrl,
            PostsCount = u.PostsCount,
            LikesReceived = u.LikesReceived,
            CommentsCount = u.CommentsCount,
            Score = u.PostsCount + u.LikesReceived + u.CommentsCount,
        }).ToList();
    }
}
