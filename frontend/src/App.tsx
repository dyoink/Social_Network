import { 
  Rss, 
  Search, 
  Bell, 
  User, 
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

// --- Types ---
import { View, UserProfile } from './types';
import type { PostDto } from './api/api-generated';

// --- State management ---
import useAuthStore from './store/authStore';
import type { UserDto } from './api/api-generated';
import { startAllConnections, stopAllConnections } from './api/signalr';

// --- Components ---
import { Toaster } from 'react-hot-toast';
import TopNav from './components/layout/TopNav';
import Sidebar from './components/layout/Sidebar';
import RightSidebar from './components/layout/RightSidebar';
import CreatePostModal from './components/feed/CreatePostModal';
import CommentSidebar from './components/feed/CommentSidebar';
import ErrorBoundary from './components/ui/ErrorBoundary';

// --- Views ---
import NewsfeedView from './components/views/NewsfeedView';
import ProfileView from './components/views/ProfileView';
import MessengerView from './components/views/MessengerView';
import SearchView from './components/views/SearchView';
import NotificationsView from './components/views/NotificationsView';
import HashtagView from './components/views/HashtagView';
import SettingsView from './components/views/SettingsView';
import ReelView from './components/views/ReelView';
import AuthView from './components/views/AuthView';
import AdminLayout, { type AdminTab } from './components/admin/AdminLayout';
import AdminDashboardView from './components/views/admin/AdminDashboardView';
import AdminUsersView from './components/views/admin/AdminUsersView';
import AdminPostsView from './components/views/admin/AdminPostsView';
import AdminReportsView from './components/views/admin/AdminReportsView';
import AdminCommentsView from './components/views/admin/AdminCommentsView';
import AdminBadgesView from './components/admin/AdminBadgesView';
import AdminSeedView from './components/views/admin/AdminSeedView';
import PokeOverlay from './components/poke/PokeOverlay';

/**
 * Chuyển đổi UserDto (backend) sang UserProfile (kiểu cũ dùng trong mock views).
 * Khi Phase 10 hoàn thành, hàm này sẽ bị xóa cùng với UserProfile.
 */
function mapToUserProfile(user: UserDto): UserProfile {
  return {
    id: String(user.id ?? ''),
    username: user.username || '',
    name: user.fullName || user.username || 'Unknown',
    avatar: user.avatarUrl || `https://picsum.photos/seed/${user.username}/200/200`,
    cover: user.coverUrl || 'https://picsum.photos/seed/cover/1200/400',
    bio: user.bio || '',
    role: user.role || 'Member',
    followers: String(user.followersCount ?? 0),
    following: String(user.followingCount ?? 0),
    posts: String(user.postsCount ?? 0),
    isFollowing: user.isFollowing,
    createdAt: user.createdAt,
    dateOfBirth: user.dateOfBirth ?? undefined,
    hometown: user.hometown ?? undefined,
    gender: user.gender ?? undefined,
    displayedBadge: user.displayedBadge,
  };
}

export default function App() {
  // --- Auth state từ Zustand store (được persist vào localStorage) ---
  const { user, isAuthenticated, logout } = useAuthStore();

  const [currentView, setView] = useState<View>('newsfeed');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState<PostDto | null>(null);
  // Tăng key để NewsfeedView tự refresh sau khi đăng bài mới
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);
  // Target user ID để mở conversation trong Messenger (từ Profile "Nhắn tin")
  const [messengerTargetUserId, setMessengerTargetUserId] = useState<number | null>(null);
  // Hashtag đang xem
  const [activeHashtag, setActiveHashtag] = useState<string>('');

  // Profile đang xem — mặc định là profile của chính mình
  const currentUserProfile = user ? mapToUserProfile(user) : null;
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(currentUserProfile);

  // Cập nhật selectedUser khi user trong store thay đổi (sau edit profile)
  useEffect(() => {
    if (user) setSelectedUser(mapToUserProfile(user));
  }, [user]);

  // Khởi động / dừng SignalR connections theo trạng thái đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      startAllConnections();
    }
    return () => { stopAllConnections(); };
  }, [isAuthenticated]);

  const handleLogout = () => {
    stopAllConnections();
    logout();
    setView('newsfeed');
  };

  const handleViewProfile = (profileUser: UserProfile) => {
    setSelectedUser(profileUser);
    setView('profile');
  };

  const handleMessageUser = (targetUserId: number) => {
    setMessengerTargetUserId(targetUserId);
    setView('messenger');
  };

  const handleHashtagClick = (tag: string) => {
    setActiveHashtag(tag);
    setView('hashtag');
  };

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveCommentPost(null);
    // Reset messenger target khi rời khỏi Messenger
    if (currentView !== 'messenger') setMessengerTargetUserId(null);
  }, [currentView, selectedUser]);

  return (
    <div className="min-h-screen bg-surface">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px' },
        }}
      />
      {!isAuthenticated ? (
        // AuthView tự gọi authStore.setAuth() — không cần onLogin callback
        <AuthView />
      ) : currentView === 'admin' && user?.role === 'Admin' ? (
        // Admin panel — giao diện riêng biệt
        <AdminLayout activeTab={adminTab} setTab={setAdminTab} onExit={() => setView('newsfeed')}>
          {adminTab === 'dashboard' && <AdminDashboardView />}
          {adminTab === 'users'     && <AdminUsersView />}
          {adminTab === 'posts'     && <AdminPostsView />}
          {adminTab === 'comments'  && <AdminCommentsView />}
          {adminTab === 'reports'   && <AdminReportsView />}
          {adminTab === 'badges'   && <AdminBadgesView />}
          {adminTab === 'seed'     && <AdminSeedView />}
        </AdminLayout>
      ) : (
        <>
          <TopNav 
            currentView={currentView} 
            setView={setView} 
            onProfileClick={() => currentUserProfile && handleViewProfile(currentUserProfile)} 
            onLogout={handleLogout}
            user={currentUserProfile}
          />
          
          <main className="pt-24 pb-12 max-w-[1440px] mx-auto px-6 grid grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[260px_1fr_320px] gap-8">
            <Sidebar 
              currentView={currentView} 
              setView={setView} 
              onOpenCreate={() => setIsCreateOpen(true)} 
              onProfileClick={() => currentUserProfile && handleViewProfile(currentUserProfile)} 
              user={currentUserProfile}
            />
            
            <section className={`${currentView === 'profile' && !activeCommentPost ? 'lg:col-span-2' : 'min-w-0'}`}>
              <ErrorBoundary>
                <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentView}-${selectedUser?.id ?? 'me'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentView === 'newsfeed' && <NewsfeedView onOpenCreate={() => setIsCreateOpen(true)} onCommentClick={setActiveCommentPost} refreshKey={feedRefreshKey} onHashtagClick={handleHashtagClick} />}
                  {currentView === 'profile' && <ProfileView user={selectedUser ?? undefined} onCommentClick={setActiveCommentPost} onMessageClick={handleMessageUser} onHashtagClick={handleHashtagClick} onUserClick={handleViewProfile} />}
                  {currentView === 'messenger' && <MessengerView targetUserId={messengerTargetUserId} />}
                  {currentView === 'search' && <SearchView onCommentClick={setActiveCommentPost} onUserClick={handleViewProfile} onHashtagClick={handleHashtagClick} />}
                  {currentView === 'notifications' && (
                    <NotificationsView 
                      onPostClick={setActiveCommentPost} 
                      onUserClick={handleViewProfile} 
                    />
                  )}
                  {currentView === 'hashtag' && activeHashtag && <HashtagView tag={activeHashtag} onBack={() => setView('newsfeed')} onCommentClick={setActiveCommentPost} onHashtagClick={handleHashtagClick} />}
                  {currentView === 'settings' && <SettingsView onLogout={handleLogout} />}
                  {currentView === 'reels' && <ReelView />}
                </motion.div>
                </AnimatePresence>
              </ErrorBoundary>
            </section>

            {activeCommentPost ? (
              <CommentSidebar
                post={activeCommentPost}
                onClose={() => setActiveCommentPost(null)}
                onCommentAdded={() => {
                  // Cập nhật commentsCount optimistic trên post đang xem
                  setActiveCommentPost(prev => prev ? { ...prev, commentsCount: (Number(prev.commentsCount ?? 0) + 1) } : prev);
                }}
              />
            ) : currentView !== 'profile' ? (
              <RightSidebar onUserClick={handleViewProfile} onHashtagClick={handleHashtagClick} />
            ) : null}
          </main>

          <CreatePostModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onPostCreated={() => setFeedRefreshKey(k => k + 1)}
            onNavigateSettings={() => { setIsCreateOpen(false); setView('settings'); }}
          />

          {/* Mobile Bottom Nav */}
          <nav className="md:hidden fixed bottom-0 w-full bg-surface-container-lowest/90 backdrop-blur-xl border-t border-outline-variant/20 flex justify-around items-center h-16 px-4 z-50">
            <button onClick={() => setView('newsfeed')} className={`p-2 ${currentView === 'newsfeed' ? 'text-primary' : 'text-outline'}`}><Rss className="w-6 h-6" /></button>
            <button onClick={() => setView('search')} className={`p-2 ${currentView === 'search' ? 'text-primary' : 'text-outline'}`}><Search className="w-6 h-6" /></button>
            <button onClick={() => setIsCreateOpen(true)} className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg -mt-8 ring-4 ring-surface-container-lowest">
              <Plus className="w-6 h-6" />
            </button>
            <button onClick={() => setView('notifications')} className={`p-2 ${currentView === 'notifications' ? 'text-primary' : 'text-outline'}`}><Bell className="w-6 h-6" /></button>
            <button onClick={() => currentUserProfile && handleViewProfile(currentUserProfile)} className={`p-2 ${currentView === 'profile' && selectedUser?.id === currentUserProfile?.id ? 'text-primary' : 'text-outline'}`}><User className="w-6 h-6" /></button>
          </nav>

          {/* Poke overlay — hiển thị full-screen effect khi nhận poke */}
          <PokeOverlay />
        </>
      )}
    </div>
  );
}
