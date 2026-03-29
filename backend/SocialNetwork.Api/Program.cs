using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using SocialNetwork.Api.Data;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// 1. Đăng ký PostgreSQL (Entity Framework Core)
builder.Services.AddDbContext<SocialDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("PostgresConnection")));

// 2. Đăng ký MongoDB (Dùng Singleton vì MongoClient quản lý connection pool rất tốt)
builder.Services.AddSingleton<IMongoClient>(sp =>
    new MongoClient(builder.Configuration.GetConnectionString("MongoConnection")));

// 3. Đăng ký Redis (Dùng Singleton để giữ một kết nối duy nhất, tái sử dụng cho Pub/Sub)
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    ConnectionMultiplexer.Connect(builder.Configuration.GetConnectionString("RedisConnection")!));

// ... (Các code mặc định khác của file Program.cs giữ nguyên)
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
// ...