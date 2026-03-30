# 🎨 FRONTEND DEVELOPMENT PLAN — Social Network UI

> **Tech Stack:** React 19 · TypeScript · Vite · TailwindCSS v4 · Motion (Framer) · Lucide Icons  
> **Backend:** REST API (PostgreSQL only, không MongoDB/Redis giai đoạn này)  
> **Tình trạng (30/03/2026):** Tất cả views đã kết nối API thật. Admin panel hoàn chỉnh. Còn một số tech debt cần dọn.

---

## 📊 Phân tích hiện trạng THỰC TẾ

### ✅ Đã hoàn thành và kết nối API thật
| Component | Trạng thái thực tế |
|---|---|
| `AuthView` | ✅ Login/Register → authStore → api-generated (không còn fake setTimeout) |
| `NewsfeedView` | ✅ `useFeed` hook → `getApiPostsFeed` — paged, load more |
| `PostCard` | ✅ Like/unlike → `postApiPostsIdLike` — optimistic + rollback |
| `CommentSidebar` | ✅ Load + submit comments → `getApiCommentsPostPostId` / `postApiComments` |
| `ProfileView` | ✅ `getApiUsersUsername` + `getApiPostsUserUserId` + follow toggle |
| `MessengerView` | ✅ Conversations + messages REST + polling |
| `SearchView` | ✅ `getApiUsersSearch` với debounce 400ms |
| `NotificationsView` | ✅ `getApiNotifications` + mark read + badge count |
| `CreatePostModal` | ✅ `postApiPosts` + `ImageUpload` component |
| `Sidebar` | ✅ User info từ authStore, link Admin Panel cho role Admin |
| `TopNav` | ✅ Unread count badge, logout |
| `RightSidebar` | ✅ `getApiUsersSuggestions` — gợi ý follow từ API thật |
| `AdminLayout` | ✅ Tab navigation Dashboard/Users/Posts/Reports |
| `AdminDashboardView` | ✅ `getApiAdminStats` — 6 stat cards |
| `AdminUsersView` | ✅ CRUD admin users — ban, role change, delete |
| `AdminPostsView` | ✅ Xem bài + xóa vi phạm với report count |
| `AdminReportsView` | ✅ Filter pending/resolved, resolve action |
| `ReportModal` | ✅ Báo cáo từ PostCard `...` menu → `postApiReports` |

### ⚠️ Tech debt — cần giải quyết

| Hạng mục | Vấn đề |
|---|---|
| `src/types.ts` | `UserProfile` + `Post` interface cũ — vẫn dùng làm bridge trong App.tsx |
| `src/types/api.types.ts` | Nhiều types trùng lặp với `api-generated.ts` |
| `src/api/authApi.ts` | Chỉ là re-export deprecated — nên xóa |
| `src/data/mockData.ts` | `MOCK_USER` vẫn được import — nên xóa |
| `@google/genai` + `express` | Unused packages trong package.json (leftover từ template) |
| `VITE_GEMINI_API_KEY` trong vite.config.ts | Cần thiết cho Gemini — giữ lại |

### ⬜ Chưa làm (tính năng còn thiếu)

| Hạng mục | Mức độ |
|---|---|
| ~~UI: Nút Sửa / Xóa bài cho chủ bài (PostCard)~~ | ✅ Xong |
| ~~UI: Profile edit modal/form~~ | ✅ Xong |
| ~~Infinite scroll thực sự (IntersectionObserver)~~ | ✅ Xong |
| ~~UI: Reply threading hiển thị nested~~ | ✅ Xong |
| ~~Skeleton loading~~ | ✅ Xong |
| ~~Toast notifications~~ | ✅ Xong |
| ~~Error boundary component~~ | ✅ Xong |

### ❌ Ngoài scope (không làm)
- ~~SignalR real-time~~ — Messenger dùng REST polling
- ~~WebSocket client~~ — thêm khi cần real-time thực sự

---

## 🗺️ Cấu trúc thư mục thực tế hiện tại

