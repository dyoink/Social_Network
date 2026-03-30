namespace SocialNetwork.Api.Services.Interfaces;

public interface IFileUploadService
{
    /// <summary>
    /// Lưu file ảnh vào wwwroot/uploads, trả về URL tương đối.
    /// Ném InvalidOperationException nếu file không hợp lệ.
    /// </summary>
    Task<string> SaveImageAsync(IFormFile file);
}
