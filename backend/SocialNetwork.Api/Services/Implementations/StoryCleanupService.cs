using SocialNetwork.Api.Services.Interfaces;

namespace SocialNetwork.Api.Services.Implementations;

/// <summary>
/// Background service chạy mỗi 1 giờ để xóa stories đã hết hạn.
/// </summary>
public class StoryCleanupService(IServiceProvider serviceProvider, ILogger<StoryCleanupService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);
    private static readonly TimeSpan ErrorRetryDelay = TimeSpan.FromMinutes(5);
    // Chờ 30 giây sau khi app khởi động trước khi chạy cleanup lần đầu
    // Tránh lỗi khi DB chưa sẵn sàng (migration chưa apply, connection chưa ổn định)
    private static readonly TimeSpan InitialDelay = TimeSpan.FromSeconds(30);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Đợi app khởi động xong
        await Task.Delay(InitialDelay, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            bool success = false;
            try
            {
                using var scope = serviceProvider.CreateScope();
                var storyService = scope.ServiceProvider.GetRequiredService<IStoryService>();
                await storyService.CleanupExpiredAsync();
                logger.LogInformation("Story cleanup completed at {Time}", DateTime.UtcNow);
                success = true;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during story cleanup. Retrying in {Delay} minutes.", ErrorRetryDelay.TotalMinutes);
            }

            // Chờ ngắn hơn khi lỗi để retry sớm hơn (5 phút thay vì 1 giờ)
            await Task.Delay(success ? Interval : ErrorRetryDelay, stoppingToken);
        }
    }
}
