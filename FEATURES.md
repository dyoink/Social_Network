# 📋 FEATURES — Social Network App

> **Cập nhật lần cuối:** 30/03/2026 — Phase 0–13 hoàn thành. Dark mode, admin panel nâng cấp toàn diện (biểu đồ, quản lý comments, reset mật khẩu, xem chi tiết).

---

## Ký hiệu trạng thái

| Ký hiệu | Nghĩa |
|---|---|
| ✅ | Backend + Frontend đều hoàn thành, kết nối API thật |
| ✅ BE | Backend đã có, Frontend chưa có UI |
| ✅ UI | UI có nhưng backend chưa hỗ trợ (hoặc chưa kết nối) |
| ⬜ | Chưa implement cả 2 phía |
| ❌ | Ngoài scope, không làm |

---

## 1. Xác thực (Authentication)

| Chức năng | Mô tả | Trạng thái |
|---|---|---|
| Đăng ký tài khoản | Username, Email, Password, FullName — BCrypt hash | ✅ |
| Đăng nhập | Email hoặc Username + Password → JWT 7 ngày | ✅ |
| JWT Token | Bearer Token, claims: id/username/email/role, 7 ngày | ✅ |
| Xem thông tin bản thân | `GET /api/auth/me` trả về profile + token persist localStorage | ✅ |
| Đăng xuất | Xóa token khỏi localStorage, redirect về `/auth` | ✅ |
| Auto-logout khi 401 | Axios interceptor bắt 401 → logout tự động | ✅ |

---

## 2. Người dùng (Users)

| Chức năng | Mô tả | Trạng thái |
|---|---|---|
| Xem profile | Avatar, ảnh bìa, bio, thống kê followers/following/posts | ✅ |
| Chỉnh sửa profile | `PUT /api/users/me` — FullName, Bio, AvatarUrl, CoverUrl + Profile Edit Modal | ✅ |
| Tìm kiếm người dùng | Tìm theo tên hoặc username, debounce 400ms | ✅ |
| Follow / Unfollow | Toggle follow — optimistic update + rollback | ✅ |
| Danh sách Followers | `GET /api/users/{id}/followers` — paged | ✅ BE |
| Danh sách Following | `GET /api/users/{id}/following` — paged | ✅ BE |
| Gợi ý người dùng | `GET /api/users/suggestions` — hiển thị RightSidebar | ✅ |
| Đổi mật khẩu | `PUT /api/users/me/password` — nhập mật khẩu cũ + mới | ✅ BE |
| Ban user (Admin) | `PUT /api/admin/users/{id}/ban` — toggle IsActive | ✅ |
| Đổi role (Admin) | `PUT /api/admin/users/{id}/role` — Member ↔ Admin | ✅ |
| Xóa user (Admin) | `DELETE /api/admin/users/{id}` — hard delete | ✅ |

---

## 3. Bài viết (Posts)

| Chức năng | Mô tả | Trạng thái |
|---|---|---|
| Newsfeed | Posts của following + bản thân, mới nhất trước, 10 bài/trang | ✅ |
| Tải thêm (Load More) | IntersectionObserver tự động tải khi cuộn | ✅ |
| Infinite scroll tự động | IntersectionObserver thay nút "Tải thêm" | ✅ |
| Tạo bài viết | Nội dung text + đính kèm 1 ảnh qua `ImageUpload` | ✅ |
| Chỉnh sửa bài viết | `PUT /api/posts/{id}` — chủ bài sửa nội dung + toast feedback | ✅ |
| Xóa bài viết (chủ bài) | `DELETE /api/posts/{id}` — confirmation + toast | ✅ |
| Xóa bài vi phạm (Admin) | Từ AdminPostsView có nút xóa | ✅ |
| Xem chi tiết + Comments | CommentSidebar mở khi click bình luận | ✅ |
| Bài viết trên Profile | Chỉ posts của user đó — `GET /api/posts/user/{userId}` | ✅ |

