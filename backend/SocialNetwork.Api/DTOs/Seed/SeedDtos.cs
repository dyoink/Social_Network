using System.ComponentModel.DataAnnotations;

namespace SocialNetwork.Api.DTOs.Seed;

public class SeedOptionsDto
{
    [Range(1, 200)]
    public int UserCount { get; set; } = 20;

    [Range(0, 20)]
    public int PostsPerUser { get; set; } = 5;

    [Range(0, 10)]
    public int CommentsPerPost { get; set; } = 3;

    [Range(0, 30)]
    public int FollowsPerUser { get; set; } = 10;

    [Range(0, 50)]
    public int ReactionsPerPost { get; set; } = 15;

    public bool IncludeMessages { get; set; } = true;

    public bool IncludeStories { get; set; } = true;
}

public class SeedResultDto
{
    public int UsersCreated { get; set; }
    public int PostsCreated { get; set; }
    public int CommentsCreated { get; set; }
    public int FollowsCreated { get; set; }
    public int ReactionsCreated { get; set; }
    public int MessagesCreated { get; set; }
    public int StoriesCreated { get; set; }
    public double DurationMs { get; set; }
}

public class SeedStatusDto
{
    public int SeededUsers { get; set; }
    public int SeededPosts { get; set; }
    public int SeededComments { get; set; }
    public int SeededFollows { get; set; }
    public int SeededReactions { get; set; }
    public int SeededMessages { get; set; }
    public int SeededStories { get; set; }
}
