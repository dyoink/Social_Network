using SocialNetwork.Api.DTOs.Seed;

namespace SocialNetwork.Api.Services.Interfaces;

public interface ISeedService
{
    Task<SeedResultDto> SeedAsync(SeedOptionsDto options);
    Task<SeedResultDto> ClearSeededDataAsync();
    Task<SeedStatusDto> GetSeedStatusAsync();
}