---

## 4. Tương tác bài viết (Reactions)

| Chức năng | Mô tả | Trạng thái |
|---|---|---|
| Like / Unlike | Toggle like — optimistic update, rollback khi lỗi | ✅ |
| Đếm likes | Hiển thị số like thực từ API | ✅ |
| Reaction picker UI | Popup chọn kiểu reaction (Love, Haha, Wow…) | ✅ UI |
| Reaction types | Backend chỉ hỗ trợ Like/Unlike (không có reaction types) | ⬜ |

---

## 5. Bình luận (Comments)

| Chức năng | Mô tả | Trạng thái |
|---|---|---|
| Xem comments | Danh sách comments trong CommentSidebar — paged | ✅ |
| Tạo comment | Gửi comment — kết nối API thật | ✅ |
| Trả lời comment (Reply) | Backend hỗ trợ ParentId — `POST /api/comments` với parentId | ✅ |
| Hiển thị nested replies | CommentSidebar render replies thụt vào với border-left | ✅ |
| Xóa comment (owner) | `DELETE /api/comments/{id}` — backend có, chưa có nút xóa trong UI | ✅ BE |
| Đếm comments | Hiển thị số comment thực từ API trên PostCard | ✅ |

---

## 6. Tin nhắn (Messages)

| Chức năng | Mô tả | Trạng thái |
|---|---|---|
| Danh sách cuộc trò chuyện | Conversations + tin nhắn cuối — kết nối API thật | ✅ |
| Tạo / lấy cuộc trò chuyện | `POST /api/conversations` — tạo hoặc trả về conversation đã có | ✅ BE |
| Gửi tin nhắn | `POST /api/conversations/{id}/messages` — kết nối API thật | ✅ |
| Lịch sử tin nhắn | REST + polling 5s (không real-time) | ✅ |
| Đánh dấu đã đọc | `PUT /api/conversations/{id}/read` — backend có | ✅ BE |
| Trạng thái đã đọc (UI) | Hiển thị icon/badge đã đọc trong conversation list | ⬜ |
| Trạng thái online | Hiển thị "đang hoạt động" | ❌ |
| Real-time WebSocket | SignalR — ngoài scope, REST polling thay thế | ❌ |

---

## 7. Thông báo (Notifications)

| Chức năng | Mô tả | Trạng thái |
|---|---|---|
| Thông báo Like | Tự động tạo khi ai like bài của bạn | ✅ |
| Thông báo Comment | Tự động tạo khi ai comment bài của bạn | ✅ |
| Thông báo Follow | Tự động tạo khi ai follow bạn | ✅ |
| Thông báo Reply | Tự động tạo khi ai reply comment của bạn | ✅ |
| Xem danh sách notifications | `GET /api/notifications` — paged, kết nối API thật | ✅ |
| Đánh dấu 1 notification đã đọc | `PUT /api/notifications/{id}/read` | ✅ |
| Đánh dấu tất cả đã đọc | `PUT /api/notifications/read-all` | ✅ |
| Badge số chưa đọc trên TopNav | `GET /api/notifications/unread-count` | ✅ |

---

## 8. Upload ảnh (Media)

| Chức năng | Mô tả | Trạng thái |
|---|---|---|
| Upload ảnh bài viết | Component `ImageUpload` + `POST /api/upload/image` — lưu vào `wwwroot/uploads` | ✅ |
| Preview trước khi upload | Hiển thị preview ảnh trong modal | ✅ |
| Validate file | Backend: max 10MB, chỉ image/jpeg, image/png, image/webp | ✅ |
| Upload avatar | `PUT /api/users/me` nhận `avatarUrl` — cần UI profile edit | ✅ BE |
| Upload ảnh bìa | `PUT /api/users/me` nhận `coverUrl` — cần UI profile edit | ✅ BE |
| Serve static files | `app.UseStaticFiles()` — `/uploads/...` truy cập công khai | ✅ |

