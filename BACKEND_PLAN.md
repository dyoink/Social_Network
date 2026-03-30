# 🏗️ BACKEND DEVELOPMENT PLAN — Social Network API

> **Tech Stack:** ASP.NET Core (.NET 10) · PostgreSQL (EF Core) · JWT Auth  
> **Architecture:** Controller → Service (Interface/Impl) → DbContext  
> **Tình trạng:** Entities + DTOs + DbContext + Migrations hoàn thiện. **Chưa có Controller, Service, Auth.**

---

## 📊 Phân tích hiện trạng

### ✅ Đã hoàn thành
| Hạng mục | Chi tiết |
|---|---|
| **Entities** | User, Post, Comment, PostLike, Follow, Conversation, ConversationParticipant, Message, Notification |
| **DTOs** | Auth, Post, User, Comment, Message, Notification |
| **DbContext** | Cấu hình đầy đủ relationships (Many-to-Many, Self-Referencing, Cascade) |
| **Migrations** | `InitialCreate` + `UpdateUser` — schema PostgreSQL sẵn sàng |
| **Infrastructure** | Docker Compose: PostgreSQL |
| **Packages** | EF Core, Npgsql, Swashbuckle |

### ❌ Chưa có / Còn thiếu
- Không có một **Controller** nào
- Không có **Service Layer** (business logic)
- Không có **JWT Authentication**
- Không có **CORS** configuration
- Không có **file upload** (ảnh post, avatar)
- Không có **Middleware** (exception handling)
- Không có **Pagination** cho posts, comments
- Không có **Input Validation**

### 🗑️ Loại bỏ khỏi scope (keep it simple)
- ~~MongoDB~~ — PostgreSQL đủ cho dự án cá nhân này
- ~~Redis~~ — không cần cache/pub-sub ở giai đoạn này
- ~~SignalR~~ — implement sau nếu cần real-time (dễ thêm vào sau)

---

## 🗺️ Lộ trình thực hiện

### 📦 Phase 1 — Foundation: Cấu hình & Authentication

#### 1.1 Dọn dẹp packages — Chỉ giữ những gì cần thiết

```xml
<!-- SocialNetwork.Api.csproj -- xóa MongoDB, Redis -->
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="10.0.*" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.0.*" />
<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.0.*" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="10.*" />
<!-- Thêm mới -->
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="10.0.*" />
<PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
```

#### 1.2 Cấu trúc thư mục chuẩn

```
SocialNetwork.Api/
├── Controllers/
│   ├── AuthController.cs
│   ├── UsersController.cs
│   ├── PostsController.cs
│   ├── CommentsController.cs
│   ├── MessagesController.cs
│   └── NotificationsController.cs
├── Services/
│   ├── Interfaces/
│   │   ├── IAuthService.cs
│   │   ├── IPostService.cs
│   │   ├── IUserService.cs
│   │   ├── ICommentService.cs
│   │   ├── IMessageService.cs
│   │   └── INotificationService.cs
│   └── Implementations/
│       ├── AuthService.cs
│       ├── PostService.cs
│       ├── UserService.cs
│       ├── CommentService.cs
│       ├── MessageService.cs
│       └── NotificationService.cs
├── Middleware/
│   └── GlobalExceptionMiddleware.cs
├── Helpers/
│   └── JwtHelper.cs
├── Extensions/
│   └── ServiceCollectionExtensions.cs  ← đăng ký DI gọn
├── Data/
│   └── SocialDbContext.cs
├── Entities/
├── DTOs/
├── Migrations/
└── Properties/
```

#### 1.3 `Program.cs` hoàn chỉnh

