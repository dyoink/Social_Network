# Social Network

Ứng dụng mạng xã hội full-stack, được xây dựng để học và thực hành các công nghệ hiện đại.

---

## Tech Stack

| Layer | Công nghệ |
|---|---|
| **Backend** | ASP.NET Core (.NET 10), Entity Framework Core, PostgreSQL |
| **Frontend** | React 19, TypeScript, Vite 6, TailwindCSS v4, Zustand, Motion |
| **Auth** | JWT Bearer Token (7 ngày) |
| **API Docs** | Scalar UI (auto-gen OpenAPI) |
| **Infrastructure** | Docker (PostgreSQL container) |

---

## Chức năng chính

- **Authentication** — Đăng ký, đăng nhập với JWT
- **Newsfeed** — Xem bài viết của người đang follow, infinite scroll, skeleton loading
- **Posts** — Tạo, chỉnh sửa, xóa bài viết, đính kèm ảnh (upload)
- **Reactions** — Like / unlike bài viết
- **Comments** — Bình luận và reply nested comments
- **Profile** — Xem và chỉnh sửa trang cá nhân, avatar, ảnh bìa
- **Follow System** — Follow / Unfollow người dùng, gợi ý follow
- **Search** — Tìm kiếm người dùng và bài viết
- **Messenger** — Nhắn tin riêng tư real-time
- **Notifications** — Thông báo khi có like, comment, follow
- **Admin Panel** — Dashboard biểu đồ (area, bar, pie), quản lý users (ban, đổi role, reset mật khẩu, xem chi tiết), posts (xem chi tiết, ảnh), comments, reports
- **Report System** — Báo cáo người dùng / bài viết vi phạm, admin xóa report
- **Dark Mode** — Chuyển đổi dark/light mode, anti-flash, lưu preference
- **Health Check** — Endpoint `/health` để monitor

Xem chi tiết trạng thái tại [FEATURES.md](FEATURES.md).

---

## Yêu cầu hệ thống

