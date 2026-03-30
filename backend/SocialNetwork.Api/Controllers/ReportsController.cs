using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.Admin;
using SocialNetwork.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialNetwork.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController(IReportService reportService) : ControllerBase
{
    /// <summary>
    /// User thường gửi báo cáo vi phạm (bài viết hoặc tài khoản).
    /// </summary>
    [HttpPost]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateReport([FromBody] CreateReportDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse.Fail("Dữ liệu không hợp lệ."));

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        try
        {
            await reportService.CreateReportAsync(userId, dto);
            return StatusCode(StatusCodes.Status201Created, ApiResponse.Ok("Báo cáo đã được gửi. Cảm ơn bạn!"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse.Fail(ex.Message));
        }
    }
}
