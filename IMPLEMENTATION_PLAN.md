# 🗺️ IMPLEMENTATION PLAN — Social Network App

> **Tạo ngày:** 31/03/2026  
> **Nguồn:** De Xuat Cai Tien.md  
> **Nguyên tắc:** Mỗi Phase phải build được trước khi chuyển sang Phase kế tiếp.

---

## 📋 Tổng quan các Phase

| Phase | Tên | Ưu tiên | Ước tính |
|---|---|---|---|
| **0** | Nền tảng & Sửa lỗi khẩn cấp | 🔴 CRITICAL | 1–2 ngày |
| **1** | WebSocket Real-time (SignalR) | 🔴 HIGH | 4–6 ngày |
| **2** | Tương tác xã hội (Reactions, Mentions, Hashtag, Poke) | 🟠 HIGH | 4–5 ngày |
| **3** | Profile nâng cao & Quyền riêng tư | 🟠 MEDIUM-HIGH | 3–4 ngày |
| **4** | Hệ thống Danh hiệu (Badges/Titles) | 🟡 MEDIUM | 5–7 ngày |
| **5** | Nội dung phong phú (AI, Stories, Reels) | ✅ DONE | 5–7 ngày |
| **6** | Admin nâng cao & Settings | 🟢 LOW-MEDIUM | 2–3 ngày |
| **7** | Admin Data Seeder (Test Data Generator) | ✅ DONE | 1–2 ngày |

---

## ❓ Open Questions (cần xác nhận trước khi implement Phase liên quan)

| # | Câu hỏi | Liên quan | Mặc định giả định |
|---|---|---|---|
| Q1 | Video (Reels, Stories) lưu trong `wwwroot` hay cloud storage? | Phase 5 | ✅ `wwwroot/videos` — giống ảnh |
| Q2 | Trending tính từ hashtag trong DB (24h) hay dùng external API? | Phase 6 | ✅ Tự tính từ DB |
| Q3 | Poke hiệu ứng hỗ trợ mobile (Vibration API) không? | Phase 2 | ✅ Nice-to-have, desktop ưu tiên |

---

---

## Phase 0 — Nền tảng & Sửa lỗi khẩn cấp ✅

> **Trạng thái:** ✅ HOÀN THÀNH  
> **Ước tính:** 1–2 ngày | **Ưu tiên:** 🔴 CRITICAL

### 0.0 Git Setup
- [ ] Tạo `.gitignore` chuẩn cho .NET + Node.js + IDE (VS Code, Rider, JetBrains)
  - Exclude: `bin/`, `obj/`, `node_modules/`, `.env`, `*.user`, `appsettings.Development.json`, `wwwroot/uploads/`, `dist/`

### 0.1 Fix — Image Upload 415 Error
**Vấn đề:** `POST /api/upload/image` trả về `415 Unsupported Media Type`  
**Nguyên nhân điển hình:** Controller nhận `[FromBody]` nhưng frontend gửi `multipart/form-data`, hoặc ngược lại.

- [ ] **Backend** — Kiểm tra `UploadController.cs`: đảm bảo action nhận `IFormFile` với `[FromForm]`, không phải `[FromBody]`
- [ ] **Backend** — Kiểm tra `Content-Type` header không bị override bởi axios instance
- [ ] **Frontend** — Trong `ImageUpload` component: gửi `FormData`, **không** set `Content-Type` header thủ công (để browser tự set boundary)
- [ ] Test với file JPEG, PNG, WEBP

### 0.2 Fix — Duplicate Conversation (Chat)
**Vấn đề:** Nhắn tin cho 1 người hiện ra 2 đoạn chat riêng biệt  
**Nguyên nhân:** Có thể `POST /api/conversations` tạo mới thay vì trả về conversation đã tồn tại

- [ ] **Backend** — `ConversationsController.cs`: Kiểm tra logic `POST` — phải tìm conversation có cả 2 participants trước khi tạo mới
- [ ] **Backend** — Query: `SELECT * FROM conversation_participants WHERE user_id IN (userA, userB) GROUP BY conversation_id HAVING COUNT(*) = 2`
- [ ] **Frontend** — `MessengerView.tsx`: Đảm bảo không tạo duplicate local state khi receive response

### 0.3 Fix — Profile Tabs không hoạt động
**Vấn đề:** Tab "Đổi ảnh bìa", "Ảnh", "Giới thiệu" không respond khi click

- [ ] **Frontend** — `ProfileView.tsx`: Kiểm tra state management của active tab
- [ ] Implement cover photo upload UI (connect tới `PUT /api/users/me` với `coverUrl`)
- [ ] Implement tab "Ảnh" — lấy posts có `imageUrl` của user đó
- [ ] Implement tab "Giới thiệu" — hiển thị bio, ngày sinh, quê quán (khi có)

### 0.4 Fix — Post Utility Buttons
**Vấn đề:** Nút Location, Emoji trong CreatePostModal không làm gì khi click