```
frontend/src/
├── api/
│   ├── axios.ts              ← axios instance, JWT interceptor, 401→logout
│   ├── mutator.ts            ← orval mutator wrapper
│   ├── api-generated.ts      ← AUTO-GEN từ OpenAPI spec (KHÔNG sửa tay)
│   └── authApi.ts            ← ⚠️ deprecated, chỉ re-export
├── store/
│   └── authStore.ts          ← Zustand + persist localStorage
├── hooks/
│   └── useFeed.ts            ← feed state + pagination + optimistic like
├── components/
│   ├── feed/
│   │   ├── PostCard.tsx       ← like, report modal
│   │   ├── CommentSidebar.tsx ← load + submit comments
│   │   └── CreatePostModal.tsx← tạo bài + upload ảnh
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopNav.tsx
│   │   └── RightSidebar.tsx
│   ├── admin/
│   │   ├── AdminLayout.tsx
│   │   └── StatCard.tsx
│   └── views/
│       ├── AuthView.tsx
│       ├── NewsfeedView.tsx
│       ├── ProfileView.tsx
│       ├── MessengerView.tsx
│       ├── SearchView.tsx
│       ├── NotificationsView.tsx
│       ├── ReportModal.tsx
│       └── admin/
│           ├── AdminDashboardView.tsx
│           ├── AdminUsersView.tsx
│           ├── AdminPostsView.tsx
│           └── AdminReportsView.tsx
├── types/
│   ├── api.types.ts           ← ⚠️ partially redundant với api-generated
│   └── (xem types.ts ở root)
├── types.ts                   ← ⚠️ legacy bridge types (UserProfile, Post cũ)
└── data/
    └── mockData.ts            ← ⚠️ MOCK_USER vẫn còn, cần xóa dần

```

---

## 🗺️ Lộ trình ban đầu (lưu để tham khảo)

### 📦 Phase 1 — Foundation: API Layer & Auth (Làm đầu tiên)

#### 1.1 Cài thêm dependencies cần thiết

```bash
# HTTP client
npm install axios

# State management
npm install zustand

# Form validation
npm install react-hook-form zod @hookform/resolvers
```

#### 1.2 Cấu trúc thư mục đề xuất

```
frontend/src/
├── api/                    ← MỚI: tất cả API calls
│   ├── axios.ts            ← axios instance với interceptors
│   ├── authApi.ts
│   ├── postsApi.ts
│   ├── usersApi.ts
│   ├── commentsApi.ts
│   ├── messagesApi.ts
│   └── notificationsApi.ts
├── store/                  ← MỚI: Zustand global state
│   ├── authStore.ts        ← user, token, isAuthenticated
│   ├── postsStore.ts       ← posts feed, pagination
│   ├── notificationsStore.ts
│   └── messagesStore.ts
├── hooks/                  ← MỚI: custom hooks
│   ├── useAuth.ts
│   ├── usePosts.ts
│   ├── useInfiniteScroll.ts
│   └── useSignalR.ts
├── components/
│   ├── feed/
│   ├── layout/
│   ├── views/
│   └── ui/                 ← MỚI: shared UI components
│       ├── Spinner.tsx
│       ├── ErrorMessage.tsx
│       ├── Avatar.tsx
│       └── EmptyState.tsx
├── types/
│   ├── api.types.ts        ← types match với backend DTOs
│   └── ui.types.ts         ← types cho UI state
├── lib/
│   ├── signalr.ts          ← SignalR connection
│   └── utils.ts
└── router/
    └── index.tsx           ← React Router config
```

#### 1.3 Axios Instance với JWT interceptor

```typescript
// src/api/axios.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Tự động attach JWT token vào mọi request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Tự động refresh token khi nhận 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Gọi refresh token endpoint
      // Nếu fail → logout
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### 1.4 Auth Store (Zustand)

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';   ← lưu vào localStorage

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      login: async (credentials) => {
        const res = await authApi.login(credentials);
        set({ user: res.user, accessToken: res.token, isAuthenticated: true });
      },
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }  // persist key trong localStorage
  )
);
```

#### 1.5 Refactor AuthView — kết nối API thật

**Hiện tại (xấu):**
```typescript
// Fake với setTimeout
setTimeout(() => {
  onLogin({ id: 'user-1', name: isLogin ? 'Alex Thompson' : name, ... });
}, 1500);
```

**Sau khi refactor:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Bắt buộc'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

// Trong component:
const { login } = useAuthStore();
const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
  resolver: zodResolver(loginSchema)
});

const onSubmit = async (data) => {
  try {
    await login(data);
    // navigate to newsfeed tự động vì isAuthenticated thay đổi
  } catch (err) {
    setError(err.response?.data?.message || 'Đăng nhập thất bại');
  }
};
```

---

### 📦 Phase 2 — Kết nối các tính năng Core

#### 2.1 Types — Đồng bộ với Backend DTOs

```typescript
// src/types/api.types.ts — THAY THẾ types.ts hiện tại

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export interface UserDto {
  id: number;              // ← backend dùng int, không phải string
  username: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  role: string;
  followersCount: number;  // ← số thực từ DB
  followingCount: number;
  createdAt: string;
}

