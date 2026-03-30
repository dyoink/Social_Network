# 🗺️ PLAN — Social Network App

> **Cập nhật lần cuối:** 30/03/2026 — Phase 0–12 HOÀN THÀNH. Bao gồm: backend API mới (password change, post search, health check) + UX improvements (infinite scroll, toast, skeleton, error boundary).  
> **Stack:** ASP.NET Core .NET 10 · PostgreSQL · EF Core · React 19 · TypeScript · TailwindCSS v4 · Zustand · Axios · Orval  
> **Quy ước:** ✅ Xong hoàn toàn · 🔄 Đang làm · ⬜ Chưa làm · ❌ Bỏ khỏi scope

---

## 📁 Cấu trúc dự án

```
Social_Network/
├── backend/SocialNetwork.Api/          ← ASP.NET Core API
├── frontend/                           ← React + Vite
├── New folder/docker-compose.yml       ← PostgreSQL container
├── database/database.sql               ← Schema reference
└── PLAN.md                             ← File này
```

---

## 🔧 PHASE 0 — Hạ tầng & Cấu hình

| # | Hạng mục | Chi tiết | Trạng thái |
|---|---|---|---|
| 0.1 | Docker Compose | PostgreSQL only, healthcheck, volume | ✅ |
| 0.2 | database.sql | Schema đầy đủ, TIMESTAMPTZ, indexes | ✅ (đã đồng bộ reports + is_active) |
| 0.3 | DATABASE_SUMMARY.txt | Mô tả kỹ thuật các bảng, cột, quan hệ | ✅ (đã đồng bộ 10 bảng) |
| 0.4 | Dọn csproj | Bỏ MongoDB.Driver, StackExchange.Redis | ✅ |
| 0.5 | Thêm packages | BCrypt.Net-Next, JwtBearer, Scalar, ApiDescription.Server | ✅ |
| 0.6 | appsettings.json | Xóa credentials, dùng user-secrets | ✅ |
| 0.7 | dotnet user-secrets | DefaultConnection, Jwt:SecretKey/Issuer/Audience | ✅ |
| 0.8 | Rule files | copilot-instructions.md, backend/.instructions.md, frontend/.instructions.md | ✅ |

---

## 🔐 PHASE 1 — Backend: Auth Foundation

| # | Hạng mục | Chi tiết | Trạng thái |
|---|---|---|---|
| 1.1 | `Common/ApiResponse.cs` | Generic + non-generic response wrapper | ✅ |
| 1.2 | `Common/PagedResult.cs` | Paged list wrapper (`items`, `totalCount`, `hasNextPage`) | ✅ |
| 1.3 | `Helpers/JwtHelper.cs` | Sinh JWT từ User entity, claims: id/username/email/role | ✅ |
| 1.4 | `Middleware/GlobalExceptionMiddleware.cs` | Bắt tất cả exception, trả ApiResponse 500 | ✅ |
| 1.5 | `Services/Interfaces/IAuthService.cs` | Register, Login, GetCurrentUser | ✅ |
| 1.6 | `Services/Implementations/AuthService.cs` | BCrypt hash, user enumeration prevention, EF Core | ✅ |
| 1.7 | `Controllers/AuthController.cs` | POST /register (201), POST /login, GET /me | ✅ |
| 1.8 | `Extensions/ServiceCollectionExtensions.cs` | DI registration, JWT Bearer config | ✅ |
| 1.9 | `Program.cs` | Pipeline hoàn chỉnh, CORS, Scalar UI | ✅ |

---

## 🔗 PHASE 2 — API Contract: OpenAPI → TypeScript

| # | Hạng mục | Chi tiết | Trạng thái |
|---|---|---|---|
| 2.1 | `Microsoft.Extensions.ApiDescription.Server` | Sinh `SocialNetwork.Api.json` lúc `dotnet build` | ✅ |
| 2.2 | `orval` (devDependency) | Code generator từ OpenAPI spec | ✅ |
| 2.3 | `orval.config.ts` | Input: SocialNetwork.Api.json → Output: src/api/api-generated.ts | ✅ |
| 2.4 | `src/api/mutator.ts` | Bọc axios instance cho orval dùng | ✅ |
| 2.5 | `src/api/api-generated.ts` | **Auto-generated** — types + functions cho tất cả endpoints | ✅ |
| 2.6 | script `generate:api` | `npm run generate:api` → tái sinh khi backend thay đổi | ✅ |

