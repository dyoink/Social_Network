using Microsoft.EntityFrameworkCore;
using SocialNetwork.Api.Data;
using SocialNetwork.Api.DTOs.Admin;
using SocialNetwork.Api.Entities;
using SocialNetwork.Api.Services.Interfaces;

namespace SocialNetwork.Api.Services.Implementations;

public class ReportService(SocialDbContext db) : IReportService
{
    public async Task CreateReportAsync(int reporterId, CreateReportDto dto)
    {
        if (dto.TargetUserId == null && dto.TargetPostId == null)
            throw new InvalidOperationException("Phải chỉ định TargetUserId hoặc TargetPostId.");

        // Không cho phép tự report chính mình
        if (dto.TargetUserId.HasValue && dto.TargetUserId.Value == reporterId)
            throw new InvalidOperationException("Không thể báo cáo chính mình.");

        // Kiểm tra target tồn tại
        if (dto.TargetUserId.HasValue)
        {
            var userExists = await db.Users.AnyAsync(u => u.Id == dto.TargetUserId.Value);
            if (!userExists) throw new KeyNotFoundException("Không tìm thấy người dùng được báo cáo.");
        }

        if (dto.TargetPostId.HasValue)
        {
            var postExists = await db.Posts.AnyAsync(p => p.Id == dto.TargetPostId.Value);
            if (!postExists) throw new KeyNotFoundException("Không tìm thấy bài viết được báo cáo.");
        }

        // Ngăn report trùng lặp (cùng reporter, cùng target, cùng đang Pending)
        var duplicate = await db.Reports.AnyAsync(r =>
            r.ReporterId == reporterId &&
            r.TargetUserId == dto.TargetUserId &&
            r.TargetPostId == dto.TargetPostId &&
            r.Status == "Pending");
        if (duplicate)
            throw new InvalidOperationException("Bạn đã báo cáo mục này rồi.");

        var report = new Report
        {
            ReporterId   = reporterId,
            TargetUserId = dto.TargetUserId,
            TargetPostId = dto.TargetPostId,
            Reason       = dto.Reason,
            Detail       = dto.Detail,
            Status       = "Pending",
            CreatedAt    = DateTime.UtcNow,
        };

        db.Reports.Add(report);
        await db.SaveChangesAsync();
    }
}
