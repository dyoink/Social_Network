using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.Services.Interfaces;

namespace SocialNetwork.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UploadController(IFileUploadService uploadService) : ControllerBase
{
    /// <summary>
    /// Upload ảnh. Trả về URL tương đối có thể dùng làm avatar hoặc ảnh bài viết.
    /// </summary>
    [HttpPost("image")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType<ApiResponse<UploadResultDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
    {
        try
        {
            var url = await uploadService.SaveImageAsync(file);
            return Ok(ApiResponse<UploadResultDto>.Ok(new UploadResultDto { Url = url }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Upload video. Trả về URL tương đối. Max 50MB, mp4/webm only.
    /// </summary>
    [HttpPost("video")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    [ProducesResponseType<ApiResponse<UploadResultDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadVideo([FromForm] IFormFile file)
    {
        try
        {
            var url = await uploadService.SaveVideoAsync(file);
            return Ok(ApiResponse<UploadResultDto>.Ok(new UploadResultDto { Url = url }));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse.Fail(ex.Message));
        }
    }
}

public class UploadResultDto
{
    public string Url { get; set; } = string.Empty;
}