> **Lưu ý quan trọng:** Mỗi khi thêm endpoint backend mới:
> 1. `dotnet build` (trong backend/) → cập nhật SocialNetwork.Api.json
> 2. `npm run generate:api` (trong frontend/) → cập nhật api-generated.ts
> 3. **KHÔNG** sửa tay `api-generated.ts`

---

## 🛡️ PHASE 3 — Frontend: Auth Layer

| # | Hạng mục | Chi tiết | Trạng thái |
|---|---|---|---|
| 3.1 | `src/api/axios.ts` | Axios instance, JWT interceptor, 401→logout | ✅ |
| 3.2 | `src/store/authStore.ts` | Zustand + persist, actions: setAuth/updateUser/logout | ✅ |
| 3.3 | `src/vite-env.d.ts` | Khai báo type `VITE_API_URL` | ✅ |
| 3.4 | `frontend/.env` | `VITE_API_URL=http://localhost:5204/api` | ✅ |
| 3.5 | `src/types/api.types.ts` | Re-export từ generated + Post/Comment/Message/Notification types | ✅ |
| 3.6 | `AuthView.tsx` | Form login/register connect với authStore | ✅ |

---

## 👤 PHASE 4 — Backend: User & Profile APIs

| # | Hạng mục | Chi tiết | Trạng thái |
|---|---|---|---|
| 4.1 | `IUserService.cs` | GetProfile, UpdateProfile, Follow, Unfollow, Search, Suggestions | ✅ |
| 4.2 | `UserService.cs` | Implement, đếm followers/following/posts | ✅ |
| 4.3 | `UsersController.cs` | GET /users/{username}, PUT /users/me, POST /users/{id}/follow | ✅ |
| 4.4 | Regenerate `api-generated.ts` | `dotnet build` + `npm run generate:api` | ✅ |
| 4.5 | `ProfileView.tsx` | Kết nối API thật, bỏ mock data | ✅ |

**Endpoints cần implement:**
```
GET    /api/users/{username}          → profile public
PUT    /api/users/me                  → update profile (Authorize)
POST   /api/users/{id}/follow         → follow/unfollow toggle (Authorize)
GET    /api/users/{id}/followers      → danh sách followers (paged)
GET    /api/users/{id}/following      → danh sách following (paged)
GET    /api/users/search?q=           → tìm kiếm user
GET    /api/users/suggestions         → gợi ý follow (Authorize)
```

---

## 📝 PHASE 5 — Backend: Posts APIs

| # | Hạng mục | Chi tiết | Trạng thái |
|---|---|---|---|
| 5.1 | `IPostService.cs` | GetFeed, GetUserPosts, Create, Update, Delete, Like | ✅ |
| 5.2 | `PostService.cs` | Implement, pagination, isLiked per user, notification khi like | ✅ |
| 5.3 | `PostsController.cs` | CRUD + Like endpoints | ✅ |
| 5.4 | Regenerate `api-generated.ts` | ✅ |
| 5.5 | `NewsfeedView.tsx` | Kết nối API, infinite scroll | ✅ |

**Endpoints cần implement:**
```
GET    /api/posts/feed                → newsfeed (paged, Authorize)
GET    /api/posts/user/{userId}       → posts của user (paged)
POST   /api/posts                     → tạo bài (Authorize)
PUT    /api/posts/{id}                → sửa bài (Authorize, chủ sở hữu)
DELETE /api/posts/{id}                → xóa bài (Authorize, chủ sở hữu)
POST   /api/posts/{id}/like           → toggle like (Authorize)
```

---

## 💬 PHASE 6 — Backend: Comments APIs

| # | Hạng mục | Chi tiết | Trạng thái |
|---|---|---|---|
| 6.1 | `ICommentService.cs` | GetByPost, GetReplies, Create, Delete | ✅ |
| 6.2 | `CommentService.cs` | Implement, nested comments (ParentId), notification 'comment'/'reply' | ✅ |
| 6.3 | `CommentsController.cs` | ✅ |
| 6.4 | Regenerate + `CommentSidebar.tsx` | ✅ Generate / ✅ Frontend |

**Endpoints cần implement:**
```
GET    /api/posts/{postId}/comments   → danh sách comments (paged)
POST   /api/posts/{postId}/comments   → tạo comment / reply (Authorize)
DELETE /api/comments/{id}             → xóa comment (Authorize, chủ sở hữu)
```

---

## 📨 PHASE 7 — Backend: Messages APIs

