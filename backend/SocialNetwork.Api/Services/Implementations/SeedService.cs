using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using SocialNetwork.Api.Data;
using SocialNetwork.Api.DTOs.Seed;
using SocialNetwork.Api.Entities;
using SocialNetwork.Api.Services.Interfaces;

namespace SocialNetwork.Api.Services.Implementations;

public class SeedService(SocialDbContext db) : ISeedService
{
    // ────────────────── Word lists ──────────────────

    private static readonly string[] FirstNames =
    [
        "Minh", "Linh", "Huy", "Lan", "Nam", "Tú", "Hà", "Quân",
        "Dũng", "Thảo", "Đức", "Mai", "Phong", "Ngọc", "Bảo", "Vy",
        "Khoa", "Trang", "Hoàng", "Yến", "Tuấn", "Chi", "Khánh", "Nhung",
        "Long", "Hạnh", "Sơn", "Trúc", "Tùng", "Anh"
    ];

    private static readonly string[] LastNames =
    [
        "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi",
        "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Phan", "Võ", "Đinh",
        "Lương", "Cao", "Tạ", "Trịnh"
    ];

    private static readonly string[] Bios =
    [
        "Yêu lập trình 💻", "Coffee addict ☕", "Photography lover 📷",
        "Đi khắp Việt Nam 🇻🇳", "Foodie chính hiệu 🍜", "Music is life 🎵",
        "Coder by day, gamer by night 🎮", "Sống chậm, yêu nhiều ❤️",
        "Frontend developer 🌐", "Backend enthusiast ⚙️",
        "UI/UX designer 🎨", "Cat person 🐱", "Dog lover 🐕",
        "Gym rat 💪", "Bookworm 📚"
    ];

    private static readonly string[] PostContents =
    [
        "Hôm nay trời đẹp quá! Ai đi café không?",
        "Code mãi không xong bug 😭 Ai gặp rồi chỉ tôi với",
        "Cuối tuần chill thôi, làm việc cả tuần mệt lắm rồi",
        "Ăn gì ngon chỉ tôi với, đói quá!",
        "Vừa hoàn thành dự án mới, cảm thấy rất vui!",
        "Sáng nay thức dậy sớm chạy bộ, không khí trong lành phết",
        "Ai muốn học lập trình thì inbox mình nhé, free luôn",
        "Share playlist nhạc chill cho ai cần: lo-fi, jazz, acoustic",
        "Mới thử quán cà phê mới mở ở trung tâm, view cực đẹp",
        "Đang tìm người cùng làm side project, ai hứng thú không?",
        "Hôm nay học được thêm kiến thức mới, thấy vui quá",
        "Cuộc sống là những chuyến đi, bạn đã đi đâu chưa?",
        "Mới ăn phở ngon nhất đời, quán nhỏ mà chất lượng",
        "Motivation buổi sáng: Không có gì là không thể!",
        "Weekend này ai tổ chức gì vui không?",
        "Thả nhiều ảnh mèo vì mèo là nhất 🐱",
        "Review phim mới xem: 10/10 recommend!",
        "Tip làm việc hiệu quả: Pomodoro technique rất hiệu quả",
        "Sunset hôm nay đẹp nức nở luôn",
        "Tổng kết tháng: đọc 4 cuốn sách, chạy 50km, code 3 project"
    ];

    private static readonly string[] SampleHashtags =
    [
        "life", "dev", "food", "travel", "mood", "coding", "weekend",
        "hcm", "hanoi", "motivation", "selfie", "nature", "music",
        "sport", "study", "cafe", "photography", "tech", "beauty", "fitness"
    ];

    private static readonly string[] SampleComments =
    [
        "Quá đỉnh!", "Đồng ý 100%", "Haha đúng rồi 😂",
        "Hay lắm bạn ơi", "Ủng hộ!", "Tuyệt vời!",
        "Cảm ơn bạn đã chia sẻ", "Mình cũng vậy!",
        "Quá sức tưởng tượng", "Chúc bạn may mắn nhé",
        "Like mạnh!", "Bạn giỏi quá!", "Đỉnh của chóp 🏔️",
        "Quá xịn sò", "Cần thêm chi tiết nha bạn"
    ];

