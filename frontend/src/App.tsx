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
import AuthView from './components/views/AuthView';
import AdminLayout, { type AdminTab } from './components/admin/AdminLayout';
import AdminDashboardView from './components/views/admin/AdminDashboardView';
import AdminUsersView from './components/views/admin/AdminUsersView';
import AdminPostsView from './components/views/admin/AdminPostsView';
import AdminReportsView from './components/views/admin/AdminReportsView';

/**
 * Chuyển đổi UserDto (backend) sang UserProfile (kiểu cũ dùng trong mock views).
 * Khi Phase 10 hoàn thành, hàm này sẽ bị xóa cùng với UserProfile.
 */
function mapToUserProfile(user: UserDto): UserProfile {
  return {
    id: String(user.id ?? ''),
    name: user.fullName || user.username || 'Unknown',
    avatar: user.avatarUrl || `https://picsum.photos/seed/${user.username}/200/200`,
    cover: user.coverUrl || 'https://picsum.photos/seed/cover/1200/400',
    bio: user.bio || '',
    role: user.role || 'Member',
    followers: String(user.followersCount ?? 0),
    following: String(user.followingCount ?? 0),
    posts: '0', // TODO: thêm postsCount vào UserDto khi implement PostsController
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

  // Profile đang xem — mặc định là profile của chính mình
  const currentUserProfile = user ? mapToUserProfile(user) : null;
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(currentUserProfile);

  // Cập nhật selectedUser khi user trong store thay đổi (sau edit profile)
  useEffect(() => {
    if (user) setSelectedUser(mapToUserProfile(user));
  }, [user]);

  const handleLogout = () => {
    logout();
    setView('newsfeed');
  };

  const handleViewProfile = (profileUser: UserProfile) => {
    setSelectedUser(profileUser);
    setView('profile');
  };

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveCommentPost(null);
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
          {adminTab === 'reports'   && <AdminReportsView />}
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
            
            <section className={`${currentView === 'profile' ? 'lg:col-span-2' : 'min-w-0'}`}>
              <ErrorBoundary>
                <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentView}-${selectedUser?.id ?? 'me'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentView === 'newsfeed' && <NewsfeedView onOpenCreate={() => setIsCreateOpen(true)} onCommentClick={setActiveCommentPost} refreshKey={feedRefreshKey} />}
                  {currentView === 'profile' && <ProfileView user={selectedUser ?? undefined} onCommentClick={setActiveCommentPost} />}
                  {currentView === 'messenger' && <MessengerView />}
                  {currentView === 'search' && <SearchView onCommentClick={setActiveCommentPost} onUserClick={handleViewProfile} />}
                  {currentView === 'notifications' && <NotificationsView />}
                </motion.div>
                </AnimatePresence>
              </ErrorBoundary>
            </section>

            {activeCommentPost ? (
              <CommentSidebar post={activeCommentPost} onClose={() => setActiveCommentPost(null)} />
            ) : currentView !== 'profile' ? (
              <RightSidebar onUserClick={handleViewProfile} />
            ) : null}
          </main>

          <CreatePostModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onPostCreated={() => setFeedRefreshKey(k => k + 1)}
          />

          {/* Mobile Bottom Nav */}
          <nav className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-surface-container flex justify-around items-center h-16 px-4 z-50">
            <button onClick={() => setView('newsfeed')} className={`p-2 ${currentView === 'newsfeed' ? 'text-primary' : 'text-outline'}`}><Rss className="w-6 h-6" /></button>
            <button onClick={() => setView('search')} className={`p-2 ${currentView === 'search' ? 'text-primary' : 'text-outline'}`}><Search className="w-6 h-6" /></button>
            <button onClick={() => setIsCreateOpen(true)} className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg -mt-8 ring-4 ring-white">
              <Plus className="w-6 h-6" />
            </button>
            <button onClick={() => setView('notifications')} className={`p-2 ${currentView === 'notifications' ? 'text-primary' : 'text-outline'}`}><Bell className="w-6 h-6" /></button>
            <button onClick={() => currentUserProfile && handleViewProfile(currentUserProfile)} className={`p-2 ${currentView === 'profile' && selectedUser?.id === currentUserProfile?.id ? 'text-primary' : 'text-outline'}`}><User className="w-6 h-6" /></button>
          </nav>
        </>
      )}
    </div>
  );
}