| # | Hạng mục | Chi tiết | Trạng thái |
|---|---|---|---|
| 7.1 | `IMessageService.cs` | GetConversations, GetMessages, Send, MarkRead | ✅ |
| 7.2 | `MessageService.cs` | Implement | ✅ |
| 7.3 | `ConversationsController.cs` | REST API, polling (không SignalR ở giai đoạn này) | ✅ |
| 7.4 | Regenerate + `MessengerView.tsx` | ✅ |

**Endpoints cần implement:**
```
GET    /api/conversations             → danh sách conversation (Authorize)
POST   /api/conversations             → tạo/lấy conversation với user
GET    /api/conversations/{id}/messages → lịch sử tin nhắn (paged)
POST   /api/conversations/{id}/messages → gửi tin nhắn (Authorize)
PUT    /api/conversations/{id}/read   → đánh dấu đã đọc (Authorize)
```

---

## 🔔 PHASE 8 — Backend: Notifications APIs

| # | Hạng mục | Chi tiết | Trạng thái |
|---|---|---|---|
| 8.1 | `INotificationService.cs` | GetAll, MarkRead, MarkAllRead, Create (internal) | ✅ |
| 8.2 | `NotificationService.cs` | Implement, tự động tạo khi like/comment/follow | ✅ |
| 8.3 | `NotificationsController.cs` | ✅ |
| 8.4 | Regenerate + `NotificationsView.tsx` | ✅ |

**Endpoints cần implement:**
```
GET    /api/notifications             → danh sách (paged, Authorize)
PUT    /api/notifications/{id}/read   → mark 1 cái đã đọc
PUT    /api/notifications/read-all    → mark tất cả đã đọc
GET    /api/notifications/unread-count → badge số chưa đọc
```

---

## 🖼️ PHASE 9 — Upload ảnh

| # | Hạng mục | Chi tiết | Trạng thái |
|---|---|---|---|
| 9.1 | `FileUploadService.cs` | Lưu ảnh vào `wwwroot/uploads/`, validate type & size (≤10MB) | ✅ |
| 9.2 | `UploadController.cs` | POST /api/upload/image → trả về URL | ✅ |
| 9.3 | Frontend upload component | Input file + preview + progress | ✅ |

---

## 🎨 PHASE 10 — Frontend: Connect toàn bộ views

| # | Hạng mục | Chi tiết | Trạng thái |
|---|---|---|---|
| 10.1 | `AuthView.tsx` | Login/Register form → authStore → redirect | ✅ |
| 10.2 | Router protection | Private route (yêu cầu login), redirect `/auth` nếu chưa đăng nhập | ✅ |
| 10.3 | `NewsfeedView.tsx` | Feed API + load more + refreshKey | ✅ |
| 10.4 | `ProfileView.tsx` | User API + follow/unfollow toggle | ✅ |
| 10.5 | `SearchView.tsx` | Search API + debounce | ✅ |
| 10.6 | `MessengerView.tsx` | Conversation + message API + polling | ✅ |
| 10.7 | `NotificationsView.tsx` | Notification API + badge | ✅ |
| 10.8 | `CreatePostModal.tsx` | Post API → callback → refresh feed | ✅ |
| 10.9 | `CommentSidebar.tsx` | Comment API — load + submit | ✅ |
| 10.10 | `PostCard.tsx` | Like API + optimistic update + rollback | ✅ |
| 10.11 | `Sidebar.tsx` | User info từ authStore | ✅ |
| 10.12 | `RightSidebar.tsx` | Suggestions API | ✅ |
| 10.13 | `TopNav.tsx` | Unread count badge, logout | ✅ |

---

---

## 🛡️ PHASE 11 — Admin Panel

> **Mục tiêu:** Trang quản trị riêng biệt (`/admin`), chỉ dành cho user có `Role = "Admin"`.  
> Admin có thể xem thống kê, quản lý user, kiểm duyệt bài đăng, xem báo cáo vi phạm.

### 11.A — Backend: Phân quyền & Services

