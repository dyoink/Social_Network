# ⚙️ SETUP GUIDE — Social Network App

Hướng dẫn cài đặt, cấu hình và chạy dự án từ đầu.

---

## Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu | Kiểm tra |
|---|---|---|
| .NET SDK | 10.0 | `dotnet --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Docker Desktop | Latest | `docker --version` |
| Git | Any | `git --version` |

---

## 1. Clone dự án

```bash
git clone <your-repo-url>
cd Social_Network
```

---

## 2. Khởi động Database (Docker)

Database duy nhất là **PostgreSQL**, chạy qua Docker:

```bash
# Vào thư mục chứa docker-compose
cd docker

# Khởi động PostgreSQL
docker compose up -d

# Kiểm tra container đang chạy
docker ps
```

Bạn sẽ thấy container `social_postgres` đang chạy.

**Thông tin kết nối PostgreSQL:**
```
Host:     localhost
Port:     5432
Database: SocialNetworkDb
Username: admin
Password: SecretPassword123!
```

> **Lưu ý:** Password mặc định này chỉ dùng cho môi trường development local. Không dùng trên production.

---

## 3. Cấu hình Backend

### 3.1 Di chuyển vào thư mục backend

```bash
cd backend/SocialNetwork.Api
```

### 3.2 Cài đặt User Secrets (bảo mật hơn appsettings)

Thay vì lưu credentials trong `appsettings.json`, dùng User Secrets:

```bash
# Khởi tạo user secrets cho project
dotnet user-secrets init

# Cấu hình connection string
dotnet user-secrets set "ConnectionStrings:DefaultConnection" \
  "Host=localhost;Port=5432;Database=SocialNetworkDb;Username=admin;Password=SecretPassword123!"

# Cấu hình JWT secret (tạo chuỗi ngẫu nhiên dài ít nhất 32 ký tự)
dotnet user-secrets set "Jwt:SecretKey" "your-super-secret-jwt-key-at-least-32-chars"
dotnet user-secrets set "Jwt:Issuer" "SocialNetworkApi"
dotnet user-secrets set "Jwt:Audience" "SocialNetworkClient"
dotnet user-secrets set "Jwt:ExpiryDays" "7"
```

> User Secrets được lưu ngoài thư mục project, an toàn khi commit code.

### 3.3 Cập nhật `appsettings.json` (giữ cấu trúc, xóa giá trị nhạy cảm)

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "override_by_user_secrets"
  },
  "Jwt": {
    "SecretKey": "override_by_user_secrets",
    "Issuer": "SocialNetworkApi",
    "Audience": "SocialNetworkClient",
    "ExpiryDays": 7
  }
}
```

### 3.4 Chạy Migrations (tạo bảng trong PostgreSQL)

```bash
# Đảm bảo đang ở thư mục backend/SocialNetwork.Api
dotnet ef database update
```

Lệnh này sẽ tạo tất cả các bảng theo Migrations đã có.

### 3.5 Restore packages và chạy backend

```bash
dotnet restore
dotnet run
```

Backend sẽ chạy tại:
- **API:** `http://localhost:5000`
- **Swagger UI:** `http://localhost:5000/swagger`

---

## 4. Cấu hình Frontend

### 4.1 Di chuyển vào thư mục frontend

```bash
cd frontend
```

### 4.2 Tạo file `.env`

```bash
# Tạo file .env trong thư mục frontend/
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

Hoặc tạo thủ công file `frontend/.env` với nội dung:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4.3 Cài dependencies và chạy frontend

```bash
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

---

## 5. Kiểm tra hoạt động

Sau khi cả backend và frontend đang chạy:

1. Mở trình duyệt, vào `http://localhost:3000`
2. Tạo tài khoản mới (Register)
3. Đăng nhập (Login)
4. Thử tạo bài viết

**Kiểm tra API trực tiếp qua Swagger:**
```
http://localhost:5000/swagger
```

**Kiểm tra kết nối database:**
```bash
docker exec -it social_postgres psql -U admin -d SocialNetworkDb -c "\dt"
```