- [ ] **Frontend** — `CreatePostModal.tsx`:
  - **Emoji picker**: Dùng thư viện `emoji-mart` hoặc custom popup emoji grid nhỏ
  - **Location**: Dùng `navigator.geolocation` → reverse geocode → hiển thị tên thành phố (Google Maps API hoặc nominatim.org free)
  - **Tag people**: Popup tìm kiếm user → thêm vào field `mentions`
- [ ] Lưu `location` và `mentionedUserIds` vào post request body (cần thêm fields vào `CreatePostDto`)

---

## Phase 1 — WebSocket Real-time (SignalR) ✅

> **Trạng thái:** ✅ HOÀN THÀNH  
> **Ước tính:** 4–6 ngày | **Ưu tiên:** 🔴 HIGH

### 1.1 Backend — Cài đặt SignalR

**Packages cần thêm:**
```xml
<PackageReference Include="Microsoft.AspNetCore.SignalR" Version="*" />
```

- [ ] **`ChatHub.cs`** — `Hubs/ChatHub.cs`
  - Method `SendMessage(int conversationId, string content)` → broadcast tới participants
  - `JoinConversation(int conversationId)` → join SignalR group
  - `LeaveConversation(int conversationId)`
  - Override `OnConnectedAsync` / `OnDisconnectedAsync` → track online status

- [ ] **`NotificationHub.cs`** — `Hubs/NotificationHub.cs`
  - `SendNotification(int userId, NotificationDto notification)` → push tới user cụ thể
  - Dùng `Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}")`

- [x] **`PokeHub.cs`** — `Hubs/PokeHub.cs` (cho Phase 2)
  - `Poke(int targetUserId, string pokeType)` → gửi event tới target user

- [ ] **`Program.cs`** — Đăng ký và map hubs:
  ```csharp
  builder.Services.AddSignalR();
  // CORS phải allow credentials cho SignalR
  app.MapHub<ChatHub>("/hubs/chat");
  app.MapHub<NotificationHub>("/hubs/notifications");
  app.MapHub<PokeHub>("/hubs/poke");
  ```

- [ ] **CORS update** — Thêm `AllowCredentials()` + `SetIsOriginAllowed` cho WebSocket

### 1.2 Frontend — Cài đặt SignalR client

```bash
npm install @microsoft/signalr
```

- [ ] **`src/api/signalr.ts`** — Singleton connection builder:
  ```ts
  const chatConnection = new HubConnectionBuilder()
    .withUrl('/hubs/chat', { accessTokenFactory: () => getToken() })
    .withAutomaticReconnect()
    .build();
  ```

- [ ] **`src/store/chatStore.ts`** (Zustand) — Quản lý SignalR connection state:
  - `connect()` / `disconnect()`
  - Listen `ReceiveMessage` event → append to messages
  - Handle reconnection

### 1.3 Migrate Chat từ Polling → SignalR

- [ ] **`MessengerView.tsx`** — Xóa `setInterval` polling
- [ ] Khi mở conversation → `JoinConversation(conversationId)` 
- [ ] Khi gửi tin nhắn → gọi API REST (lưu DB) + SignalR broadcast (real-time)
- [ ] Khi nhận `ReceiveMessage` event → append vào state không reload
- [ ] **Online indicator** — Track user connected/disconnected

### 1.4 Migrate Notifications → SignalR

- [ ] Khi backend tạo notification (like, comment, follow) → invoke `NotificationHub.SendNotification`
- [ ] **Frontend** — `NotificationStore` listen `ReceiveNotification` → update badge count + toast

### 1.5 Real-time Timestamp Auto-update

- [ ] **`src/utils/time.ts`** — `timeAgo()` đã có, wrap trong interval
- [ ] Component-level: `useEffect` với `setInterval(1 min)` để force re-render timestamps
- [ ] Hoặc dùng custom hook `useAutoRefreshTime(timestamp)` — trả về reactive string

---

## Phase 2 — Tương tác xã hội ✅ HOÀN THÀNH

> **Mục tiêu:** Reactions đúng nghĩa, hệ thống mention/hashtag, tính năng Poke vui nhộn.  
> **Ước tính:** 4–5 ngày | **Ưu tiên:** 🟠 HIGH

### 2.1 Reactions (5 loại cảm xúc)

**Backend:**
- [x] Thêm column `ReactionType` vào `PostLike` entity: `Like | Love | Wow | Angry | Sad`
- [x] Migration: `AddReactionTypeAndHashtags`
- [x] Update `POST /api/posts/{id}/like` → nhận `{ reactionType: string }`
- [x] Update `GET /api/posts/feed` → trả về `reactionCounts: { like: N, love: N, ... }` và `myReaction`

**Frontend:**
- [x] Thay thế các hình tròn màu hiện tại bằng emoji thật:
  - 👍 Thích | ❤️ Yêu | 😲 Bất ngờ | 😡 Tức giận | 😢 Buồn
- [x] Popup hover (giống Facebook) — delay 400ms
- [x] Optimistic update với rollback
- [x] Hiển thị top 3 reactions + tổng count trên PostCard

