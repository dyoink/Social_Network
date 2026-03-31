using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SocialNetwork.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBadgeSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Badges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Icon = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Color = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    ConditionType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ConditionValue = table.Column<int>(type: "integer", nullable: true),
                    IsManualOnly = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Badges", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserBadges",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    BadgeId = table.Column<int>(type: "integer", nullable: false),
                    EarnedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDisplayed = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBadges", x => new { x.UserId, x.BadgeId });
                    table.ForeignKey(
                        name: "FK_UserBadges_Badges_BadgeId",
                        column: x => x.BadgeId,
                        principalTable: "Badges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserBadges_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Badges",
                columns: new[] { "Id", "Color", "ConditionType", "ConditionValue", "CreatedAt", "Description", "Icon", "IsManualOnly", "Name" },
                values: new object[,]
                {
                    { 1, "#22c55e", "DaysActive", 1, new DateTime(2026, 3, 31, 4, 23, 48, 2, DateTimeKind.Utc).AddTicks(8678), "Chào mừng bạn đến với mạng xã hội!", "🌱", false, "Người mới" },
                    { 2, "#3b82f6", "PostCount", 1, new DateTime(2026, 3, 31, 4, 23, 48, 3, DateTimeKind.Utc).AddTicks(304), "Đăng bài viết đầu tiên", "📝", false, "Blogger" },
                    { 3, "#6366f1", "PostCount", 10, new DateTime(2026, 3, 31, 4, 23, 48, 3, DateTimeKind.Utc).AddTicks(307), "Đăng 10 bài viết", "✍️", false, "Nhà văn" },
                    { 4, "#8b5cf6", "PostCount", 50, new DateTime(2026, 3, 31, 4, 23, 48, 3, DateTimeKind.Utc).AddTicks(309), "Đăng 50 bài viết", "📚", false, "Blogger kỳ cựu" },
                    { 5, "#ec4899", "LikesReceived", 10, new DateTime(2026, 3, 31, 4, 23, 48, 3, DateTimeKind.Utc).AddTicks(310), "Nhận 10 lượt thích", "💗", false, "Được yêu thích" },
                    { 6, "#f59e0b", "LikesReceived", 100, new DateTime(2026, 3, 31, 4, 23, 48, 3, DateTimeKind.Utc).AddTicks(311), "Nhận 100 lượt thích", "⭐", false, "Ngôi sao" },
                    { 7, "#f97316", "FollowersCount", 50, new DateTime(2026, 3, 31, 4, 23, 48, 3, DateTimeKind.Utc).AddTicks(313), "Có 50 người theo dõi", "👑", false, "Influencer" },
                    { 8, "#14b8a6", "CommentsCount", 20, new DateTime(2026, 3, 31, 4, 23, 48, 3, DateTimeKind.Utc).AddTicks(314), "Đăng 20 bình luận", "💬", false, "Bình luận viên" },
                    { 9, "#eab308", "PokesSent", 10, new DateTime(2026, 3, 31, 4, 23, 48, 3, DateTimeKind.Utc).AddTicks(316), "Gửi 10 lần chọc", "⚡", false, "Chọc phá" },
                    { 10, "#a855f7", "DaysActive", 30, new DateTime(2026, 3, 31, 4, 23, 48, 3, DateTimeKind.Utc).AddTicks(318), "Hoạt động 30 ngày", "🏆", false, "Kỳ cựu" },
                    { 11, "#ef4444", "DaysActive", 365, new DateTime(2026, 3, 31, 4, 23, 48, 3, DateTimeKind.Utc).AddTicks(319), "Hoạt động 365 ngày", "🔥", false, "Huyền thoại" },
                    { 12, "#06b6d4", "Manual", null, new DateTime(2026, 3, 31, 4, 23, 48, 3, DateTimeKind.Utc).AddTicks(322), "Danh hiệu đặc biệt do Admin cấp", "💎", true, "VIP" },
                    { 13, "#64748b", "Manual", null, new DateTime(2026, 3, 31, 4, 23, 48, 3, DateTimeKind.Utc).AddTicks(506), "Người kiểm duyệt nội dung", "🛡️", true, "Moderator" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserBadges_BadgeId",
                table: "UserBadges",
                column: "BadgeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserBadges");

            migrationBuilder.DropTable(
                name: "Badges");
        }
    }
}
