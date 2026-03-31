namespace SocialNetwork.Api.Services.Interfaces;

public interface IFileUploadService
{
    /// <summary>
    /// Lưu file ảnh vào wwwroot/uploads, trả về URL tương đối.
    /// Ném InvalidOperationException nếu file không hợp lệ.
    /// </summary>
    Task<string> SaveImageAsync(IFormFile file);

    /// <summary>
    /// Lưu file video vào wwwroot/videos, trả về URL tương đối.
    /// Max 50MB, chỉ mp4/webm.
    /// </summary>
    Task<string> SaveVideoAsync(IFormFile file);
}