    private static readonly string[] SampleMessages =
    [
        "Alo bạn ơi!", "Đi ăn chưa?", "Hôm nay bận không?",
        "Xem meme này chưa? 😂", "Gặp nhau cuối tuần nhé",
        "Bạn code xong chưa?", "Chia sẻ link nhé", "Ok bạn!",
        "Thấy hay quá", "Mai rảnh không?", "Cảm ơn bạn nhiều!",
        "Được luôn!", "Tối nay online không?", "Mình gửi lại sau nhé",
        "Nice!"
    ];

    private static readonly string[] ReactionTypes =
        ["Like", "Love", "Haha", "Wow", "Sad", "Angry"];

    private static readonly string[] StoryCaptions =
    [
        "Khoảnh khắc đẹp ✨", "Chill chill 🎵", null!, "Ngày mới 🌅",
        "Yummy 🍕", null!, "Vibes 🔥", "Beautiful day 🌈", null!
    ];

    private static readonly Random Rng = new();

    // ────────────────── Public API ──────────────────

    public async Task<SeedResultDto> SeedAsync(SeedOptionsDto options)
    {
        var sw = Stopwatch.StartNew();
        var result = new SeedResultDto();

        // 1) Users
        var users = SeedUsers(options.UserCount);
        db.Users.AddRange(users);
        await db.SaveChangesAsync();
        result.UsersCreated = users.Count;

        var userIds = users.Select(u => u.Id).ToList();

        // 2) Posts + Hashtags
        var (posts, _) = SeedPosts(userIds, options.PostsPerUser);
        db.Posts.AddRange(posts);
        await db.SaveChangesAsync();
        result.PostsCreated = posts.Count;

        // Hashtags (cần post Id trước)
        if (posts.Count > 0)
        {
            await SeedHashtagsForPostsAsync(posts);
        }

        // 3) Reactions
        if (options.ReactionsPerPost > 0 && posts.Count > 0)
        {
            var reactions = SeedReactions(posts, userIds, options.ReactionsPerPost);
            db.PostLikes.AddRange(reactions);
            await db.SaveChangesAsync();
            result.ReactionsCreated = reactions.Count;
        }

        // 4) Comments
        if (options.CommentsPerPost > 0 && posts.Count > 0)
        {
            var comments = SeedComments(posts, userIds, options.CommentsPerPost);
            db.Comments.AddRange(comments);
            await db.SaveChangesAsync();
            result.CommentsCreated = comments.Count;
        }

        // 5) Follows
        if (options.FollowsPerUser > 0 && userIds.Count > 1)
        {
            var follows = SeedFollows(userIds, options.FollowsPerUser);
            db.Follows.AddRange(follows);
            await db.SaveChangesAsync();
            result.FollowsCreated = follows.Count;
        }

        // 6) Messages (optional)
        if (options.IncludeMessages && userIds.Count >= 2)
        {
            var msgCount = await SeedMessagesAsync(userIds);
            result.MessagesCreated = msgCount;
        }

        // 7) Stories (optional)
        if (options.IncludeStories)
        {
            var stories = SeedStories(userIds);
            db.Stories.AddRange(stories);
            await db.SaveChangesAsync();
            result.StoriesCreated = stories.Count;
        }

        sw.Stop();
        result.DurationMs = sw.Elapsed.TotalMilliseconds;
        return result;
    }

