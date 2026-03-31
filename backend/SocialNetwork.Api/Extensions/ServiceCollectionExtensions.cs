using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SocialNetwork.Api.Helpers;
using SocialNetwork.Api.Services.Implementations;
using SocialNetwork.Api.Services.Interfaces;
using System.Text;
namespace SocialNetwork.Api.Extensions
{
    public static class ServiceCollectionExtensions
    {
        /// <summary>
        /// Đăng ký tất cả Application Services vào DI container.
        /// Khi thêm Service mới, thêm vào đây thay vì Program.cs.
        /// </summary>
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IPostService, PostService>();
            services.AddScoped<ICommentService, CommentService>();
            services.AddScoped<IMessageService, MessageService>();
            services.AddScoped<INotificationService, NotificationService>();
            services.AddScoped<IFileUploadService, FileUploadService>();
            services.AddScoped<IAdminService, AdminService>();
            services.AddScoped<IReportService, ReportService>();
            services.AddScoped<IBadgeService, BadgeService>();
            services.AddScoped<IStoryService, StoryService>();
            services.AddScoped<ISeedService, SeedService>();
            services.AddHostedService<StoryCleanupService>();
            return services;
        }

        /// <summary>
        /// Cấu hình JWT Authentication.
        /// </summary>
        public static IServiceCollection AddJwtAuthentication(
            this IServiceCollection services,
            IConfiguration config)
        {
            var secretKey = config["Jwt:SecretKey"]
                ?? throw new InvalidOperationException(
                    "Jwt:SecretKey chưa được cấu hình. Chạy: dotnet user-secrets set \"Jwt:SecretKey\" \"<key>\"");

            // JwtHelper dùng singleton vì không có state
            services.AddSingleton<JwtHelper>();

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = config["Jwt:Issuer"],
                        ValidAudience = config["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(secretKey)),
                        // Token hết hạn đúng giờ, không có grace period
                        ClockSkew = TimeSpan.Zero
                    };

                    // SignalR gửi token qua query string ?access_token=...
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["access_token"];
                            var path = context.HttpContext.Request.Path;
                            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                            {
                                context.Token = accessToken;
                            }
                            return Task.CompletedTask;
                        }
                    };
                });

            return services;
        }
    }
}