```csharp
var builder = WebApplication.CreateBuilder(args);

// PostgreSQL only
builder.Services.AddDbContext<SocialDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Auth
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* config từ appsettings */ });

// CORS cho frontend dev
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()));

// Đăng ký Services
builder.Services.AddApplicationServices(); // extension method

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

#### 1.4 AuthController — Endpoint ưu tiên số 1

```
POST /api/auth/register   → Đăng ký tài khoản
POST /api/auth/login      → Đăng nhập, nhận JWT
GET  /api/auth/me         → Lấy thông tin user đang đăng nhập [Authorize]
```

**Logic `AuthService`:**
1. `Register`: Hash password bằng **BCrypt**, lưu User vào PostgreSQL, trả JWT
2. `Login`: Tìm user bằng email/username, verify BCrypt, tạo JWT (7 ngày cho project cá nhân)
3. JWT payload: `{ userId, username, role }`

**Lưu ý bảo mật:**
- Chỉ dùng **BCrypt** cho password — không MD5/SHA1
- Validate tất cả input với Data Annotations
- Luôn check ownership trước khi sửa/xóa resource

---

### 📦 Phase 2 — Core CRUD APIs

#### 2.1 PostsController

| Method | Route | Mô tả | Auth |
|---|---|---|---|
| GET | `/api/posts/feed` | Newsfeed (posts của người đang follow + bản thân) | ✅ |
| GET | `/api/posts/{id}` | Chi tiết một post | ✅ |
| POST | `/api/posts` | Tạo post mới | ✅ |
| PUT | `/api/posts/{id}` | Sửa post | ✅ (chủ bài) |
| DELETE | `/api/posts/{id}` | Xóa post | ✅ (chủ bài) |
| POST | `/api/posts/{id}/like` | Toggle like/unlike | ✅ |
| GET | `/api/users/{userId}/posts` | Lấy posts của một user | ✅ |

**Pagination cho mọi list endpoint:**
```csharp
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage => Page * PageSize < TotalCount;
}
// GET /api/posts/feed?page=1&pageSize=10
```

#### 2.2 UsersController

| Method | Route | Mô tả | Auth |
|---|---|---|---|
| GET | `/api/users/{id}` | Xem profile của user | ✅ |
| PUT | `/api/users/me` | Cập nhật profile bản thân | ✅ |
| GET | `/api/users/search?q=` | Tìm kiếm user theo tên/username | ✅ |
| POST | `/api/users/{id}/follow` | Toggle follow/unfollow | ✅ |
| GET | `/api/users/{id}/followers` | Danh sách followers | ✅ |
| GET | `/api/users/{id}/following` | Danh sách following | ✅ |

#### 2.3 CommentsController

| Method | Route | Mô tả | Auth |
|---|---|---|---|
| GET | `/api/posts/{postId}/comments` | Lấy comments (pagination) | ✅ |
| POST | `/api/posts/{postId}/comments` | Tạo comment / reply | ✅ |
| DELETE | `/api/comments/{id}` | Xóa comment | ✅ (chủ comment) |

#### 2.4 NotificationsController

| Method | Route | Mô tả | Auth |
|---|---|---|---|
| GET | `/api/notifications` | Danh sách notification | ✅ |
| PUT | `/api/notifications/{id}/read` | Đánh dấu đã đọc | ✅ |
| PUT | `/api/notifications/read-all` | Đánh dấu tất cả đã đọc | ✅ |

#### 2.5 MessagesController

| Method | Route | Mô tả | Auth |
|---|---|---|---|
| GET | `/api/conversations` | Danh sách cuộc trò chuyện | ✅ |
| POST | `/api/conversations` | Tạo conversation với user khác | ✅ |
| GET | `/api/conversations/{id}/messages` | Lịch sử tin nhắn | ✅ |
| POST | `/api/conversations/{id}/messages` | Gửi tin nhắn | ✅ |

---

### 📦 Phase 3 — File Upload (Avatar, Cover, Post Image)

**Lưu file local** (đủ cho dự án cá nhân, dễ nâng lên cloud sau):

```
POST /api/upload/image
  - Body: multipart/form-data (field: "file")
  - Validate: max 10MB, chỉ image/jpeg, image/png, image/webp
  - Lưu vào: wwwroot/uploads/{userId}/{guid}.jpg
  - Trả về: { url: "/uploads/{userId}/{guid}.jpg" }