---

## 9. Tìm kiếm (Search)

| Chức năng | Mô tả | Trạng thái |
|---|---|---|
| Tìm người dùng | `GET /api/users/search?q=` — debounce 400ms | ✅ |
| Xem posts của user trong Search | Tab Posts trong SearchView | ✅ |
| Tìm bài viết theo nội dung | `GET /api/posts/search?q=` — case-insensitive, paged | ✅ BE |
| Filter (People / Posts / Media) | Tab filter trên UI | ✅ UI |

---

## 10. Admin Panel

| Chức năng | Mô tả | Trạng thái |
|---|---|---|
| Route `/admin` | Chỉ render khi `user.role === 'Admin'` | ✅ |
| Dashboard stats | Tổng users/posts/comments/messages/follows, pending reports, mới hôm nay, active users tuần | ✅ |
| Biểu đồ tăng trưởng | Area Chart users/posts/comments theo ngày (7/14/30/60 ngày) | ✅ |
| Biểu đồ hoạt động | Bar Chart hoạt động hôm nay (users, posts, comments, reports) | ✅ |
| Biểu đồ phân bố | Pie Chart phân bố nội dung (posts/comments/messages/follows) | ✅ |
| Thẻ tỷ lệ | Interaction rate, follow rate, reports rate | ✅ |
| Quản lý users | Bảng users — search, filter role, filter trạng thái (active/banned), phân trang | ✅ |
| Xem chi tiết user | Modal hiển thị avatar, stats, ngày tạo, vai trò | ✅ |
| Ban / Unban user | Toggle `IsActive` — admin thao tác ngay trong bảng | ✅ |
| Đổi role Member ↔ Admin | Confirmation dialog trước khi đổi | ✅ |
| Reset mật khẩu user | Admin đặt lại mật khẩu cho user — `PUT /api/admin/users/{id}/reset-password` | ✅ |
| Xóa user vĩnh viễn | Hard delete — confirmation dialog | ✅ |
| Quản lý posts | Bảng tất cả bài viết — search, xem report count, cột ảnh | ✅ |
| Xem chi tiết post | Modal hiển thị nội dung đầy đủ, ảnh, thống kê | ✅ |
| Xóa bài vi phạm | Admin xóa bất kỳ bài nào — confirmation + toast | ✅ |
| Quản lý bình luận | Bảng comments — search nội dung/tác giả, filter theo postId, phân trang | ✅ |
| Xóa bình luận (Admin) | Admin xóa bất kỳ comment nào — `DELETE /api/admin/comments/{id}` | ✅ |
| Xem báo cáo vi phạm | Danh sách reports filter theo Pending/Resolved/All | ✅ |
| Resolve báo cáo | Đánh dấu report đã xử lý — optimistic update + toast | ✅ |
| Xóa báo cáo | Admin xóa report — `DELETE /api/admin/reports/{id}` + toast | ✅ |
| Sidebar Admin | Link "Admin Panel" chỉ hiện với user có role Admin | ✅ |

---

## 11. Báo cáo vi phạm (Reports)

| Chức năng | Mô tả | Trạng thái |
|---|---|---|
| Báo cáo bài viết | Menu `...` trên PostCard → modal chọn lý do | ✅ |
| Lý do báo cáo | spam / hate speech / nude / violence / other | ✅ |
| Mô tả thêm | Textarea tuỳ chọn | ✅ |
| Gửi báo cáo | `POST /api/reports` — kết nối API thật | ✅ |
| Báo cáo user | `CreateReportDto` hỗ trợ `targetUserId` — chưa có UI trigger | ✅ BE |

---

## 12. Giao diện & UX