### 2.2 Mentions (@username)

> ⏸️ Chưa implement — sẽ xem xét ở phase sau nếu cần

**Backend:**
- [ ] Thêm `MentionedUserIds: int[]` vào `CreatePostDto` và `CreateCommentDto`
- [ ] `Post.Mentions` navigation property → bảng `PostMentions` (PostId, UserId)
- [ ] Khi tạo post/comment có mention → tạo Notification `type: Mention`

**Frontend:**
- [ ] Trong text input của CreatePostModal và CommentSidebar:
  - Detect `@` → popup tìm kiếm user (debounce 300ms)
  - Chèn `@username` với highlight styling
  - Parse mentions khi render post content → link tới profile
- [ ] Notification push realtime (SignalR) khi bị mention

### 2.3 Hashtag (#)

**Backend:**
- [x] Parse `#word` từ post content khi save → bảng `PostHashtags` (PostId, Tag)
- [x] `GET /api/posts/hashtag/{tag}` — lấy posts theo hashtag, paged
- [x] `GET /api/posts/trending-hashtags` — top hashtags 24h (COUNT GROUP BY)

**Frontend:**
- [x] Parse và render `#hashtag` trong post content → clickable link
- [x] Click → navigate tới trang hashtag feed (HashtagView)
- [x] Trang Hashtag Feed: list posts có tag đó + trending sidebar

### 2.4 Poke / "Khủng bố" (Real-time)

> Dùng SignalR từ Phase 1.

**Backend:**
- [x] `PokeHub.cs` — route `/hubs/poke`
- [x] `public async Task Poke(int targetUserId, string pokeType)`:
  - Validate caller ≠ target
  - Broadcast tới group `user_{targetUserId}` với `{ from, pokeType, timestamp }`
  - Rate limit: max 5 pokes/phút per user (in-memory ConcurrentDictionary)

**Frontend:**
- [x] Nút "Chọc" trên profile (với icon Zap)
- [x] Modal chọn loại poke (PokeModal):
  - 💸 Đòi nợ
  - 🍺 Rủ đi nhậu  
  - 🔔 Gõ mõ tụng kinh
  - 👻 Boo!
- [x] **Khi nhận poke** (PokeOverlay — SignalR event):
  - Screen shake animation (motion/react)
  - Icon rain effect: 30 icons rơi từ trên xuống
  - Mobile: `navigator.vibrate([200, 100, 200, 100, 200])`
  - Toast notification với icon poke type
  - Center card với emoji + label

---

## Phase 3 — Profile nâng cao & Quyền riêng tư ✅ HOÀN THÀNH

> **Mục tiêu:** Profile đầy đủ thông tin, tùy chỉnh privacy, settings module riêng.  
> **Ước tính:** 3–4 ngày | **Ưu tiên:** 🟠 MEDIUM-HIGH

### 3.1 Profile Enhancement

**Backend:**
- [x] Thêm vào `User` entity: `DateOfBirth` (đã có), `Hometown`, `Gender`
- [x] Migration: `AddProfileFieldsAndPostVisibility`
- [x] Update `UpdateUserDto` với các fields mới (Hometown, Gender)
- [x] `GET /api/users/{id}/followers` và `/following` — đã có BE, paged response

**Frontend — ProfileView.tsx:**
- [x] **Avatar change button** — nút camera overlay trên avatar → trigger upload
- [x] **Cover photo change** — nút "Đổi ảnh bìa" functional → upload + save
- [ ] **Followers/Following modal** — click số follower → modal danh sách user (deferred)
- [x] **Enhanced Edit Profile modal**:
  - FullName, Bio (đã có)
  - Thêm: DateOfBirth (date picker), Hometown (text), Gender (select)
  - Avatar + Cover upload trực tiếp trong modal (ImageUpload component)
- [x] **Tab "Ảnh"** — Grid ảnh từ posts có imageUrl của user
- [x] **Tab "Giới thiệu"** — Hiển thị bio, ngày sinh (formatted), quê quán, giới tính

### 3.2 Post Privacy

**Backend:**
- [x] Thêm `Visibility` string column vào `Post` entity: `Public | FollowersOnly | Private`
- [x] Migration: `AddProfileFieldsAndPostVisibility`
- [x] `GET /api/posts/feed` — filter theo visibility:
  - `Public`: tất cả thấy
  - `FollowersOnly`: chỉ followers + chính mình
  - `Private`: chỉ chủ bài
- [x] `GET /api/posts/user/{userId}` — filter visibility (owner thấy all, follower thấy Public+FollowersOnly, stranger chỉ Public)
- [x] `ValidateVisibility` helper — sanitize giá trị

**Frontend:**
- [x] Trong `CreatePostModal` — dropdown chọn audience:
  - 🌍 Công khai | 👥 Người theo dõi | 🔒 Riêng tư
- [x] Hiển thị icon visibility trên PostCard (Globe/Users/Lock)
- [x] Edit post cũng cho đổi visibility (UpdatePostDto.Visibility)