```

**Cấu hình static files trong Program.cs:**
```csharp
app.UseStaticFiles(); // serve wwwroot tự động
```

**Nâng cấp lên cloud sau:** Chỉ cần thay implementation của `IUploadService` từ local sang Cloudinary/S3 mà không đụng Controller.

---

### 📦 Phase 4 — Polish & Production Ready

#### 4.1 Global Exception Middleware

```csharp
public class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(
                new ApiResponse { Success = false, Message = "Có lỗi xảy ra" });
        }
    }
}
```

#### 4.2 Chuẩn hoá API Response

```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
    
    public static ApiResponse<T> Ok(T data, string? msg = null) =>
        new() { Success = true, Data = data, Message = msg };
    
    public static ApiResponse<T> Fail(string msg) =>
        new() { Success = false, Message = msg };
}
```

#### 4.3 Những thứ cần sửa ngay trong code hiện tại

**`Program.cs`** — Đang có placeholder comment, cần viết đầy đủ.

**`appsettings.json`** — Đang lộ credentials. Dùng `dotnet user-secrets` khi dev:
```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;..."
dotnet user-secrets set "Jwt:SecretKey" "your-very-long-secret-key"
```

**Xóa packages không dùng:**
```bash
dotnet remove package MongoDB.Driver
dotnet remove package StackExchange.Redis
```

#### 4.4 Mở rộng trong tương lai (không làm ngay)

| Tính năng | Cách thêm |
|---|---|
| Real-time messaging | Thêm `Microsoft.AspNetCore.SignalR`, tạo `ChatHub.cs` |
| Cache | Thêm `IMemoryCache` (in-process) hoặc Redis sau |
| Email verification | Thêm `IEmailService` với SMTP/SendGrid |
| Refresh token | Thêm `refresh_tokens` table trong PostgreSQL |
| Upload cloud | Thay `LocalUploadService` bằng `CloudinaryUploadService` |

---

## 📋 Checklist triển khai

> **Trạng thái hiện tại (30/03/2026): Tất cả backend đã hoàn thành.**

### Phase 1 — Foundation ✅ XONG
- [x] Xóa packages MongoDB.Driver và StackExchange.Redis khỏi `.csproj`
- [x] Cài `Microsoft.AspNetCore.Authentication.JwtBearer` + `BCrypt.Net-Next`
- [x] Viết `Program.cs` đầy đủ (CORS, Auth, Middleware, Static Files)
- [x] Chuyển credentials sang `dotnet user-secrets`
- [x] Viết `GlobalExceptionMiddleware.cs`
- [x] Viết `ApiResponse<T>` wrapper class
- [x] Viết `PagedResult<T>` class
- [x] Viết `JwtHelper.cs`
- [x] Viết `ServiceCollectionExtensions.cs` (đăng ký tất cả services)

### Phase 2 — Auth ✅ XONG
- [x] Viết `IAuthService` interface
- [x] Viết `AuthService.cs` (Register/Login, hash BCrypt, tạo JWT)
- [x] Viết `AuthController.cs` (Register, Login, Me)

### Phase 3 — CRUD APIs ✅ XONG
- [x] `IPostService` + `PostService` + `PostsController`
- [x] `IUserService` + `UserService` + `UsersController`
- [x] `ICommentService` + `CommentService` + `CommentsController`
- [x] `INotificationService` + `NotificationService` + `NotificationsController`
- [x] `IMessageService` + `MessageService` + `MessagesController`
- [x] Auto-tạo Notification khi: like post, comment post, follow user

### Phase 4 — File Upload ✅ XONG
- [x] Viết `IFileUploadService` interface + `FileUploadService` implementation
- [x] `UploadController` (POST `/api/upload/image`)
- [x] Validate file type/size (max 10MB, chỉ image/*)
- [x] Cấu hình `app.UseStaticFiles()`

### Phase 5 — Admin Panel ✅ XONG
- [x] `User.IsActive` field + migration `AddIsActiveAndReports`
- [x] `Report` entity + `reports` table + migration
- [x] `IAdminService` + `AdminService` (stats, user mgmt, post mgmt, reports)
- [x] `IReportService` + `ReportService` (user submit report)
- [x] `AdminController` (`[Authorize(Roles="Admin")]`) — 9 endpoints
- [x] `ReportsController` — POST `/api/reports`

### Còn thiếu / Cần thêm sau
- [x] `PUT /api/users/me/password` — đổi mật khẩu ✅ (30/03/2026)
- [x] `GET /api/posts/search?q=` — tìm kiếm bài viết ✅ (30/03/2026)
- [x] Health check endpoint (`/health`) ✅ (30/03/2026)
- [x] Đồng bộ `database.sql` — thêm reports table + is_active column ✅
- [x] Đồng bộ `DATABASE_SUMMARY.txt` — thêm Report entity ✅

---

## ⚡ Thứ tự ưu tiên hiện tại (tech debt)

```
Tất cả backend endpoints đã hoàn thành.

Tương lai:
1. PUT /api/posts/{id}/bookmark — bookmarks feature (thêm bảng + endpoint)
2. PUT /api/users/me/email — đổi email
3. [Tương lai] Real-time messaging với SignalR
4. [Tương lai] Cloudinary upload thay Local
```
