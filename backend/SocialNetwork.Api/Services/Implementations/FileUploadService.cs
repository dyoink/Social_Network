namespace SocialNetwork.Api.Services.Implementations;

using SocialNetwork.Api.Services.Interfaces;

public class FileUploadService(IWebHostEnvironment env) : IFileUploadService
{
    private static readonly HashSet<string> AllowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    private static readonly HashSet<string> AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    private const long MaxBytes = 10 * 1024 * 1024; // 10 MB

    // Magic bytes cho các định dạng ảnh phổ biến
    private static readonly byte[] JpegMagic = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] PngMagic  = [0x89, 0x50, 0x4E, 0x47];
    private static readonly byte[] GifMagic  = [0x47, 0x49, 0x46];
    private static readonly byte[] WebpRiff  = [0x52, 0x49, 0x46, 0x46]; // "RIFF"

    public async Task<string> SaveImageAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new InvalidOperationException("File không hợp lệ.");

        if (file.Length > MaxBytes)
            throw new InvalidOperationException("File vượt quá giới hạn 10 MB.");

        if (!AllowedTypes.Contains(file.ContentType.ToLower()))
            throw new InvalidOperationException("Chỉ chấp nhận ảnh JPEG, PNG, GIF, WebP.");

        // Kiểm tra extension (không tin Content-Type header vì client có thể giả mạo)
        var ext = Path.GetExtension(file.FileName).ToLower();
        if (!AllowedExtensions.Contains(ext))
            throw new InvalidOperationException("Phần mở rộng file không hợp lệ.");

        // Kiểm tra magic bytes để đảm bảo nội dung thực sự là ảnh
        using var checkStream = file.OpenReadStream();
        var header = new byte[12];
        var bytesRead = await checkStream.ReadAsync(header.AsMemory(0, 12));
        if (bytesRead < 4 || !IsValidImageHeader(header))
            throw new InvalidOperationException("Nội dung file không phải ảnh hợp lệ.");

        // Tạo thư mục uploads nếu chưa có
        // Dùng ContentRootPath làm fallback khi wwwroot chưa tồn tại (máy mới chưa có thư mục)
        var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var uploadsDir = Path.Combine(webRoot, "uploads");
        Directory.CreateDirectory(uploadsDir);

        // Tên file ngẫu nhiên để tránh trùng và path traversal
        var fileName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using var stream = File.Create(filePath);
        await file.CopyToAsync(stream);

        return $"/uploads/{fileName}";
    }

    private static bool IsValidImageHeader(byte[] header) =>
        header.AsSpan(0, 3).SequenceEqual(JpegMagic) ||
        header.AsSpan(0, 4).SequenceEqual(PngMagic)  ||
        header.AsSpan(0, 3).SequenceEqual(GifMagic)   ||
        header.AsSpan(0, 4).SequenceEqual(WebpRiff);
}