### 3.3 Settings Module

**Frontend:**
- [x] Tạo `SettingsView.tsx` — trang riêng trong layout chính
- [x] Bao gồm:
  - 🌙 Dark mode toggle (dùng themeStore)
  - 🔐 Đổi mật khẩu (form với validation)
  - 🔒 Privacy info
  - 🐛 Báo cáo sự cố
  - 📋 Thông tin tài khoản
  - 🚪 Đăng xuất
- [x] Nút Settings trên Sidebar (gear icon) → mở SettingsView

---

## Phase 4 — Hệ thống Danh hiệu (Badges/Titles) ✅ HOÀN THÀNH

> **Mục tiêu:** Gamification với hệ thống danh hiệu tự động và thủ công.  
> **Ước tính:** 5–7 ngày | **Ưu tiên:** 🟡 MEDIUM

### 4.1 Backend — Database Schema

**Entities mới:**
- [x] **`Badge`**: `Id, Name, Description, Icon (emoji/url), Color (hex), ConditionType, ConditionValue, IsManualOnly, CreatedAt`
- [x] **`UserBadge`**: `UserId, BadgeId, EarnedAt, IsDisplayed (bool — badge đang show)`
- [x] **`BadgeConditionType`** enum:
  - `PostCount` — số bài viết
  - `LikesReceived` — tổng lượt like nhận được
  - `CommentsCount` — số comment đã đăng
  - `FollowersCount` — số followers
  - `DaysActive` — số ngày có hoạt động (login/post)
  - `PokesSent` — số lần poke (tính năng Phase 2)
  - `Manual` — admin cấp thủ công

- [x] Migration: `AddBadgeSystem`
- [x] Seed data: 13 badge mặc định (Người mới, Blogger, Nhà văn, Blogger kỳ cựu, Được yêu thích, Ngôi sao, Influencer, Bình luận viên, Chọc phá, Kỳ cựu, Huyền thoại, VIP, Moderator)

### 4.2 Backend — Badge Logic

- [x] **`IBadgeService`** + **`BadgeService`**:
  - `CheckAndAwardBadgesAsync(int userId)` — chạy sau mỗi lần user có action
  - `AwardBadgeAsync(int userId, int badgeId)` — manual award
  - `RevokeBadgeAsync(int userId, int badgeId)` — manual revoke
  - `GetUserBadgesAsync(int userId)` — danh sách badge
  - `GetDisplayedBadgeAsync(int userId)` — badge đang hiển thị
  - `GetDisplayedBadgesForUsersAsync(IEnumerable<int> userIds)` — batch query tránh N+1
  - `GetBadgeProgressAsync(int userId)` — tiến độ badges
  - `SetDisplayBadgeAsync(int userId, int? badgeId)` — chọn badge hiển thị

- [x] **Badge check triggers** (fire-and-forget):
  - Sau `CreatePost` → `CheckAndAward(PostCount)`
  - Sau `Like` → `CheckAndAward(LikesReceived)` cho post owner
  - Sau `Follow` → `CheckAndAward(FollowersCount)` cho target user
  - Sau `Comment` → `CheckAndAward(CommentsCount)`

- [x] **`BadgeController`**:
  - `GET /api/badges` — all available badges
  - `GET /api/badges/user/{userId}` — user's earned badges
  - `PUT /api/badges/display` — chọn badge hiển thị
  - `GET /api/badges/progress` — tiến độ từng badge

### 4.3 Admin — Quản lý Badge

- [x] **Admin badge endpoints (trong AdminController)**:
  - `GET /api/admin/badges` — list all
  - `POST /api/admin/badges` — tạo badge mới
  - `PUT /api/admin/badges/{id}` — sửa
  - `DELETE /api/admin/badges/{id}` — xóa
  - `POST /api/admin/users/{userId}/badges/{badgeId}` — cấp thủ công
  - `DELETE /api/admin/users/{userId}/badges/{badgeId}` — thu hồi

- [x] **AdminBadgesView.tsx** — Tab "Danh hiệu" trong admin panel:
  - Bảng danh sách badges (name, icon, condition, usersCount)
  - Form tạo/sửa badge (name, emoji icon, hex color, condition type + value + preview)
  - User lookup để cấp/thu hồi thủ công

### 4.4 Frontend — Hiển thị Badge

- [x] **`BadgeChip.tsx`** component — hiển thị badge inline (sm/md size)
- [x] Thêm vào **PostCard**: sau username của author (displayed badge)
- [x] Thêm vào **CommentSidebar**: sau username (displayed badge)
- [x] Thêm vào **ProfileView**: ngay cạnh display name (displayed badge, size md)
- [x] **User Badge Management** — tab "Danh hiệu" trong Profile:
  - Grid badges đã mở khóa (highlight badge đang display)
  - Progress bar cho badges chưa đạt (có phần trăm tiến độ)
  - Nút chọn badge hiển thị (chỉ 1 badge active)
