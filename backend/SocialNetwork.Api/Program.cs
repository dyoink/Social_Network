using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SocialNetwork.Api.Data;
using SocialNetwork.Api.Extensions;
using SocialNetwork.Api.Hubs;
using SocialNetwork.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

// ─── Database ─────────────────────────────────────────────────────────────
builder.Services.AddDbContext<SocialDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ─── Authentication (JWT) ─────────────────────────────────────────────────
builder.Services.AddJwtAuthentication(builder.Configuration);

// ─── CORS — cho phép frontend dev (AllowCredentials cần cho SignalR WebSocket) ─
var frontendUrl = builder.Configuration["Frontend:Url"] ?? "http://localhost:3000";
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(frontendUrl)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()));

// ─── SignalR ──────────────────────────────────────────────────────────────
builder.Services.AddSignalR();

// ─── Application Services ─────────────────────────────────────────────────
builder.Services.AddApplicationServices();

// ─── Server Metrics (singleton) ──────────────────────────────────────────
builder.Services.AddSingleton<ServerMetricsService>();

// ─── Health Checks ───────────────────────────────────────────────────────
builder.Services.AddHealthChecks();

// ─── MVC + OpenAPI (Scalar UI) ───────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// ─── Build App ────────────────────────────────────────────────────────────
var app = builder.Build();

// Global exception handler — phải đặt đầu tiên trong pipeline
app.UseMiddleware<GlobalExceptionMiddleware>();

// Request metrics tracking
app.UseMiddleware<RequestMetricsMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();                              // /openapi/v1.json
    app.MapScalarApiReference(opts =>             // /scalar/v1
    {
        opts.Title = "Social Network API";
        opts.DefaultHttpClient = new(ScalarTarget.Http, ScalarClient.Http11);
    });
}

// Tạo wwwroot/uploads tự động nếu chưa có (cần khi chạy lần đầu trên máy mới)
var wwwrootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(wwwrootPath, "uploads"));
Directory.CreateDirectory(Path.Combine(wwwrootPath, "videos"));

// Static files: phục vụ ảnh upload và landing page từ wwwroot
app.UseDefaultFiles(); // Serve index.html tại /
app.UseStaticFiles();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

// ─── SignalR Hub endpoints ────────────────────────────────────────────────
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<PokeHub>("/hubs/poke");

app.Run();