    public async Task<SeedResultDto> ClearSeededDataAsync()
    {
        var sw = Stopwatch.StartNew();
        var result = new SeedResultDto();

        var seededUserIds = await db.Users
            .Where(u => u.IsSeeded)
            .Select(u => u.Id)
            .ToListAsync();

        if (seededUserIds.Count == 0)
        {
            sw.Stop();
            result.DurationMs = sw.Elapsed.TotalMilliseconds;
            return result;
        }

        // Xoá theo thứ tự FK: con trước, cha sau

        // StoryViews
        var storyIds = await db.Stories
            .Where(s => seededUserIds.Contains(s.UserId))
            .Select(s => s.Id)
            .ToListAsync();
        if (storyIds.Count > 0)
        {
            result.StoriesCreated = await db.StoryViews
                .Where(sv => storyIds.Contains(sv.StoryId))
                .ExecuteDeleteAsync();
            result.StoriesCreated += await db.Stories
                .Where(s => storyIds.Contains(s.Id))
                .ExecuteDeleteAsync();
        }

        // Messages + ConversationParticipants + Conversations
        // Tìm conversations mà TẤT CẢ participants đều là seeded
        var convosToDelete = await db.Conversations
            .Where(c => c.Participants.All(p => seededUserIds.Contains(p.UserId)))
            .Select(c => c.Id)
            .ToListAsync();
        if (convosToDelete.Count > 0)
        {
            result.MessagesCreated = await db.Messages
                .Where(m => convosToDelete.Contains(m.ConversationId))
                .ExecuteDeleteAsync();
            await db.ConversationParticipants
                .Where(cp => convosToDelete.Contains(cp.ConversationId))
                .ExecuteDeleteAsync();
            await db.Conversations
                .Where(c => convosToDelete.Contains(c.Id))
                .ExecuteDeleteAsync();
        }

        // Notifications liên quan tới seeded users
        await db.Notifications
            .Where(n => seededUserIds.Contains(n.UserId) || seededUserIds.Contains(n.ActorId))
            .ExecuteDeleteAsync();

        // PostLikes on posts by seeded users hoặc likes by seeded users
        var seededPostIds = await db.Posts
            .Where(p => seededUserIds.Contains(p.UserId))
            .Select(p => p.Id)
            .ToListAsync();

        result.ReactionsCreated = await db.PostLikes
            .Where(pl => seededUserIds.Contains(pl.UserId) || seededPostIds.Contains(pl.PostId))
            .ExecuteDeleteAsync();

        // Comments on seeded posts hoặc by seeded users
        result.CommentsCreated = await db.Comments
            .Where(c => seededUserIds.Contains(c.UserId) || seededPostIds.Contains(c.PostId))
            .ExecuteDeleteAsync();

        // PostHashtags of seeded posts
        if (seededPostIds.Count > 0)
        {
            await db.PostHashtags
                .Where(ph => seededPostIds.Contains(ph.PostId))
                .ExecuteDeleteAsync();
        }

        // Posts
        result.PostsCreated = await db.Posts
            .Where(p => seededUserIds.Contains(p.UserId))
            .ExecuteDeleteAsync();

        // Follows
        result.FollowsCreated = await db.Follows
            .Where(f => seededUserIds.Contains(f.FollowerId) || seededUserIds.Contains(f.FollowingId))
            .ExecuteDeleteAsync();

        // UserBadges of seeded users
        await db.UserBadges
            .Where(ub => seededUserIds.Contains(ub.UserId))
            .ExecuteDeleteAsync();

        // Users
        result.UsersCreated = await db.Users
            .Where(u => u.IsSeeded)
            .ExecuteDeleteAsync();

        sw.Stop();
        result.DurationMs = sw.Elapsed.TotalMilliseconds;
        return result;
    }

    public async Task<SeedStatusDto> GetSeedStatusAsync()
    {
        var seededUserIds = await db.Users
            .Where(u => u.IsSeeded)
            .Select(u => u.Id)
            .ToListAsync();

        if (seededUserIds.Count == 0) return new SeedStatusDto();

        var seededPostIds = await db.Posts
            .Where(p => seededUserIds.Contains(p.UserId))
            .Select(p => p.Id)
            .ToListAsync();

        return new SeedStatusDto
        {
            SeededUsers = seededUserIds.Count,
            SeededPosts = seededPostIds.Count,
            SeededComments = await db.Comments.CountAsync(c => seededUserIds.Contains(c.UserId)),
            SeededFollows = await db.Follows.CountAsync(f => seededUserIds.Contains(f.FollowerId)),
            SeededReactions = await db.PostLikes.CountAsync(pl => seededUserIds.Contains(pl.UserId)),
            SeededMessages = await db.Messages.CountAsync(m => seededUserIds.Contains(m.SenderId)),
            SeededStories = await db.Stories.CountAsync(s => seededUserIds.Contains(s.UserId)),
        };
    }

    // ────────────────── Private helpers ──────────────────