---

## 6. Cấu trúc thư mục dự án

```
Social_Network/
├── backend/
│   └── SocialNetwork.Api/          ← ASP.NET Core API
│       ├── Controllers/            ← API endpoints
│       ├── Services/               ← Business logic
│       ├── Entities/               ← Database models
│       ├── DTOs/                   ← Data transfer objects
│       ├── Data/                   ← DbContext
│       ├── Migrations/             ← EF Core migrations
│       ├── Middleware/             ← Exception handling
│       ├── Helpers/                ← JWT helper
│       ├── Extensions/             ← DI registration
│       └── appsettings.json
├── frontend/
│   └── src/
│       ├── api/                    ← API service layer
│       ├── store/                  ← Zustand state
│       ├── hooks/                  ← Custom React hooks
│       ├── components/             ← UI components
│       ├── types/                  ← TypeScript types
│       └── router/                 ← React Router
├── database/
│   ├── database.sql                ← Schema SQL (tham khảo)
│   └── DATABASE_SUMMARY.txt        ← Mô tả các bảng
├── New folder/
│   └── docker-compose.yml          ← PostgreSQL container
├── FEATURES.md                     ← Danh sách chức năng
├── BACKEND_PLAN.md                 ← Kế hoạch backend
├── FRONTEND_PLAN.md                ← Kế hoạch frontend
└── README.md                       ← Tổng quan dự án
```

---

## 7. Scripts hữu ích

### Backend

```bash
# Chạy ở development mode
dotnet run

# Chạy với hot reload
dotnet watch run

# Thêm migration mới
dotnet ef migrations add <TênMigration>

# Áp dụng migration
dotnet ef database update

# Rollback về migration trước
dotnet ef database update <TênMigrationTrước>

# Xem danh sách migrations
dotnet ef migrations list

# Build project
dotnet build

# Xóa và tạo lại database (cẩn thận!)
dotnet ef database drop --force
dotnet ef database update
```

### Frontend

```bash
# Dev server
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Type check
npm run lint
```

### Docker

```bash
# Khởi động services
docker compose up -d

# Dừng services
docker compose down

# Xem logs
docker compose logs -f postgres-db

# Kết nối trực tiếp PostgreSQL
docker exec -it social_postgres psql -U admin -d SocialNetworkDb

# Xóa toàn bộ data (cẩn thận!)
docker compose down -v
```

---

## 8. Xử lý lỗi thường gặp

### Lỗi: `connection refused` khi kết nối PostgreSQL

```bash
# Kiểm tra container có đang chạy không
docker ps

# Nếu không có, khởi động lại
docker compose up -d
```

### Lỗi: Port 5432 đã được sử dụng

```bash
# Windows: tìm process dùng port 5432
netstat -ano | findstr :5432

# Hoặc đổi port trong docker-compose.yml: "5433:5432"
# Và cập nhật connection string: Port=5433
```

### Lỗi: `Migration pending` khi chạy backend

```bash
dotnet ef database update
```

### Lỗi: CORS khi frontend gọi API

Kiểm tra `Program.cs` backend có cấu hình CORS với origin `http://localhost:3000`:
```csharp
policy.WithOrigins("http://localhost:3000")
```

### Lỗi: `401 Unauthorized` khi gọi API

Kiểm tra:
1. Token đã được gửi trong header `Authorization: Bearer <token>`
2. Token chưa hết hạn (mặc định 7 ngày)
3. JWT Secret Key giống nhau ở cả nơi tạo token và xác thực

---

## 9. Môi trường Production (tóm tắt)

```bash
# Backend: đặt environment variables thay vì user secrets
export ConnectionStrings__DefaultConnection="Host=prod-db;..."
export Jwt__SecretKey="your-production-secret"

# Publish backend
dotnet publish -c Release -o ./publish

# Frontend: build
VITE_API_URL=https://api.yourdomain.com npm run build
# Deploy thư mục dist/ lên web server (Nginx, Netlify, Vercel...)
```