- [x] **DisplayedBadge** field trong UserSummaryDto và UserDto

---

## Phase 5 — Nội dung phong phú (AI, Stories, Reels)

> **Mục tiêu:** Content creation tools hấp dẫn.  
> **Ước tính:** 5–7 ngày | **Ưu tiên:** 🟡 MEDIUM

### 5.1 AI Post Generation (Gemini) ✅ DONE

> **Thay đổi so với kế hoạch gốc:** User cung cấp API key riêng (lưu localStorage), frontend gọi Gemini trực tiếp. Không cần backend proxy.

**Đã implement:**
- [x] `frontend/src/api/gemini.ts` — helper gọi Gemini REST API (`gemini-2.0-flash`), quản lý API key qua localStorage
- [x] `SettingsView.tsx` — GeminiKeySection: nhập/xoá API key, show/hide, link lấy key từ AI Studio
- [x] `CreatePostModal.tsx` — nút ✨ "Viết bằng AI" trong toolbar:
  - Input: chủ đề (bắt buộc), giọng văn (dropdown 6 options), từ khoá
  - Loading spinner, error toast, kết quả đổ vào textarea
  - Nút "Tạo lại bằng AI" khi đã có nội dung

### 5.2 Stories (24h) ✅ DONE

**Đã implement:**

**Backend:**
- [x] `Story` entity + `StoryView` entity (composite key StoryId+UserId)
- [x] Migration: `AddStories`
- [x] `StoriesController` (6 endpoints):
  - `GET /api/stories` — stories feed (following + bản thân, grouped by user)
  - `GET /api/stories/me` — stories của chính mình
  - `POST /api/stories` — tạo story mới (24h)
  - `POST /api/stories/{id}/view` — đánh dấu đã xem
  - `GET /api/stories/{id}/viewers` — danh sách viewers (chỉ owner)
  - `DELETE /api/stories/{id}` — xóa sớm
- [x] `StoryCleanupService` (IHostedService) — chạy mỗi 1h xóa stories hết hạn
- [x] `IStoryService` + `StoryService`

**Frontend:**
- [x] `StoriesRow` — Instagram-style row ở đầu Newsfeed, gradient ring cho unviewed, nút + tạo story
- [x] `StoryViewer` — fullscreen modal, progress bar, 5s auto-advance, keyboard nav (←→), pause, delete, viewers list
- [x] `StoryCreator` — chọn ảnh/video, preview 9:16, caption, upload + đăng

### 5.3 Reels (Video ngắn) ✅ DONE

**Đã implement:**

**Backend:**
- [x] Thêm `VideoUrl` vào `Post` entity + migration `AddVideoUrlToPost`
- [x] `POST /api/upload/video` — upload video (max 50MB, mp4/webm)
- [x] `GET /api/posts/reels` — batch Reels ngẫu nhiên (posts có video, public)
- [x] `wwwroot/videos/` tự tạo khi start app

**Frontend:**
- [x] `ReelView.tsx` — swipe-up/scroll/keyboard navigation, fullscreen video player, autoplay muted, actions sidebar (like/comment/share/mute), author overlay
- [x] Nút "Reels" (Film icon) trong Sidebar
- [x] `storyApi.ts` — API calls cho stories, reels, video upload

---

## Phase 6 — Admin nâng cao & Settings

> **Mục tiêu:** Admin panel hoàn chỉnh, settings hiện đại, trending thật.  
> **Ước tính:** 2–3 ngày | **Ưu tiên:** 🟢 LOW-MEDIUM

### 6.1 Admin Dark Mode Toggle

- [x] **`AdminLayout.tsx`** — Thêm Sun/Moon toggle button cạnh user info (dùng `themeStore` đã có)

### 6.2 Admin — Report Manager: Xóa bài vi phạm

- [x] **`AdminReportsView.tsx`** — Khi xem report có `targetPostId`:
  - Thêm nút "Xóa bài vi phạm" → gọi `DELETE /api/admin/posts/{postId}` + tự động resolve report
  - Confirmation dialog trước khi xóa

### 6.3 Trending thật từ Hashtag

> [TO CONFIRM — Q2: giả định tính từ DB, không dùng external API]

**Backend:**
- [x] `GET /api/posts/trending-hashtags` — tính TOP 10 hashtag trong 24h gần nhất

**Frontend:**
- [x] **`RightSidebar.tsx`** — Thay thế hardcoded trending bằng gọi API
- [x] Hiển thị `#hashtag` với post count, click để search

### 6.4 Admin Overview Stats cho Badge Management

- [x] **`AdminDashboardView`** — Thêm section "User Activity Leaderboard":
  - Top 10 users theo posts/likes/comments
  - Data này làm cơ sở để admin biết ai deserve badge

- [x] **Backend** `GET /api/admin/leaderboard` — trả top 10 users theo score (posts + likes + comments)

### 6.5 Settings Module

