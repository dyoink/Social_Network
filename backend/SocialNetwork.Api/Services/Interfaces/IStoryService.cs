using SocialNetwork.Api.DTOs.Story;

namespace SocialNetwork.Api.Services.Interfaces;

public interface IStoryService
{
    Task<StoryDto> CreateAsync(int userId, CreateStoryDto dto);
    Task<List<StoryGroupDto>> GetFeedStoriesAsync(int currentUserId);
    Task<List<StoryDto>> GetMyStoriesAsync(int userId);
    Task MarkViewedAsync(int storyId, int viewerUserId);
    Task<List<StoryViewerDto>> GetViewersAsync(int storyId, int ownerUserId);
    Task DeleteAsync(int storyId, int userId);
    Task CleanupExpiredAsync();
}