| Chức năng | Mô tả | Trạng thái |
|---|---|---|
| Responsive layout | Desktop-first, sidebar ẩn trên mobile | ✅ |
| Sidebar navigation | Điều hướng chính bên trái | ✅ |
| Top navigation bar | Search, notification badge, avatar | ✅ |
| Right sidebar | Gợi ý follow từ API thật | ✅ |
| Smooth animations | Framer Motion — transitions giữa views | ✅ |
| Reaction picker UI | Popup hover — chỉ UI, không persist reaction type | ✅ UI |
| Comment sidebar | Sidebar comments kết nối API | ✅ |
| Loading state | Một số views có loading spinner (không đồng đều) | ✅ UI |
| Skeleton loading | `PostCardSkeleton.tsx` tái sử dụng — dùng khi feed đang tải | ✅ |
| Toast notifications | `react-hot-toast` — thông báo lưu/xóa/lỗi | ✅ |
| Error boundary | `ErrorBoundary.tsx` bao quanh main content section | ✅ |
| Optimistic updates | Like, follow, report resolve — có rollback | ✅ |
| Dark mode / Light mode | Chuyển đổi theme với anti-flash, lưu localStorage, CSS variables Material Design 3 | ✅ |
| Theme toggle UI | Nút Sun/Moon trên Sidebar, tự động áp dụng `.dark` class | ✅ |

---

## 13. Nợ kỹ thuật (Tech Debt) — Cần giải quyết

| Hạng mục | Vấn đề | Mức ưu tiên |
|---|---|---|
| `database.sql` đã đồng bộ | Bao gồm bảng `reports` và cột `is_active` | ✅ (resolved) |
| `DATABASE_SUMMARY.txt` đã đồng bộ | Mô tả đầy đủ 10 bảng | ✅ (resolved) |
| `src/types.ts` (legacy) | `UserProfile` + `Post` interface cũ vẫn dùng làm bridge trong App.tsx | Trung bình |
| `src/types/api.types.ts` dư thừa | Nhiều types trùng với `api-generated.ts` → cần consolidate | Thấp |
| `src/api/authApi.ts` deprecated | Chỉ là re-export, nên xóa | Thấp |
| `src/data/mockData.ts` | `MOCK_USER` vẫn được import làm fallback — nên xóa | Thấp |
| Unused packages | `@google/genai` dùng cho Gemini (giữ lại), `express` có thể xóa | Thấp |
| `VITE_GEMINI_API_KEY` trong vite.config.ts | Expose qua `process.env` — cần thiết cho Gemini | ✅ (giữ lại) |
| UI: Xóa/Sửa bài (chủ bài) | PostCard có nút Sửa/Xóa + toast feedback | ✅ (resolved) |
| UI: Reply threading | CommentSidebar có nested replies + nút "Trả lời" | ✅ (resolved) |
| UI: Profile edit form | Profile Edit Modal với form FullName, Bio, AvatarUrl, CoverUrl | ✅ (resolved) |

---

## 14. Tương lai (Future Scope)

| Chức năng | Ghi chú |
|---|---|
| Real-time messaging | Thêm `Microsoft.AspNetCore.SignalR` + `@microsoft/signalr` |
| Bookmarks / Saved posts | Thêm bảng `bookmarks` + `POST /api/posts/{id}/bookmark` |
| Chia sẻ bài viết | Copy link hoặc share vào Messenger |
| Đổi email | `PUT /api/users/me/email` |
| Settings page | ✅ Gom đổi mật khẩu + dark mode + notification preferences + Gemini AI + privacy |
| Infinite scroll thực sự | IntersectionObserver thay nút Load More |
| Skeleton loading | Thêm `PostCardSkeleton` cho NewsfeedView |
| Toast notifications | `react-hot-toast` cho mọi action |
| Tìm kiếm bài viết | `GET /api/posts/search?q=` mới |
| Chặn người dùng (Block) | Thêm bảng `blocks` vào PostgreSQL |
| 2FA / OAuth | Ngoài scope giai đoạn này |