| Phần mềm | Phiên bản tối thiểu |
|---|---|
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.0 |
| [Node.js](https://nodejs.org/) | 18+ |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Bất kỳ (để chạy PostgreSQL) |

---

## Hướng dẫn cài đặt chi tiết

### Bước 1 — Khởi động Database (PostgreSQL qua Docker)

```bash
cd docker
docker compose up -d
```

Container sẽ tạo database `SocialNetworkDb` với user `admin` trên port `5432`.

Kiểm tra container đã chạy:
```bash
docker ps
# Phải thấy container "social_postgres" ở trạng thái healthy
```

### Bước 2 — Cài đặt & chạy Backend

```bash
cd backend/SocialNetwork.Api
```

**Cấu hình secrets (chạy 1 lần):**

```bash
# Connection string cho PostgreSQL
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=SocialNetworkDb;Username=admin;Password=SecretPassword123!"

# Secret key cho JWT (phải >= 32 ký tự)
dotnet user-secrets set "Jwt:SecretKey" "SuperSecretKeyAtLeast32Characters!!"
```

**Chạy database migration:**

```bash
dotnet ef migrations add UpdateSocialModel
dotnet ef database update
```

> Nếu chưa cài `dotnet-ef`:
> ```bash
> dotnet tool install --global dotnet-ef
> ```

**Khởi động server:**

```bash
dotnet run
```

Backend chạy tại: **http://localhost:5204**

### Bước 3 — Cài đặt & chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại: **http://localhost:3000**

> Frontend tự động gọi API backend tại `http://localhost:5204`. Nếu backend chạy port khác, sửa file `frontend/src/api/axios.ts`.

### Bước 4 — Truy cập ứng dụng

1. Mở trình duyệt tại **http://localhost:3000**
2. **Đăng ký** tài khoản mới
3. Đăng nhập và bắt đầu sử dụng

---

## Truy cập Admin Panel
psql -U admin -d SocialNetworkDb


1. Trong database, cập nhật role của user thành `Admin`:

```sql
UPDATE "Users" SET "Role" = 'Admin' WHERE "Username" = 'UserCuaBan';
```

Hoặc dùng API admin (nếu đã là Admin):
- `PUT /api/admin/users/{id}/role` với body `{ "role": "Admin" }`

2. Đăng nhập lại, click vào icon **Shield** (🛡️) trên thanh navigation trên cùng.

3. Admin Panel bao gồm các tab:
   - **Dashboard** — Thống kê tổng quan + biểu đồ tăng trưởng (Area Chart), hoạt động hôm nay (Bar Chart), phân bố nội dung (Pie Chart), bảng xếp hạng user hoạt động nhất
   - **Users** — Quản lý tài khoản (ban/unban, đổi role, reset mật khẩu, xem chi tiết, lọc theo trạng thái)
   - **Posts** — Quản lý bài viết (xem chi tiết + ảnh, xóa)
   - **Comments** — Quản lý bình luận (tìm kiếm, lọc theo bài viết, xóa)
   - **Reports** — Xử lý báo cáo vi phạm (resolve, xóa bài vi phạm trực tiếp)
   - **Seed Data** — Tạo dữ liệu ngẫu nhiên để test (xem hướng dẫn bên dưới)

---

## Seed Data (Tạo dữ liệu ngẫu nhiên để test)

Admin Panel có tính năng sinh hàng chục/trăm user, post, comment, reaction, follow, message và story ngẫu nhiên — giúp test pagination, trending hashtags, leaderboard và newsfeed mà không cần nhập tay.

### Cách sử dụng

1. Vào **Admin Panel** → tab **🌱 Seed Data**
2. Điều chỉnh các thông số bằng slider:

   | Thông số | Phạm vi | Mặc định | Mô tả |
   |---|---|---|---|
   | **Số users** | 1 – 200 | 20 | Số fake user sẽ được tạo |
   | **Posts / user** | 0 – 20 | 5 | Số bài viết mỗi user đăng |
   | **Comments / post** | 0 – 10 | 3 | Số bình luận mỗi bài viết |
   | **Follows / user** | 0 – 30 | 10 | Mỗi user follow bao nhiêu người khác |
   | **Reactions / post** | 0 – 50 | 15 | Số like/reaction ngẫu nhiên mỗi bài |
   | Tạo Messages | checkbox | ✅ | Tạo conversations + tin nhắn giữa các cặp user |
   | Tạo Stories | checkbox | ✅ | Tạo stories ngẫu nhiên |

3. Giao diện hiển thị **ước tính số records** sẽ được tạo (cảnh báo nếu > 5.000).
4. Bấm **🌱 Bắt đầu Seed** → đợi vài giây → xem kết quả.

### Thông tin về seeded data

- **Username** của tất cả fake user đều bắt đầu bằng `seed_` (ví dụ: `seed_a3f7c9b2d1e4`)
- **Password** cố định: `Seed@1234` — có thể đăng nhập vào tài khoản test bất kỳ
- **Avatar** lấy từ `picsum.photos` (ảnh đẹp, không cần upload)
- `CreatedAt` trải ngẫu nhiên trong 365 ngày → biểu đồ growth chart trông tự nhiên
- Post content bao gồm hashtag ngẫu nhiên → trending hashtags hoạt động ngay

### Cleanup — Xóa toàn bộ seeded data

Bấm **🗑 Xóa toàn bộ Seeded Data** (có confirmation dialog).

- Xoá cascade theo đúng thứ tự FK: stories → messages → notifications → reactions → comments → posts → follows → users
- **Không ảnh hưởng** đến real users, bài viết, hay dữ liệu admin
- Dựa trên cờ `is_seeded = true` trên bảng `users`

### Gọi API trực tiếp (tùy chọn)

```bash
# Tạo seed data
curl -X POST http://localhost:5204/api/admin/seed \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"userCount":50,"postsPerUser":5,"commentsPerPost":3,"followsPerUser":10,"reactionsPerPost":15,"includeMessages":true,"includeStories":true}'

# Kiểm tra trạng thái
curl http://localhost:5204/api/admin/seed/status \
  -H "Authorization: Bearer <admin_token>"

# Xóa toàn bộ seeded data
curl -X DELETE http://localhost:5204/api/admin/seed \
  -H "Authorization: Bearer <admin_token>"
```

---

## API Documentation

Sau khi chạy backend (development mode), mở:

```
http://localhost:5204/scalar/v1
```

Scalar UI cho phép xem toàn bộ endpoints, thử gọi API trực tiếp, và xem schema.

OpenAPI JSON spec: `http://localhost:5204/openapi/v1.json`

---

## Cấu trúc dự án

```
Social_Network/
├── backend/SocialNetwork.Api/     ← ASP.NET Core Web API
│   ├── Controllers/               ← HTTP endpoints (không có business logic)
│   ├── Services/
│   │   ├── Interfaces/            ← Service contracts
│   │   └── Implementations/       ← Business logic
│   ├── Entities/                  ← EF Core models (map DB tables)
│   ├── DTOs/                      ← Request/Response objects
│   │   ├── Auth/                  ← Login, Register DTOs
│   │   ├── Post/                  ← Post DTOs
│   │   ├── Comment/               ← Comment DTOs
│   │   ├── User/                  ← User DTOs
│   │   ├── Message/               ← Message DTOs
│   │   ├── Notification/          ← Notification DTOs
│   │   └── Admin/                 ← Admin panel DTOs
│   ├── Data/                      ← SocialDbContext
│   ├── Migrations/                ← EF Core migrations (auto-generated)
│   ├── Middleware/                 ← Global exception handler
│   ├── Helpers/                   ← JWT token generation
│   ├── Extensions/                ← DI registration
│   └── Common/                    ← ApiResponse wrapper, PagedResult
│
├── frontend/src/                  ← React SPA
│   ├── api/                       ← Generated API client (Orval) + Axios instance
│   ├── store/                     ← Zustand stores (auth, feed)
│   ├── hooks/                     ← Custom React hooks (useFeed)
│   ├── components/
│   │   ├── feed/                  ← PostCard, CreatePostModal, CommentSidebar
│   │   ├── layout/                ← Sidebar, TopNav, RightSidebar
│   │   ├── ui/                    ← Reusable UI (ImageUpload, Skeleton, etc.)
│   │   ├── views/                 ← Page components (Newsfeed, Profile, etc.)
│   │   └── admin/                 ← Admin layout + admin views
│   ├── types/                     ← TypeScript type definitions
│   └── utils/                     ← Utility functions
│
├── database/                      ← SQL schema + documentation
│   ├── database.sql               ← Full CREATE TABLE statements
│   └── DATABASE_SUMMARY.txt       ← Tóm tắt schema
│
├── docker/
│   └── docker-compose.yml         ← PostgreSQL container
│
├── FEATURES.md                    ← Danh sách chức năng + trạng thái
├── BACKEND_PLAN.md                ← Kế hoạch backend
├── FRONTEND_PLAN.md               ← Kế hoạch frontend
├── PLAN.md                        ← Kế hoạch tổng thể
└── Social_Network.sln             ← .NET Solution file
```

---

## Database Schema

10 bảng PostgreSQL:

| Bảng | Mô tả |
|---|---|
| `users` | Thông tin người dùng, role, trạng thái active |
| `posts` | Bài viết (content, image) |
| `comments` | Bình luận + reply (self-referencing `parent_id`) |
| `post_likes` | Like bài viết (1 user = 1 like) |
| `follows` | Quan hệ follow (follower → following) |
| `conversations` | Cuộc hội thoại |
| `conversation_participants` | Thành viên hội thoại |
| `messages` | Tin nhắn trong conversation |
| `notifications` | Thông báo (like, comment, follow, reply) |
| `reports` | Báo cáo vi phạm |

Xem schema SQL đầy đủ tại [database/database.sql](database/database.sql).

---

## Design Patterns

- **Service Pattern** — Controller chỉ gọi Service Interface, không chứa business logic
- **DTO Pattern** — Tách biệt API contract (DTOs) khỏi database models (Entities)
- **Middleware Pipeline** — Global exception handling với status code phù hợp (400/401/403/404/500)
- **Zustand Store** — State management đơn giản, immutable updates
- **Auto-generated API Client** — OpenAPI → Orval → TypeScript client, đảm bảo type-safe

---

## Mở rộng

| Muốn thêm | Cách làm |
|---|---|
| Real-time chat | Thêm SignalR `ChatHub`, không đụng REST API hiện có |
| Cloud storage | Tạo `IFileUploadService` implementation mới (Cloudinary, S3) |
| Email xác thực | Tạo `IEmailService` + inject vào AuthService |
| Cache | Inject `IMemoryCache` vào Service cần cache |

---

*Dự án cá nhân — đang trong quá trình phát triển.*

## Preview
 <img width="1905" height="942" alt="Image" src="https://github.com/user-attachments/assets/8768b075-affb-461f-9ab9-2934672ed11c" />

<img width="1905" height="946" alt="Image" src="https://github.com/user-attachments/assets/1e0c37b3-2bba-43db-a60f-ebd1782178ed" />

<img width="1887" height="942" alt="Image" src="https://github.com/user-attachments/assets/099fde58-a489-42b9-b721-0ded83f795dd" />

<img width="1893" height="944" alt="Image" src="https://github.com/user-attachments/assets/b6b196a8-8229-4400-820a-0d879e8c410d" />

<img width="1887" height="935" alt="Image" src="https://github.com/user-attachments/assets/35e7c548-ca50-42c5-b079-d3ed9142b355" />

<img width="1889" height="945" alt="Image" src="https://github.com/user-attachments/assets/297bb6ae-656f-4870-881a-569113707a8e" />

<img width="1886" height="939" alt="Image" src="https://github.com/user-attachments/assets/85e97ee0-e59c-4a8b-981d-5732fc34162c" />

<img width="1884" height="935" alt="Image" src="https://github.com/user-attachments/assets/94658b1a-c288-40f3-b27c-f2bd926969b4" />

<img width="1886" height="932" alt="Image" src="https://github.com/user-attachments/assets/56d1bb94-74b9-4e9f-aa5d-29ee92464789" />

<img width="1883" height="937" alt="Image" src="https://github.com/user-attachments/assets/8f00ecac-69af-4fc8-8b0f-dd25806f88de" />

<img width="1886" height="941" alt="Image" src="https://github.com/user-attachments/assets/8b3bd2a9-476c-4ad5-b1b8-f9974d16efc8" />

<img width="1884" height="936" alt="Image" src="https://github.com/user-attachments/assets/4ecb86ce-2eae-45b0-bf45-69fa1c0a8455" />

<img width="1884" height="944" alt="Image" src="https://github.com/user-attachments/assets/1ad66c3a-60ce-486b-a28a-836fe1f00327" />

<img width="1893" height="944" alt="Image" src="https://github.com/user-attachments/assets/415ed460-316b-47ca-a298-c5f7d1007362" />

<img width="1893" height="941" alt="Image" src="https://github.com/user-attachments/assets/fa23038f-2876-4d7a-9d5e-c03c750e04af" />

<img width="1889" height="941" alt="Image" src="https://github.com/user-attachments/assets/2feec1f2-bb0e-4ee8-a8d7-61f62134aee5" />

<img width="1888" height="938" alt="Image" src="https://github.com/user-attachments/assets/6493b883-bacf-4fa4-a6aa-f9a98436bdab" />

<img width="1892" height="940" alt="Image" src="https://github.com/user-attachments/assets/760c5e5e-65dd-40f9-8679-5a6de03da348" />

<img width="1885" height="955" alt="Image" src="https://github.com/user-attachments/assets/30727c41-ff09-42e3-9d60-d12b088d3c00" />

<img width="1889" height="939" alt="Image" src="https://github.com/user-attachments/assets/a2eb20cf-443e-4085-a780-ec76ceba6226" />

<img width="1900" height="939" alt="Image" src="https://github.com/user-attachments/assets/7acef79f-e347-49c2-b461-dca47eb1512d" />

<img width="1885" height="938" alt="Image" src="https://github.com/user-attachments/assets/af97af30-bfac-4721-9bf3-0546ec6aea91" />

<img width="1902" height="934" alt="Image" src="https://github.com/user-attachments/assets/36c5757b-0f66-4e33-8656-e3da95fb5f4a" />

<img width="1885" height="955" alt="Image" src="https://github.com/user-attachments/assets/9b242b0a-d350-40ca-8b17-111b86466b91" />

<img width="1889" height="939" alt="Image" src="https://github.com/user-attachments/assets/3e3ce73e-a78f-4021-b3f6-a769ea7df93e" />