| # | Hạng mục | Chi tiết | Trạng thái |
|---|---|---|---|
| 11.A.1 | `[Authorize(Roles = "Admin")]` | JWT `ClaimTypes.Role` đã có sẵn → dùng policy trực tiếp | ✅ Nền tảng sẵn |
| 11.A.2 | `IAdminService.cs` | Interface: GetStats, GetUsers, GetPosts, BanUser, DeletePost, GetReports | ✅ |
| 11.A.3 | `AdminService.cs` | Implement các truy vấn EF Core | ✅ |
| 11.A.4 | `AdminController.cs` | Route `/api/admin/*`, `[Authorize(Roles="Admin")]` trên cả controller | ✅ |
| 11.A.5 | `Report` Entity + Migration | Bảng `reports` cho user báo cáo nội dung vi phạm | ✅ |
| 11.A.6 | `ReportsController.cs` | POST /api/reports — user gửi báo cáo | ✅ |
| 11.A.7 | Regenerate `api-generated.ts` | `dotnet build` + `npm run generate:api` | ✅ |

**Endpoints cần implement:**
```
// Stats
GET    /api/admin/stats                  → tổng users, posts, comments, reports hôm nay/tổng cộng

// User management
GET    /api/admin/users?q=&page=&role=   → danh sách users (paged, filter theo role)
PUT    /api/admin/users/{id}/ban         → ban/unban user (toggle IsActive)
PUT    /api/admin/users/{id}/role        → đổi role (Member ↔ Admin)
DELETE /api/admin/users/{id}             → xóa vĩnh viễn user

// Post moderation
GET    /api/admin/posts?q=&page=         → tất cả bài viết (paged)
DELETE /api/admin/posts/{id}             → xóa bài vi phạm

// Reports
GET    /api/admin/reports?status=&page=  → danh sách báo cáo (pending/resolved)
PUT    /api/admin/reports/{id}/resolve   → đánh dấu đã xử lý

// User báo cáo
POST   /api/reports                      → gửi báo cáo (Authorize)
```

**Entity `Report`:**
```csharp
public class Report {
    public int Id { get; set; }
    public int ReporterId { get; set; }      // người báo cáo
    public int? TargetUserId { get; set; }   // user bị báo cáo (nullable)
    public int? TargetPostId { get; set; }   // bài bị báo cáo (nullable)
    public string Reason { get; set; }       // "spam"|"hate"|"nude"|"other"
    public string? Detail { get; set; }      // mô tả thêm
    public string Status { get; set; } = "Pending"; // Pending | Resolved
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
```

**Entity `User` — thêm cột `IsActive`:**
```
// Cần migration: ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE
// Admin set IsActive = false để ban user → API endpoint khác từ chối request
```

---

### 11.B — Frontend: Admin SPA riêng biệt

> Admin panel là một **phần tách biệt** trong cùng React app, dùng React Router nested routes.

| # | Hạng mục | Chi tiết | Trạng thái |
|---|---|---|---|
| 11.B.1 | Route `/admin` | Protected route — redirect nếu không phải Admin | ✅ |
| 11.B.2 | `AdminLayout.tsx` | Sidebar trái (nav admin) + content area | ✅ |
| 11.B.3 | `AdminDashboardView.tsx` | 4 stat cards + bảng hoạt động | ✅ |
| 11.B.4 | `AdminUsersView.tsx` | Bảng users, search, filter role, ban/unban, đổi role | ✅ |
| 11.B.5 | `AdminPostsView.tsx` | Bảng posts, xem nội dung, xóa vi phạm | ✅ |
| 11.B.6 | `AdminReportsView.tsx` | Danh sách báo cáo, xem chi tiết, resolve | ✅ |
| 11.B.7 | `ReportModal.tsx` | Modal để user thường báo cáo bài/người dùng vi phạm | ✅ |
| 11.B.8 | `adminStore.ts` | Zustand store cho admin state (stats cache, filters) | ❌ |

**Cấu trúc thư mục frontend:**
```
frontend/src/
├── components/
│   ├── admin/
│   │   ├── AdminLayout.tsx
│   │   ├── StatCard.tsx          ← card hiển thị 1 con số thống kê
│   │   └── DataTable.tsx         ← bảng dữ liệu dùng chung cho Users/Posts/Reports
│   └── views/
│       ├── admin/
│       │   ├── AdminDashboardView.tsx
│       │   ├── AdminUsersView.tsx
│       │   ├── AdminPostsView.tsx
│       │   └── AdminReportsView.tsx
│       └── ReportModal.tsx       ← dùng trong feed bình thường (... menu)
├── api/
│   └── api-generated.ts         ← auto-gen sau khi thêm admin endpoints
└── store/
    └── adminStore.ts
```

**Admin route protection:**
```tsx
// Kiểm tra user.role === 'Admin' trong authStore
// Nếu không phải Admin → redirect về /newsfeed với toast lỗi
// Route: /admin → /admin/dashboard (default)
//         /admin/users
//         /admin/posts
//         /admin/reports
```