- [x] **`SettingsView.tsx`** — Goop tất cả settings vào 1 nơi:
  - 🔐 Đổi mật khẩu
  - 🔒 Privacy (post visibility default)
  - 🌙 Dark/Light mode
  - 🔔 Notification preferences (on/off từng loại) — localStorage
  - 🚪 Đăng xuất
  - 🐛 Báo cáo sự cố
- [x] **`NotificationsView.tsx`** — Lọc thông báo theo notification preferences

---

## Phase 7 — Admin Data Seeder (Sinh dữ liệu ngẫu nhiên để test)

> **Mục tiêu:** Admin có thể bấm 1 nút để sinh hàng chục/trăm user, post, comment, follow, reaction,  
> message ngẫu nhiên — giúp test pagination, trending, leaderboard… mà không cần nhập tay.  
> **Ước tính:** 1–2 ngày | **Ưu tiên:** 🟡 MEDIUM (chỉ dùng nội bộ, không ảnh hưởng production)

---

### Nguyên tắc thiết kế

| Quyết định | Lý do |
|---|---|
| Seeded data có prefix `seed_` ở `username` | Dễ nhận biết + cleanup sau này |
| Không dùng thư viện Faker/Bogus | Tránh thêm dependency, dùng word list nhỏ nội bộ là đủ |
| Endpoint trả về kết quả đồng bộ (không SSE) | Số lượng nhỏ (≤ 200 users, ≤ 1000 posts) nên response time chấp nhận được |
| Avatar dùng `https://picsum.photos/seed/{username}/100/100` | Không cần upload file, ảnh đẹp, stable URL |
| Cleanup bằng cờ `IsSeeded` trên bảng `users` | Xóa cascade sẽ tự dọn posts/comments/follows của seeded users |

---

### 7.0 Backend — Seed Engine nền tảng

**`SeedService.cs`** + **`ISeedService.cs`** tạo mới trong `Services/`:

```
Services/
├── Interfaces/ISeedService.cs
└── Implementations/SeedService.cs
```

**`ISeedService.cs`**:
```csharp
Task<SeedResultDto> SeedAsync(SeedOptionsDto options);
Task<SeedResultDto> ClearSeededDataAsync();
Task<SeedStatusDto> GetSeedStatusAsync(); // đếm bao nhiêu seeded entities đang có
```

**`SeedOptionsDto`** (request body):
```csharp
public record SeedOptionsDto(
    int UserCount,        // số fake user cần tạo (1–200)
    int PostsPerUser,     // số post mỗi user (0–20)
    int CommentsPerPost,  // số comment mỗi post (0–10)
    int FollowsPerUser,   // mỗi user follow bao nhiêu người khác ngẫu nhiên (0–30)
    int ReactionsPerPost, // số like/reaction ngẫu nhiên mỗi post (0–50)
    bool IncludeMessages, // có tạo conversation + messages không
    bool IncludeStories   // có tạo stories không
);
```

**`SeedResultDto`** (response):
```csharp
public record SeedResultDto(
    int UsersCreated, int PostsCreated, int CommentsCreated,
    int FollowsCreated, int ReactionsCreated,
    int MessagesCreated, int StoriesCreated,
    TimeSpan Duration
);
```

**Thêm cột `IsSeeded` vào bảng `users`** để đánh dấu:
- Migration mới: `AddIsSeededToUsers`
- `User.IsSeeded = true` cho tất cả user được tạo bởi seeder

---

### 7.1 Backend — Sinh Users

Logic trong `SeedService.SeedUsersAsync(int count)`:

```
Từ điển nội bộ (không cần thư viện):
- firstNames[]  = ["Minh", "Linh", "Huy", "Lan", "Nam", "Tú", "Hà", "Quân", ...]  // 30 tên
- lastNames[]   = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", ...]  // 20 họ
- bios[]        = ["Yêu lập trình", "Coffee addict", "Photography lover", ...]    // 15 bio mẫu

Mỗi user:
  username  = $"seed_{Guid.NewGuid():N}"[..12]   // unique, luôn bắt đầu bằng seed_
  email     = $"{username}@seed.test"
  fullName  = random(firstNames) + " " + random(lastNames)
  password  = BCrypt.HashPassword("Seed@1234")   // password cố định, dễ login test
  avatarUrl = $"https://picsum.photos/seed/{username}/100/100"
  bio       = random(bios)
  IsSeeded  = true
  Role      = "User"
  IsActive  = true
  createdAt = random trong 365 ngày gần nhất (để biểu đồ growth trông tự nhiên)
```

---

### 7.2 Backend — Sinh Posts + Hashtags + Reactions + Comments

**Posts** (`SeedPostsAsync`):

