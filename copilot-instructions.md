# Project-Wide Rules — Social Network App

Đây là dự án mạng xã hội full-stack. Đọc kỹ các rule dưới đây trước khi viết bất kỳ code nào.

## Stack tổng quan

| Layer | Công nghệ |
|---|---|
| Backend | ASP.NET Core (.NET 10), EF Core, PostgreSQL |
| Frontend | React 19, TypeScript, Vite, TailwindCSS v4, Zustand, Axios |
| Database | PostgreSQL only (không MongoDB, không Redis) |
| Auth | JWT Bearer Token (7 ngày, không có Refresh Token) |
| Infra | Docker (chỉ PostgreSQL) |

---

## Nguyên tắc chung (áp dụng cả 2 bên)

### 1. Không thêm dependency không cần thiết
- KHÔNG dùng thêm MongoDB, Redis, RabbitMQ trừ khi được yêu cầu rõ ràng
- Mỗi package mới thêm vào phải có lý do cụ thể và được ghi vào BACKEND_PLAN.md hoặc FRONTEND_PLAN.md

### 2. Ngôn ngữ trong code
- **Code (tên biến, hàm, class):** Tiếng Anh
- **Comment giải thích logic phức tạp:** Tiếng Việt
- **Commit message:** Tiếng Việt hoặc Tiếng Anh đều OK

### 3. Không commit credentials
- KHÔNG bao giờ commit password, secret key, connection string thật vào git
- Backend dùng `dotnet user-secrets` khi dev
- Frontend dùng `.env` (đã có trong `.gitignore`)

### 4. Cập nhật FEATURES.md khi thêm/sửa tính năng
- Mỗi khi implement một chức năng mới, cập nhật trạng thái trong FEATURES.md
- Dùng ký hiệu: ✅ = xong, ⬜ = chưa làm

---

## QUY TẮC QUAN TRỌNG: Thay đổi có liên hệ

Khi sửa một file, luôn kiểm tra xem có cần sửa file nào liên quan không.

### Khi thêm/sửa cột trong Entity (backend)

```
1. Sửa Entity class         → backend/SocialNetwork.Api/Entities/*.cs
2. Tạo Migration mới        → dotnet ef migrations add <TênMigration>
3. Cập nhật SQL file        → database/database.sql  (thêm ALTER TABLE hoặc sửa CREATE TABLE)
4. Cập nhật DATABASE_SUMMARY.txt → database/DATABASE_SUMMARY.txt
5. Cập nhật DTO tương ứng   → backend/SocialNetwork.Api/DTOs/
6. Cập nhật TypeScript type → frontend/src/types/api.types.ts
7. Cập nhật FEATURES.md nếu đây là tính năng mới
```

**Ví dụ:** Thêm cột `date_of_birth` vào `users`:
- `User.cs` → thêm property `DateOfBirth`
- `dotnet ef migrations add AddDateOfBirthToUser`
- `database.sql` → thêm `date_of_birth DATE` vào CREATE TABLE users
- `DATABASE_SUMMARY.txt` → thêm vào danh sách columns của bảng users
- `UserDtos.cs` → thêm `DateOfBirth` vào `UserDto` và `UpdateUserDto`
- `api.types.ts` → thêm `dateOfBirth?: string` vào `UserDto`

### Khi thêm endpoint API mới (backend)

```
1. Thêm method vào Service Interface  → Services/Interfaces/I*Service.cs
2. Implement trong Service            → Services/Implementations/*Service.cs
3. Thêm action vào Controller        → Controllers/*Controller.cs
4. Thêm/sửa DTOs nếu cần            → DTOs/
5. Thêm API call ở frontend          → frontend/src/api/*Api.ts
6. Cập nhật BACKEND_PLAN.md          → đánh dấu checklist
7. Cập nhật FEATURES.md              → cập nhật trạng thái
```

### Khi sửa TypeScript type ở frontend

```
1. Kiểm tra type có khớp với backend DTO không
2. Tìm tất cả import của type đó và cập nhật nếu cần
3. Nếu thêm field mới → kiểm tra xem backend DTO đã có field đó chưa
```

### Khi thêm bảng mới vào database

```
1. Tạo Entity class mới              → backend/Entities/NewTable.cs
2. Thêm DbSet vào SocialDbContext    → Data/SocialDbContext.cs
3. Cấu hình relationship trong OnModelCreating
4. Tạo Migration                     → dotnet ef migrations add AddNewTable
5. Thêm vào database.sql             → CREATE TABLE new_table (...)
6. Thêm indexes phù hợp vào database.sql
7. Cập nhật DATABASE_SUMMARY.txt
8. Tạo DTOs tương ứng
9. Cập nhật TypeScript types
```

---

## API Contract (phải nhất quán cả 2 bên)

### Backend trả về, Frontend nhận vào:

```
// IDs luôn là number (int), KHÔNG phải string
// Timestamps luôn là ISO 8601 string (UTC)
// Nullable fields có thể là null, không phải undefined

// Ví dụ response:
{
  "success": true,
  "data": { "id": 1, "username": "john" },
  "message": null
}

// Ví dụ paged response:
{
  "success": true,
  "data": {
    "items": [...],
    "totalCount": 42,
    "page": 1,
    "pageSize": 10,
    "hasNextPage": true
  }
}
```

### Frontend gọi API:
- Luôn dùng `axios` instance từ `src/api/axios.ts`, KHÔNG dùng `fetch` thẳng
- Luôn attach JWT token qua interceptor (tự động, không cần làm thủ công)
- Xử lý lỗi qua try/catch, hiện toast thông báo lỗi cho user

---

## File structure — đừng tạo file sai chỗ

```
backend/SocialNetwork.Api/
├── Controllers/     ← HTTP layer only, không có business logic
├── Services/
│   ├── Interfaces/  ← Interface định nghĩa contract
│   └── Implementations/  ← Logic thực tế
├── Entities/        ← EF Core models (map với DB tables)
├── DTOs/            ← Request/Response objects (không dùng Entity trực tiếp)
├── Data/            ← DbContext only
├── Migrations/      ← KHÔNG sửa tay, do EF Core generate
├── Middleware/      ← Cross-cutting concerns
├── Helpers/         ← Utilities (JWT, etc.)
└── Extensions/      ← DI registration

frontend/src/
├── api/             ← Axios service calls, 1 file per domain
├── store/           ← Zustand stores, 1 file per domain
├── hooks/           ← Custom React hooks
├── components/      ← Reusable UI components
├── components/views/← Page-level components (1 per route)
├── types/           ← TypeScript type definitions
└── router/          ← React Router config
```
