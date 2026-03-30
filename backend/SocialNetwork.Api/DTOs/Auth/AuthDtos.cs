using System;
using System.ComponentModel.DataAnnotations;

namespace SocialNetwork.Api.DTOs.Auth
{
    public class RegisterDto
    {
        [Required, StringLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required, EmailAddress, StringLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(6), StringLength(128)]
        public string Password { get; set; } = string.Empty;

        [StringLength(100)]
        public string? FullName { get; set; }

        public DateTime? DateOfBirth { get; set; }
    }

    public class LoginDto
    {
        [Required]
        public string EmailOrUsername { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public SocialNetwork.Api.DTOs.User.UserDto User { get; set; } = null!;
    }
}