```
sampleContent[] = [
  "Hôm nay trời đẹp quá! #mood #life",
  "Code mãi không xong 😭 #dev #grind",
  "Cuối tuần chill thôi #weekend",
  "Ăn gì ngon chỉ tôi với #foodie #hcm",
  ...  // 20 mẫu content
]

sampleHashtags[] = ["life", "dev", "food", "travel", "mood", "coding",
                    "weekend", "hcm", "hanoi", "motivation", "selfie",
                    "nature", "music", "sport", "study"]

Mỗi post:
  content    = random(sampleContent) + thêm 1–3 hashtag ngẫu nhiên
  imageUrl   = 30% xác suất dùng "https://picsum.photos/seed/{Guid}/800/600"
  visibility = random("public", "followers", "private") với tỉ lệ 70/20/10
  createdAt  = random trong 90 ngày gần nhất
  hashtags   = parse từ content (# words)
```

**Reactions** (`SeedReactionsAsync`):
```
Với mỗi post, chọn ngẫu nhiên K seeded users (K = reactionsPerPost)
Tạo PostLike với reactionType ngẫu nhiên: "like"|"love"|"haha"|"wow"|"sad"|"angry"
Bỏ qua duplicate (user đã react post này rồi)
```

**Comments** (`SeedCommentsAsync`):
```
sampleComments[] = ["Quá đỉnh!", "Đồng ý 100%", "Haha đúng rồi",
                    "Hay lắm bạn ơi", "Ủng hộ!", "Tuyệt vời!", ...]  // 15 mẫu

Mỗi comment:
  content   = random(sampleComments)
  authorId  = random seeded user (≠ post author)
  parentId  = 20% xác suất là reply vào comment trước đó (tạo nested)
  createdAt = sau createdAt của post parent
```

---

### 7.3 Backend — Sinh Follow relationships

```
Với mỗi seeded user:
  Chọn K người khác ngẫu nhiên trong pool seeded users (K = followsPerUser)
  Tránh self-follow và duplicate
  Tạo Follow { FollowerId, FollowingId, CreatedAt = random }
```

> **Tác dụng:** Sau khi seed follows, `NewsfeedView` của seeded users sẽ có bài viết trong feed
> — giúp test infinite scroll, visibility filter thật sự.

---

### 7.4 Backend — Sinh Conversations + Messages (tuỳ chọn)

```
IncludeMessages = true:
  Chọn ngẫu nhiên 10–20 cặp seeded users
  Mỗi cặp tạo 1 Conversation + 5–15 Messages ngẫu nhiên xen kẽ nhau

sampleMessages[] = ["Alo bạn ơi", "Đi ăn chưa?", "Hôm nay bận không?",
                    "Xem meme này chưa?", "Gặp nhau cuối tuần nhé", ...]
```

---

### 7.5 Backend — Sinh Stories (tuỳ chọn)

```
IncludeStories = true:
  Với 50% seeded users:
    Tạo 1–3 stories
    imageUrl = "https://picsum.photos/seed/{Guid}/400/700"  (tỉ lệ portrait cho story)
    expiresAt = NOW() + 24h (hoặc random đã expired để test cleanup service)
```

---

### 7.6 Backend — Cleanup: Xóa toàn bộ seeded data

```csharp
// ClearSeededDataAsync():
var seededUsers = await _db.Users.Where(u => u.IsSeeded).Select(u => u.Id).ToListAsync();

// Xóa theo cascade thứ tự:
// PostLikes → Comments → PostHashtags → Posts
// → Messages → ConversationParticipants → Conversations  
// → StoryViews → Stories
// → Follows (follower hoặc following là seeded)
// → Notifications (actor hoặc recipient là seeded)
// → Users (IsSeeded = true)

// KHÔNG xóa Badges/UserBadges để không ảnh hưởng real admin data
```

---

### 7.7 Backend — SeedController

```
POST /api/admin/seed          — Kích hoạt seeder với options từ body
DELETE /api/admin/seed        — Xóa toàn bộ seeded data
GET /api/admin/seed/status    — Trả về bao nhiêu seeded entities đang có
```

Tất cả đều `[Authorize(Roles = "Admin")]`, log action vào console.

---

### 7.8 Frontend — `AdminSeedView.tsx`

**Vị trí:** `frontend/src/components/views/admin/AdminSeedView.tsx`  
**Thêm vào `AdminLayout.tsx`:** Link "🧪 Seed Data" trong sidebar navigation

**UI layout:**

```
┌── Seed Data ngẫu nhiên ───────────────────────────────────────────────┐
│  ⚠️ Chỉ dùng để test. Seeded data có thể xóa hàng loạt bất cứ lúc nào.│
├───────────────────────────────────────────────────────────────────────┤
│  [Status bar] 🟢 Hiện có: 45 users | 312 posts | 1.2k reactions      │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  👤 Số users     [====●====]  20          (range: 1 – 200)           │
│  📝 Posts/user   [==●======]  5           (range: 0 – 20)            │
│  💬 Comments/post[=●=======]  3           (range: 0 – 10)            │
│  👥 Follows/user [====●====]  10          (range: 0 – 30)            │
│  ❤️  Reactions/post[===●=====]  15        (range: 0 – 50)            │
│                                                                       │
│  ☑ Tạo Conversations + Messages                                       │
│  ☑ Tạo Stories                                                        │
│                                                                       │
│  [Ước tính: ~320 records sẽ được tạo]                                 │
│                                                                       │
│  [🌱 Bắt đầu Seed]              [🗑 Xóa toàn bộ Seeded Data]           │
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│  📋 Log kết quả lần cuối:                                             │
│  ✅ 20 users | 100 posts | 300 comments | 200 follows | 1500 reactions │
│  ⏱ Hoàn thành sau 1.2s                                               │
│  🔑 Password của tất cả seeded users: Seed@1234                       │
└───────────────────────────────────────────────────────────────────────┘
```

