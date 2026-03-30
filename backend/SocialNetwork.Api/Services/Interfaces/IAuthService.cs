using SocialNetwork.Api.DTOs.Auth;
using SocialNetwork.Api.DTOs.User;

namespace SocialNetwork.Api.Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
        Task<UserDto> GetCurrentUserAsync(int userId);
    }
}