export interface PostDto {
  id: number;
  user: UserSummaryDto;
  content: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}
```

**Lưu ý quan trọng về type mismatch:**
> Backend dùng `int` cho IDs, frontend hiện dùng `string`. Khi kết nối API thật phải đổi `id: string` → `id: number` trong `UserProfile` và `Post` types.

#### 2.2 Posts — Infinite Scroll Feed

```typescript
// src/hooks/usePosts.ts
import { useState, useCallback } from 'react';
import postsApi from '../api/postsApi';

export function useInfinitePosts() {
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    const res = await postsApi.getFeed({ page, pageSize: 10 });
    setPosts(prev => [...prev, ...res.items]);
    setHasMore(res.hasNextPage);
    setPage(p => p + 1);
    setIsLoading(false);
  }, [page, isLoading, hasMore]);

  return { posts, loadMore, isLoading, hasMore };
}
```

**NewsfeedView sau refactor:**
```tsx
const NewsfeedView = () => {
  const { posts, loadMore, isLoading } = useInfinitePosts();
  const { ref: loadMoreRef } = useIntersectionObserver(loadMore); // trigger khi scroll đến cuối
  
  return (
    <div>
      {posts.map(post => <PostCard key={post.id} post={post} />)}
      <div ref={loadMoreRef} />
      {isLoading && <Spinner />}
    </div>
  );
};
```

#### 2.3 Search — Debounce + Real API

```typescript
// Hiện tại: search không hoạt động, input không bind state
// Sau refactor:

const SearchView = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400); // delay 400ms
  
  const { data: results, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });
  
  return (
    <input 
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder="Tìm kiếm người dùng, bài viết..."
    />
    // ...
  );
};
```

#### 2.4 CreatePostModal — Upload ảnh thật

```tsx
// Hiện tại: modal có UI nhưng không làm gì
// Sau refactor:

const CreatePostModal = ({ onClose }: Props) => {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate: max 10MB, chỉ image/*
    if (file.size > 10 * 1024 * 1024) return alert('File quá lớn (max 10MB)');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let imageUrl: string | undefined;
    if (imageFile) {
      const formData = new FormData();
      formData.append('file', imageFile);
      const res = await uploadApi.uploadImage(formData);
      imageUrl = res.url;
    }
    await postsApi.createPost({ content, imageUrl });
    onClose();
    // refresh feed
  };
};
```

#### 2.5 ProfileView — Kết nối API Profile thật

```tsx
// ProfileView nhận userId, fetch từ API
const ProfileView = ({ userId }: { userId: number }) => {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersApi.getProfile(userId),
  });
  
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: () => postsApi.getUserPosts(userId),
  });
  
  const handleFollow = async () => {
    await usersApi.toggleFollow(userId);
    // invalidate query để refetch
  };
  
  if (isLoading) return <ProfileSkeleton />;
  // ...
};
```

---

---

### 📦 Phase 3 — Messenger (REST) & Notifications

#### 3.1 MessengerView — Kết nối REST API (không cần real-time ngay)

```tsx
const MessengerView = () => {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesApi.getConversations,
  });

  const { data: messages, refetch } = useQuery({
    queryKey: ['messages', activeConversationId],
    queryFn: () => messagesApi.getMessages(activeConversationId!),
    enabled: !!activeConversationId,
    refetchInterval: 5000, // polling mỗi 5 giây (thay cho real-time tạm thời)
  });

  const handleSend = async () => {
    if (!messageText.trim() || !activeConversationId) return;
    await messagesApi.sendMessage(activeConversationId, messageText);
    setMessageText('');
    refetch();
  };
};
```

#### 3.2 NotificationsView — Kết nối REST API

```tsx
const NotificationsView = () => {
  const { data: notifications, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
  });

  const handleMarkRead = async (id: number) => {
    await notificationsApi.markRead(id);
    refetch();
  };
};
```

#### 3.3 Mở rộng tương lai: SignalR real-time

Khi backend thêm SignalR Hub, chỉ cần:
```bash
npm install @microsoft/signalr
```
Thêm `src/hooks/useSignalR.ts` và thay polling bằng WebSocket — không cần refactor component.

---

### 📦 Phase 4 — React Router & Navigation

#### 4.1 Thay custom View state bằng React Router

**Hiện tại:** `useState<View>('newsfeed')` — URL không thay đổi, không thể share link  
**Sau refactor:** URL-based routing

```tsx
// src/router/index.tsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedLayout />,  // check auth, render Sidebar + TopNav
    children: [
      { index: true, element: <NewsfeedView /> },
      { path: 'profile/:userId', element: <ProfileView /> },
      { path: 'messages', element: <MessengerView /> },
      { path: 'messages/:conversationId', element: <MessengerView /> },
      { path: 'search', element: <SearchView /> },
      { path: 'notifications', element: <NotificationsView /> },
      { path: 'bookmarks', element: <BookmarksView /> },    // thêm mới
      { path: 'settings', element: <SettingsView /> },      // thêm mới
    ],
  },
  { path: '/auth', element: <AuthView /> },
]);
```

---

### 📦 Phase 5 — Views còn thiếu & Tính năng bổ sung

#### 5.1 SettingsView (link đang hiển thị trong sidebar nhưng không có route)

Các cài đặt cần có:
- Đổi avatar / cover photo
- Chỉnh sửa thông tin profile (FullName, Bio, Birthday)
- Đổi mật khẩu (nhập password cũ + password mới)
- Cài đặt thông báo (bật/tắt theo loại)
- Xóa tài khoản

#### 5.2 BookmarksView (link đang hiển thị nhưng không có route)

- Grid hiển thị posts đã save
- Cần thêm `POST /api/posts/{id}/bookmark` ở backend
- Cần thêm `BookmarkButton` vào `PostCard`

#### 5.3 RightSidebar — Hiện đang trống

```tsx
// Cần populate với data thật:
const RightSidebar = () => (
  <aside>
    {/* Gợi ý người dùng nên follow */}
    <SuggestedUsers /> ← GET /api/users/suggestions

    {/* Trending posts / hashtags */}
    <TrendingSection />

    {/* Mini calendar hoặc upcoming events */}
  </aside>
);
```

#### 5.4 Tính năng Share Post

- Modal hiển thị preview post
- Copy link to clipboard
- Share to messenger (tạo conversation với attach post)

---

### 📦 Phase 6 — UX Improvements & Polish

#### 6.1 Skeleton Loading (thay vì spinner)

```tsx
// Mỗi view cần có skeleton tương ứng
const PostCardSkeleton = () => (
  <div className="bg-surface-container-lowest rounded-xl p-6 animate-pulse">
    <div className="flex gap-3 mb-5">
      <div className="w-11 h-11 rounded-full bg-surface-container-high" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-surface-container-high rounded" />
        <div className="h-3 w-20 bg-surface-container-high rounded" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-surface-container-high rounded w-full" />
      <div className="h-4 bg-surface-container-high rounded w-3/4" />
    </div>
  </div>
);
```

#### 6.2 Error Boundary

```tsx
// src/components/ui/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <ErrorFallback />;
    return this.props.children;
  }
}
```

#### 6.3 Toast Notifications

```bash
npm install react-hot-toast
```

```tsx
// Dùng cho: post created, liked, followed, message sent, error
toast.success('Đăng bài thành công!');
toast.error('Có lỗi xảy ra, vui lòng thử lại');
```

#### 6.4 Optimistic Updates — UX mượt mà hơn

```tsx
// Like post: cập nhật UI ngay, không đợi API
const handleLike = async (postId: number) => {
  // 1. Cập nhật UI ngay (optimistic)
  setPosts(prev => prev.map(p => 
    p.id === postId 
      ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 }
      : p
  ));
  
  try {
    await postsApi.likePost(postId);
  } catch {
    // 2. Rollback nếu API fail
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 }
        : p
    ));
  }
};
```

---

## 📋 Checklist triển khai

> **Trạng thái hiện tại (30/03/2026): Phase 1–3 hoàn toàn xong. Phase 4 chưa làm.**

### Phase 1 — API Layer & Auth ✅ XONG
- [x] Cài `axios`, `zustand` (không cần react-router-dom — dùng custom View state)
- [x] Tạo `frontend/.env`: `VITE_API_URL=http://localhost:5204/api`
- [x] Tạo `src/api/axios.ts` với interceptors JWT + 401→logout
- [x] Tạo `src/store/authStore.ts` (Zustand + persist localStorage)
- [x] Setup Orval code generator: `orval.config.ts` → `api-generated.ts`
- [x] Refactor `AuthView` — gọi API thật, không còn fake setTimeout
- [x] Route protection — redirect `/auth` nếu chưa đăng nhập
- [x] Cập nhật `src/types/api.types.ts` đồng bộ backend DTOs

