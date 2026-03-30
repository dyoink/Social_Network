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
    [ProducesResponseType<ApiResponse<UploadResultDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadImage(IFormFile file)
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
}

public class UploadResultDto
{
    public string Url { get; set; } = string.Empty;
}
