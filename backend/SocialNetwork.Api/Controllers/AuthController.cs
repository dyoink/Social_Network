using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialNetwork.Api.Common;
using SocialNetwork.Api.DTOs.Auth;
using SocialNetwork.Api.DTOs.User;
using SocialNetwork.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialNetwork.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        // Lấy userId từ JWT claim — dùng trong [Authorize] endpoints
        private int CurrentUserId =>
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>Đăng ký tài khoản mới</summary>
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterDto dto)
        {
            try
            {
                var result = await _authService.RegisterAsync(dto);
                return StatusCode(201, ApiResponse<AuthResponseDto>.Ok(result, "Đăng ký thành công!"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<AuthResponseDto>.Fail(ex.Message));
            }
        }

        /// <summary>Đăng nhập, nhận JWT token</summary>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginDto dto)
        {
            try
            {
                var result = await _authService.LoginAsync(dto);
                return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Đăng nhập thành công!"));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ApiResponse<AuthResponseDto>.Fail(ex.Message));
            }
        }

        /// <summary>Lấy thông tin user đang đăng nhập</summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<UserDto>>> Me()
        {
            try
            {
                var user = await _authService.GetCurrentUserAsync(CurrentUserId);
                return Ok(ApiResponse<UserDto>.Ok(user));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<UserDto>.Fail(ex.Message));
            }
        }
    }
}
