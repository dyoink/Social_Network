using SocialNetwork.Api.DTOs.Admin;

namespace SocialNetwork.Api.Services.Interfaces;

public interface IReportService
{
    Task CreateReportAsync(int reporterId, CreateReportDto dto);
}
