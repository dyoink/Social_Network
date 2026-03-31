using Microsoft.EntityFrameworkCore;
using SocialNetwork.Api.Data;
using SocialNetwork.Api.DTOs.Story;
using SocialNetwork.Api.Entities;
using SocialNetwork.Api.Services.Interfaces;

namespace SocialNetwork.Api.Services.Implementations;

public class StoryService(SocialDbContext db) : IStoryService
{
    public async Task<StoryDto> CreateAsync(int userId, CreateStoryDto dto)
    {
        var user = await db.Users.FindAsync(userId)
            ?? throw new InvalidOperationException("User không tồn tại.");

        var story = new Story
        {
            UserId = userId,
            MediaUrl = dto.MediaUrl,
            MediaType = dto.MediaType,
            Caption = dto.Caption,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
        };

        db.Stories.Add(story);
        await db.SaveChangesAsync();

        return MapToDto(story, user, 0, false);
    }

    public async Task<List<StoryGroupDto>> GetFeedStoriesAsync(int currentUserId)
    {
        var now = DateTime.UtcNow;

        // Lấy danh sách user đang follow + chính mình
        var followingIds = await db.Follows
            .Where(f => f.FollowerId == currentUserId)
            .Select(f => f.FollowingId)
            .ToListAsync();
        followingIds.Add(currentUserId);

        // Lấy stories chưa hết hạn của các user đó
        var stories = await db.Stories
            .Include(s => s.User)
            .Include(s => s.Views)
            .Where(s => followingIds.Contains(s.UserId) && s.ExpiresAt > now)
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();

        // Group theo user
        var groups = stories
            .GroupBy(s => s.UserId)
            .Select(g =>
            {
                var user = g.First().User;
                var storyDtos = g.Select(s => MapToDto(s, user,
                    s.Views.Count,
                    s.Views.Any(v => v.UserId == currentUserId)
                )).ToList();

                return new StoryGroupDto
                {
                    UserId = user.Id,
                    Username = user.Username,
                    FullName = user.FullName,
                    AvatarUrl = user.AvatarUrl,
                    HasUnviewed = storyDtos.Any(s => !s.IsViewed),
                    Stories = storyDtos,
                };
            })
            .OrderByDescending(g => g.UserId == currentUserId) // Mình lên đầu
            .ThenByDescending(g => g.HasUnviewed)              // Chưa xem trước
            .ThenByDescending(g => g.Stories.Max(s => s.CreatedAt))
            .ToList();

        return groups;
    }

    public async Task<List<StoryDto>> GetMyStoriesAsync(int userId)
    {
        var now = DateTime.UtcNow;
        var user = await db.Users.FindAsync(userId);
        if (user == null) return [];

        var stories = await db.Stories
            .Include(s => s.Views)
            .Where(s => s.UserId == userId && s.ExpiresAt > now)
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();

        return stories.Select(s => MapToDto(s, user, s.Views.Count, true)).ToList();
    }

    public async Task MarkViewedAsync(int storyId, int viewerUserId)
    {
        var exists = await db.StoryViews
            .AnyAsync(sv => sv.StoryId == storyId && sv.UserId == viewerUserId);
        if (exists) return;

        var story = await db.Stories.FindAsync(storyId);
        if (story == null || story.ExpiresAt <= DateTime.UtcNow) return;

        db.StoryViews.Add(new StoryView
        {
            StoryId = storyId,
            UserId = viewerUserId,
            ViewedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
    }

    public async Task<List<StoryViewerDto>> GetViewersAsync(int storyId, int ownerUserId)
    {
        var story = await db.Stories.FindAsync(storyId)
            ?? throw new InvalidOperationException("Story không tồn tại.");

        if (story.UserId != ownerUserId)
            throw new UnauthorizedAccessException("Chỉ chủ story mới xem được danh sách viewers.");

        return await db.StoryViews
            .Include(sv => sv.User)
            .Where(sv => sv.StoryId == storyId)
            .OrderByDescending(sv => sv.ViewedAt)
            .Select(sv => new StoryViewerDto
            {
                UserId = sv.UserId,
                Username = sv.User.Username,
                FullName = sv.User.FullName,
                AvatarUrl = sv.User.AvatarUrl,
                ViewedAt = sv.ViewedAt,
            })
            .ToListAsync();
    }

    public async Task DeleteAsync(int storyId, int userId)
    {
        var story = await db.Stories.FindAsync(storyId)
            ?? throw new InvalidOperationException("Story không tồn tại.");

        if (story.UserId != userId)
            throw new UnauthorizedAccessException("Bạn không có quyền xóa story này.");

        db.Stories.Remove(story);
        await db.SaveChangesAsync();
    }

    public async Task CleanupExpiredAsync()
    {
        var expired = await db.Stories
            .Where(s => s.ExpiresAt <= DateTime.UtcNow)
            .ToListAsync();

        if (expired.Count > 0)
        {
            db.Stories.RemoveRange(expired);
            await db.SaveChangesAsync();
        }
    }

    private static StoryDto MapToDto(Story s, User u, int viewCount, bool isViewed) => new()
    {
        Id = s.Id,
        UserId = s.UserId,
        Username = u.Username,
        FullName = u.FullName,
        AvatarUrl = u.AvatarUrl,
        MediaUrl = s.MediaUrl,
        MediaType = s.MediaType,
        Caption = s.Caption,
        CreatedAt = s.CreatedAt,
        ExpiresAt = s.ExpiresAt,
        ViewCount = viewCount,
        IsViewed = isViewed,
    };
}
