using Microsoft.EntityFrameworkCore;
using SocialNetwork.Api.Entities;

namespace SocialNetwork.Api.Data
{
    public class SocialDbContext : DbContext
    {
        public SocialDbContext(DbContextOptions<SocialDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Post> Posts { get; set; } = null!;
        public DbSet<Comment> Comments { get; set; } = null!;
        public DbSet<PostLike> PostLikes { get; set; } = null!;
        public DbSet<Follow> Follows { get; set; } = null!;
        public DbSet<Conversation> Conversations { get; set; } = null!;
        public DbSet<ConversationParticipant> ConversationParticipants { get; set; } = null!;
        public DbSet<Message> Messages { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<Report> Reports { get; set; } = null!;
        public DbSet<PostHashtag> PostHashtags { get; set; } = null!;
        public DbSet<Badge> Badges { get; set; } = null!;
        public DbSet<UserBadge> UserBadges { get; set; } = null!;
        public DbSet<Story> Stories { get; set; } = null!;
        public DbSet<StoryView> StoryViews { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure PostLike (Many-to-Many)
            modelBuilder.Entity<PostLike>()
                .HasKey(pl => new { pl.UserId, pl.PostId });

            modelBuilder.Entity<PostLike>()
                .HasOne(pl => pl.User)
                .WithMany(u => u.PostLikes)
                .HasForeignKey(pl => pl.UserId);

            modelBuilder.Entity<PostLike>()
                .HasOne(pl => pl.Post)
                .WithMany(p => p.Likes)
                .HasForeignKey(pl => pl.PostId);

            // Configure Follow (Many-to-Many Self-Referencing)
            modelBuilder.Entity<Follow>()
                .HasKey(f => new { f.FollowerId, f.FollowingId });

            modelBuilder.Entity<Follow>()
                .HasOne(f => f.Follower)
                .WithMany(u => u.Following)
                .HasForeignKey(f => f.FollowerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Follow>()
                .HasOne(f => f.Following)
                .WithMany(u => u.Followers)
                .HasForeignKey(f => f.FollowingId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure ConversationParticipant (Many-to-Many)
            modelBuilder.Entity<ConversationParticipant>()
                .HasKey(cp => new { cp.ConversationId, cp.UserId });

            modelBuilder.Entity<ConversationParticipant>()
                .HasOne(cp => cp.Conversation)
                .WithMany(c => c.Participants)
                .HasForeignKey(cp => cp.ConversationId);

            modelBuilder.Entity<ConversationParticipant>()
                .HasOne(cp => cp.User)
                .WithMany(u => u.Conversations)
                .HasForeignKey(cp => cp.UserId);

            // Configure Comment (Self-Referencing for Replies)
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Parent)
                .WithMany(c => c.Replies)
                .HasForeignKey(c => c.ParentId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Notifications
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.NotificationsReceived)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Actor)
                .WithMany(u => u.NotificationsTriggered)
                .HasForeignKey(n => n.ActorId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Message
            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany(u => u.MessagesSent)
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
            // Configure Reports
            modelBuilder.Entity<Report>()
                .HasOne(r => r.Reporter)
                .WithMany()
                .HasForeignKey(r => r.ReporterId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Report>()
                .HasOne(r => r.TargetUser)
                .WithMany()
                .HasForeignKey(r => r.TargetUserId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Report>()
                .HasOne(r => r.TargetPost)
                .WithMany()
                .HasForeignKey(r => r.TargetPostId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure PostHashtag (composite key PostId + Tag)
            modelBuilder.Entity<PostHashtag>()
                .HasKey(ph => new { ph.PostId, ph.Tag });

            modelBuilder.Entity<PostHashtag>()
                .HasOne(ph => ph.Post)
                .WithMany(p => p.Hashtags)
                .HasForeignKey(ph => ph.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            // Index cho trending query
            modelBuilder.Entity<PostHashtag>()
                .HasIndex(ph => ph.Tag);

            // Configure UserBadge (Many-to-Many)
            modelBuilder.Entity<UserBadge>()
                .HasKey(ub => new { ub.UserId, ub.BadgeId });

            modelBuilder.Entity<UserBadge>()
                .HasOne(ub => ub.User)
                .WithMany(u => u.UserBadges)
                .HasForeignKey(ub => ub.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserBadge>()
                .HasOne(ub => ub.Badge)
                .WithMany(b => b.UserBadges)
                .HasForeignKey(ub => ub.BadgeId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Story
            modelBuilder.Entity<Story>()
                .HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Story>()
                .HasIndex(s => s.ExpiresAt);

            // Configure StoryView (composite key)
            modelBuilder.Entity<StoryView>()
                .HasKey(sv => new { sv.StoryId, sv.UserId });

            modelBuilder.Entity<StoryView>()
                .HasOne(sv => sv.Story)
                .WithMany(s => s.Views)
                .HasForeignKey(sv => sv.StoryId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<StoryView>()
                .HasOne(sv => sv.User)
                .WithMany()
                .HasForeignKey(sv => sv.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Seed default badges
            // CreatedAt phải là giá trị tĩnh (không dùng DateTime.UtcNow) để tránh PendingModelChangesWarning
            var badgeSeedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            modelBuilder.Entity<Badge>().HasData(
                new Badge { Id = 1,  Name = "Người mới",       Description = "Chào mừng bạn đến với mạng xã hội!", Icon = "🌱",  Color = "#22c55e", ConditionType = "DaysActive",      ConditionValue = 1,    CreatedAt = badgeSeedDate },
                new Badge { Id = 2,  Name = "Blogger",          Description = "Đăng bài viết đầu tiên",            Icon = "📝",  Color = "#3b82f6", ConditionType = "PostCount",        ConditionValue = 1,    CreatedAt = badgeSeedDate },
                new Badge { Id = 3,  Name = "Nhà văn",          Description = "Đăng 10 bài viết",                  Icon = "✍️", Color = "#6366f1", ConditionType = "PostCount",        ConditionValue = 10,   CreatedAt = badgeSeedDate },
                new Badge { Id = 4,  Name = "Blogger kỳ cựu",  Description = "Đăng 50 bài viết",                  Icon = "📚",  Color = "#8b5cf6", ConditionType = "PostCount",        ConditionValue = 50,   CreatedAt = badgeSeedDate },
                new Badge { Id = 5,  Name = "Được yêu thích",  Description = "Nhận 10 lượt thích",                Icon = "💗",  Color = "#ec4899", ConditionType = "LikesReceived",    ConditionValue = 10,   CreatedAt = badgeSeedDate },
                new Badge { Id = 6,  Name = "Ngôi sao",         Description = "Nhận 100 lượt thích",               Icon = "⭐",  Color = "#f59e0b", ConditionType = "LikesReceived",    ConditionValue = 100,  CreatedAt = badgeSeedDate },
                new Badge { Id = 7,  Name = "Influencer",       Description = "Có 50 người theo dõi",              Icon = "👑",  Color = "#f97316", ConditionType = "FollowersCount",   ConditionValue = 50,   CreatedAt = badgeSeedDate },
                new Badge { Id = 8,  Name = "Bình luận viên",  Description = "Đăng 20 bình luận",                 Icon = "💬",  Color = "#14b8a6", ConditionType = "CommentsCount",    ConditionValue = 20,   CreatedAt = badgeSeedDate },
                new Badge { Id = 9,  Name = "Chọc phá",         Description = "Gửi 10 lần chọc",                   Icon = "⚡",  Color = "#eab308", ConditionType = "PokesSent",        ConditionValue = 10,   CreatedAt = badgeSeedDate },
                new Badge { Id = 10, Name = "Kỳ cựu",           Description = "Hoạt động 30 ngày",                 Icon = "🏆",  Color = "#a855f7", ConditionType = "DaysActive",       ConditionValue = 30,   CreatedAt = badgeSeedDate },
                new Badge { Id = 11, Name = "Huyền thoại",      Description = "Hoạt động 365 ngày",                Icon = "🔥",  Color = "#ef4444", ConditionType = "DaysActive",       ConditionValue = 365,  CreatedAt = badgeSeedDate },
                new Badge { Id = 12, Name = "VIP",               Description = "Danh hiệu đặc biệt do Admin cấp",  Icon = "💎",  Color = "#06b6d4", ConditionType = "Manual",           ConditionValue = null, CreatedAt = badgeSeedDate, IsManualOnly = true },
                new Badge { Id = 13, Name = "Moderator",         Description = "Người kiểm duyệt nội dung",         Icon = "🛡️", Color = "#64748b", ConditionType = "Manual",           ConditionValue = null, CreatedAt = badgeSeedDate, IsManualOnly = true }
            );
        }
    }
}