**State & logic:**
- Slider/number input cho mỗi tham số (dùng HTML `<input type="range">` + text display)
- Realtime estimate: `useMemo` tính tổng records ≈ `users × (1 + postsPerUser × (1 + commentsPerPost + reactionsPerPost)) + users × followsPerUser`
- Warning nếu estimate > 5000 records (có thể chậm)
- Loading state khi đang seed (disable nút, hiện spinner + "Đang tạo dữ liệu...")
- Confirmation dialog trước khi xóa seeded data (destructive action)
- Sau khi seed xong: hiện kết quả + toast success
- Gọi `GET /api/admin/seed/status` khi mount để hiện status bar hiện tại

---

### 7.9 Cập nhật Database

- [ ] **Migration:** `AddIsSeededToUser` — thêm `is_seeded BOOLEAN NOT NULL DEFAULT FALSE`
- [ ] **`database.sql`** — thêm `is_seeded` vào `CREATE TABLE users`
- [ ] **`DATABASE_SUMMARY.txt`** — cập nhật columns của bảng users

---

### Checklist implement theo thứ tự

```
Backend:
[x] 7.9  Migration AddIsSeededToUser + cập nhật User.cs
[x] 7.0  Tạo ISeedService + SeedResultDto + SeedOptionsDto + SeedStatusDto
[x] 7.1  Implement SeedService.SeedUsersAsync()
[x] 7.2  Implement SeedPostsAsync() + SeedReactionsAsync() + SeedCommentsAsync()
[x] 7.3  Implement SeedFollowsAsync()
[x] 7.4  Implement SeedMessagesAsync() (optional flag)
[x] 7.5  Implement SeedStoriesAsync() (optional flag)
[x] 7.6  Implement ClearSeededDataAsync() + GetSeedStatusAsync()
[x] 7.7  Thêm SeedController với 3 endpoints
[x] 7.7  DI: đăng ký ISeedService → SeedService trong Extensions

Frontend:
[x] 7.8  Tạo AdminSeedView.tsx
[x] 7.8  Thêm link "Seed Data" vào AdminLayout sidebar
[x] 7.8  Thêm route trong admin router (App.tsx)
```

### Done khi:
> Admin bấm "Bắt đầu Seed → 50 users" → trong vài giây DB có 50 fake users với posts, likes, comments.  
> Leaderboard, trending hashtags, growth chart hiện data thật sự.  
> Bấm "Xóa Seeded Data" → sạch hoàn toàn, không ảnh hưởng real users.

---

## 📦 Dependencies cần cài thêm

### Backend (NuGet)
| Package | Phase | Mục đích |
|---|---|---|
| `Microsoft.AspNetCore.SignalR` | Phase 1 | WebSocket real-time |
| `Microsoft.Extensions.Caching.Memory` | Phase 6 | Cache trending |

### Frontend (npm)
| Package | Phase | Mục đích |
|---|---|---|
| `@microsoft/signalr` | Phase 1 | SignalR client |
| `emoji-mart` | Phase 0 | Emoji picker |

---

## 🔗 Database migrations cần chạy (theo thứ tự)

```
Phase 0: (không có migrations mới, chỉ fix code)
Phase 2: AddReactionTypeToPostLike
         AddPostMentions
         AddPostHashtags
Phase 3: AddProfileFields (DateOfBirth, Hometown, Gender)
         AddPostVisibility
Phase 4: AddBadgeSystem (Badge, UserBadge tables)
Phase 5: AddStories
         AddVideoUrlToPost (hoặc AddReels)
```

---

## ✅ Điều kiện done cho mỗi Phase

| Phase | Done khi |
|---|---|
| 0 | Upload ảnh thành công, không duplicate chat, profile tabs hoạt động |
| 1 | Tin nhắn real-time không cần reload, notification badge cập nhật tức thì |
| 2 | 5 reactions hiện đúng emoji, @mention tạo notification, #hashtag clickable, poke rung màn hình |
| 3 | Avatar/cover đổi được, followers list mở được, post privacy hoạt động, settings page có |
| 4 | Badge hiện cạnh tên, user chọn badge, admin tạo/cấp badge được |
| 5 | AI generate content, story tự expire sau 24h, reel swipe-up play được |
| 6 | Trending từ DB thật, admin có dark mode, report có thể xóa bài trực tiếp |
| 7 | Admin seed 50 users trong < 3s, leaderboard & trending có data thật, "Xóa Seeded" dọn sạch không ảnh hưởng real users |
