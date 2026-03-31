using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.Seed;
using SocialNetwork.Api.Services.Interfaces;

namespace SocialNetwork.Api.Controllers;

[ApiController]
[Route("api/admin/seed")]
[Authorize(Roles = "Admin")]
public class SeedController(ISeedService seedService) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<ApiResponse<SeedResultDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Seed([FromBody] SeedOptionsDto options)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse.Fail("Dữ liệu không hợp lệ."));

        var result = await seedService.SeedAsync(options);
        return Ok(ApiResponse<SeedResultDto>.Ok(result, "Seed thành công."));
    }

    [HttpDelete]
    [ProducesResponseType<ApiResponse<SeedResultDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> ClearSeeded()
    {
        var result = await seedService.ClearSeededDataAsync();
        return Ok(ApiResponse<SeedResultDto>.Ok(result, "Đã xoá toàn bộ dữ liệu seed."));
    }

    [HttpGet("status")]
    [ProducesResponseType<ApiResponse<SeedStatusDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatus()
    {
        var status = await seedService.GetSeedStatusAsync();
        return Ok(ApiResponse<SeedStatusDto>.Ok(status));
    }
}