    private static List<User> SeedUsers(int count)
    {
        var users = new List<User>(count);
        var now = DateTime.UtcNow;
        var usedUsernames = new HashSet<string>();

        for (var i = 0; i < count; i++)
        {
            string username;
            do { username = $"seed_{Guid.NewGuid():N}"[..16]; }
            while (!usedUsernames.Add(username));

            var createdAt = now.AddDays(-Rng.Next(1, 365));

            users.Add(new User
            {
                Username = username,
                Email = $"{username}@seed.test",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Seed@1234"),
                FullName = $"{Pick(LastNames)} {Pick(FirstNames)}",
                Bio = Pick(Bios),
                AvatarUrl = $"https://picsum.photos/seed/{username}/100/100",
                CoverUrl = $"https://picsum.photos/seed/{username}c/800/300",
                Role = "Member",
                IsActive = true,
                IsSeeded = true,
                Gender = Pick(["Male", "Female", "Other"]),
                DateOfBirth = new DateTime(Rng.Next(1985, 2005), Rng.Next(1, 13), Rng.Next(1, 28), 0, 0, 0, DateTimeKind.Utc),
                Hometown = Pick(["Hà Nội", "TP.HCM", "Đà Nẵng", "Huế", "Cần Thơ", "Hải Phòng", "Nha Trang", "Đà Lạt"]),
                CreatedAt = createdAt,
                UpdatedAt = createdAt,
            });
        }

        return users;
    }

    private static (List<Post> posts, List<PostHashtag> hashtags) SeedPosts(List<int> userIds, int postsPerUser)
    {
        var posts = new List<Post>();
        var hashtags = new List<PostHashtag>();
        var now = DateTime.UtcNow;

        foreach (var userId in userIds)
        {
            for (var i = 0; i < postsPerUser; i++)
            {
                var content = Pick(PostContents);
                // Thêm 1–3 hashtags ngẫu nhiên
                var tagCount = Rng.Next(1, 4);
                var tags = new HashSet<string>();
                for (var t = 0; t < tagCount; t++) tags.Add(Pick(SampleHashtags));
                content += " " + string.Join(" ", tags.Select(tg => "#" + tg));

                var createdAt = now.AddDays(-Rng.Next(0, 90)).AddMinutes(-Rng.Next(0, 1440));
                var hasImage = Rng.NextDouble() < 0.3;

                var post = new Post
                {
                    UserId = userId,
                    Content = content,
                    ImageUrl = hasImage ? $"https://picsum.photos/seed/{Guid.NewGuid():N}/800/600" : null,
                    Visibility = Pick(["Public", "Public", "Public", "Public", "Public", "Public", "Public", "FollowersOnly", "FollowersOnly", "Private"]),
                    CreatedAt = createdAt,
                    UpdatedAt = createdAt,
                };
                posts.Add(post);
            }
        }

        return (posts, hashtags);
    }

    private static List<PostLike> SeedReactions(List<Post> posts, List<int> userIds, int reactionsPerPost)
    {
        var reactions = new List<PostLike>();
        var seen = new HashSet<(int, int)>();

        foreach (var post in posts)
        {
            var count = Math.Min(reactionsPerPost, userIds.Count - 1);
            var candidates = userIds.Where(id => id != post.UserId).OrderBy(_ => Rng.Next()).Take(count);

            foreach (var userId in candidates)
            {
                if (!seen.Add((userId, post.Id))) continue;
                reactions.Add(new PostLike
                {
                    UserId = userId,
                    PostId = post.Id,
                    ReactionType = Pick(ReactionTypes),
                    CreatedAt = post.CreatedAt.AddMinutes(Rng.Next(1, 4320)),
                });
            }
        }

        return reactions;
    }

    private static List<Comment> SeedComments(List<Post> posts, List<int> userIds, int commentsPerPost)
    {
        var comments = new List<Comment>();

        foreach (var post in posts)
        {
            for (var i = 0; i < commentsPerPost; i++)
            {
                var authorId = userIds.Where(id => id != post.UserId).OrderBy(_ => Rng.Next()).First();
                comments.Add(new Comment
                {
                    PostId = post.Id,
                    UserId = authorId,
                    Content = Pick(SampleComments),
                    CreatedAt = post.CreatedAt.AddMinutes(Rng.Next(1, 7200)),
                });
            }
        }

        return comments;
    }