---

### 11.C — Thứ tự thực hiện

```
1. Thêm IsActive vào User entity + migration
2. Tạo Report entity + migration
3. Implement IAdminService + AdminService
4. Implement AdminController (stats + user mgmt + post mgmt + reports)
5. Implement ReportsController (POST /api/reports cho user thường)
6. dotnet build + npm run generate:api
7. Tạo AdminLayout + AdminRoute protection
8. Implement AdminDashboardView (stat cards)
9. Implement AdminUsersView (table + ban + role change)
10. Implement AdminPostsView (table + delete)
11. Implement AdminReportsView (table + resolve)
12. Thêm ReportModal vào PostCard (menu ...)
```

---

## ❌ Ngoài scope (không làm trong dự án này)

| Hạng mục | Lý do |
|---|---|
| Real-time WebSocket / SignalR | Thêm phức tạp không cần thiết; polling 5s là đủ |
| Redis cache | Dự án cá nhân, PostgreSQL đủ nhanh |
| Refresh Token | JWT 7 ngày là đủ cho scope này |
| OAuth (Google/Facebook login) | Ngoài scope |
| Email verification / OTP | Ngoài scope |
| Video upload / media player | Ngoài scope |

---

## ⚙️ Lệnh thường dùng

```bash
# Sinh lại TypeScript client (chạy mỗi khi thêm endpoint mới ở backend)
cd backend/SocialNetwork.Api && dotnet build
cd frontend && npm run generate:api

# Chạy backend
cd backend/SocialNetwork.Api && dotnet run

# Chạy frontend
cd frontend && npm run dev

# Thêm migration
cd backend/SocialNetwork.Api && dotnet ef migrations add <TênMigration>

# Khởi động PostgreSQL
cd "New folder" && docker-compose up -d
```

---

## 🚀 Việc cần làm tiếp theo (theo ưu tiên)

> Phase 0–12 đã hoàn thành. Bao gồm backend API mới + frontend UX improvements. Còn lại là tech debt nhỏ và tính năng mở rộng.

### ✅ Đã hoàn thành (30/03/2026 — session mới nhất)

```
Backend:
- PUT /api/users/me/password — đổi mật khẩu (BCrypt verify + hash)
- GET /api/posts/search?q= — tìm kiếm bài viết (ILike, paged)
- GET /health — health check endpoint

Frontend:
- Infinite scroll (IntersectionObserver) thay nút "Tải thêm"
- PostCardSkeleton component (tái sử dụng)
- react-hot-toast — toast notifications cho edit/delete/save/error
- ErrorBoundary component — bao quanh main content section
- @types/react + @types/react-dom installed + type errors fixed
- GEMINI_API_KEY restored in vite.config.ts
```

### Còn lại — Tech debt nhỏ (không blocking)

```
1. Xóa src/api/authApi.ts (deprecated re-export)
2. Xóa src/data/mockData.ts (nếu không còn import)
3. Consolidate src/types.ts + src/types/api.types.ts
4. Xóa express package khỏi package.json nếu không dùng
```

### Tương lai — Mở rộng

```
1. UI: Trang Settings (gom profile edit + đổi mật khẩu)
2. Bookmarks feature (bảng + endpoint + UI)
3. Tìm kiếm bài viết trong SearchView (frontend kết nối GET /api/posts/search?q=)
4. SignalR real-time messaging
5. Cloudinary upload thay local
```
   → Xóa mockData.ts, authApi.ts (deprecated)
   → Hợp nhất types/api.types.ts vào types.ts hoặc dùng toàn bộ từ api-generated
```

### Ưu tiên trung bình — UX improvement

```
5. Infinite scroll thực sự (IntersectionObserver thay nút Load More)
6. UI: Reply threading trong CommentSidebar (hiển thị replies thụt vào)
7. UI: Hiển thị read receipt trong MessengerView
8. Skeleton loading cho PostCard, ProfileView
9. Toast notifications (react-hot-toast)
10. Error boundary component
```

### Tính năng mới

```
11. Đổi mật khẩu — PUT /api/users/me/password (endpoint mới)
12. Tìm kiếm bài viết — GET /api/posts/search?q= (endpoint mới)
13. Bookmarks — POST /api/posts/{id}/bookmark (bảng mới)
14. Real-time messaging — Microsoft.AspNetCore.SignalR
```