### Phase 2 — Core Features ✅ XONG
- [x] `src/hooks/useFeed.ts` — paginated feed + optimistic like
- [x] `NewsfeedView` — real data + load more button
- [x] `PostCard` — like toggle gọi API + optimistic + rollback
- [x] `CommentSidebar` — load/submit comments thật
- [x] `ProfileView` — fetch user + posts thật + follow toggle
- [x] `SearchView` — debounce 400ms + users search API
- [x] `CreatePostModal` — `ImageUpload` component + submit API
- [x] `RightSidebar` — suggestions API thật

### Phase 3 — Messenger & Notifications ✅ XONG
- [x] `MessengerView` — conversations + send REST + polling
- [x] `NotificationsView` — notifications thật + mark read
- [x] Notification badge (unread count) trên TopNav
- [x] `UploadController` backend + `ImageUpload` component frontend

### Phase 4 — Admin Panel ✅ XONG
- [x] `AdminLayout.tsx` + `StatCard.tsx`
- [x] `AdminDashboardView.tsx` — stats API
- [x] `AdminUsersView.tsx` — ban/role/delete users
- [x] `AdminPostsView.tsx` — xem và xóa bài vi phạm
- [x] `AdminReportsView.tsx` — filter + resolve reports
- [x] `ReportModal.tsx` — báo cáo từ PostCard menu

### Phase 5 — Tính năng còn thiếu ✅ XONG (30/03/2026)
- [x] UI: Nút Sửa / Xóa bài cho **chủ bài** trong PostCard (+ toast feedback)
- [x] UI: Profile edit modal — form chỉnh FullName, Bio, AvatarUrl, CoverUrl (+ toast)
- [x] UI: Reply threading — hiển thị replies thụt vào trong CommentSidebar
- [x] Infinite scroll thực sự (IntersectionObserver thay "Tải thêm" button)
- [x] Skeleton loading component (`PostCardSkeleton.tsx` tái sử dụng được)
- [x] Toast notifications (`react-hot-toast`) — edit/delete post, profile save, comment error
- [x] Error boundary component (`ErrorBoundary.tsx`) — bao quanh main content section

### Còn thiếu — Tech debt cleanup
- [ ] Xóa `src/api/authApi.ts` (deprecated re-export)
- [ ] Xóa `src/data/mockData.ts` hoặc bỏ import MOCK_USER
- [ ] Consolidate `src/types.ts` + `src/types/api.types.ts` (đang dư thừa)
- [ ] Xóa `@google/genai` + `express` khỏi package.json (nếu không dùng Gemini)
- [ ] Xóa `VITE_GEMINI_API_KEY` khỏi vite.config.ts

---

## 🔧 Environment Variables (hiện tại)

```env
# frontend/.env (development — đang dùng)
VITE_API_URL=http://localhost:5204/api

# frontend/.env.production
VITE_API_URL=https://your-domain.com/api
```

---

## ⚠️ Tech debt còn lại (vấn đề đã biết)

### 1. Legacy bridge type trong App.tsx

```typescript
// App.tsx dùng mapToUserProfile() để convert UserDto → UserProfile cũ
// Cần loại bỏ UserProfile type và dùng UserDto trực tiếp
```

### 2. `src/types/api.types.ts` dư thừa

```typescript
// Nhiều types (PostDto, CommentDto...) định nghĩa 2 lần:
// một lần trong api-generated.ts, một lần trong api.types.ts
// → Nên import từ api-generated.ts hoàn toàn
```

### 3. Unused packages từ template gốc

```bash
npm uninstall @google/genai express  # leftover từ AI Studio template
```

---

## ⚡ Thứ tự ưu tiên hiện tại (tech debt + features còn thiếu)

```
✅ 1–10: Phase 1–4 đã xong hoàn toàn
✅ 11: UI Sửa/Xóa bài cho chủ bài (PostCard) — xong
✅ 12: UI Profile edit modal — xong
✅ 13: Reply threading CommentSidebar — xong
✅ 14: Infinite scroll (IntersectionObserver) — xong
✅ 15: Skeleton loading (PostCardSkeleton) — xong
✅ 16: Toast notifications (react-hot-toast) — xong
✅ 17: Error boundary component — xong

Còn lại (tech debt, không blocking):
18. Xóa deprecated files (authApi.ts, mockData.ts)
19. Consolidate types (src/types.ts + api.types.ts)
20. Xóa express packages nếu không cần
21. [Tương lai] Settings: PUT /api/users/me/password mới (UI)
22. [Tương lai] Bookmarks feature
23. [Tương lai] SignalR real-time messaging
```