    private static List<Follow> SeedFollows(List<int> userIds, int followsPerUser)
    {
        var follows = new List<Follow>();
        var seen = new HashSet<(int, int)>();

        foreach (var userId in userIds)
        {
            var count = Math.Min(followsPerUser, userIds.Count - 1);
            var targets = userIds.Where(id => id != userId).OrderBy(_ => Rng.Next()).Take(count);

            foreach (var targetId in targets)
            {
                if (!seen.Add((userId, targetId))) continue;
                follows.Add(new Follow
                {
                    FollowerId = userId,
                    FollowingId = targetId,
                    CreatedAt = DateTime.UtcNow.AddDays(-Rng.Next(0, 90)),
                });
            }
        }

        return follows;
    }

    private async Task<int> SeedMessagesAsync(List<int> userIds)
    {
        var pairCount = Math.Min(20, userIds.Count * (userIds.Count - 1) / 2);
        var pairs = new HashSet<(int, int)>();
        var totalMessages = 0;

        while (pairs.Count < pairCount)
        {
            var a = Pick(userIds);
            var b = Pick(userIds);
            if (a == b) continue;
            var key = a < b ? (a, b) : (b, a);
            pairs.Add(key);
        }

        foreach (var (userA, userB) in pairs)
        {
            var convo = new Conversation { CreatedAt = DateTime.UtcNow.AddDays(-Rng.Next(1, 60)) };
            db.Conversations.Add(convo);
            await db.SaveChangesAsync();

            db.ConversationParticipants.AddRange(
                new ConversationParticipant { ConversationId = convo.Id, UserId = userA },
                new ConversationParticipant { ConversationId = convo.Id, UserId = userB }
            );

            var msgCount = Rng.Next(5, 16);
            var baseTime = convo.CreatedAt;
            for (var i = 0; i < msgCount; i++)
            {
                baseTime = baseTime.AddMinutes(Rng.Next(1, 120));
                db.Messages.Add(new Message
                {
                    ConversationId = convo.Id,
                    SenderId = i % 2 == 0 ? userA : userB,
                    Content = Pick(SampleMessages),
                    IsRead = Rng.NextDouble() < 0.7,
                    CreatedAt = baseTime,
                });
                totalMessages++;
            }

            await db.SaveChangesAsync();
        }

        return totalMessages;
    }

    private static List<Story> SeedStories(List<int> userIds)
    {
        var stories = new List<Story>();
        var now = DateTime.UtcNow;

        // 50% users có stories
        var storyUsers = userIds.OrderBy(_ => Rng.Next()).Take(userIds.Count / 2);

        foreach (var userId in storyUsers)
        {
            var count = Rng.Next(1, 4);
            for (var i = 0; i < count; i++)
            {
                var createdAt = now.AddHours(-Rng.Next(1, 48));
                stories.Add(new Story
                {
                    UserId = userId,
                    MediaUrl = $"https://picsum.photos/seed/{Guid.NewGuid():N}/400/700",
                    MediaType = "Image",
                    Caption = Pick(StoryCaptions),
                    CreatedAt = createdAt,
                    ExpiresAt = createdAt.AddHours(24),
                });
            }
        }

        return stories;
    }

    // Cần thêm hashtags sau khi posts đã có Id
    // Gọi riêng sau SaveChangesAsync của posts
    public async Task SeedHashtagsForPostsAsync(List<Post> posts)
    {
        var hashtags = new List<PostHashtag>();
        foreach (var post in posts)
        {
            // Parse hashtags từ content
            var words = post.Content.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var tags = words.Where(w => w.StartsWith('#') && w.Length > 1)
                .Select(w => w[1..].ToLowerInvariant().TrimEnd('.', ',', '!', '?'))
                .Where(t => t.Length > 0)
                .Distinct();

            foreach (var tag in tags)
            {
                hashtags.Add(new PostHashtag { PostId = post.Id, Tag = tag });
            }
        }

        if (hashtags.Count > 0)
        {
            db.PostHashtags.AddRange(hashtags);
            await db.SaveChangesAsync();
        }
    }

    private static T Pick<T>(IReadOnlyList<T> list) => list[Rng.Next(list.Count)];
    private static T Pick<T>(T[] array) => array[Rng.Next(array.Length)];
}
