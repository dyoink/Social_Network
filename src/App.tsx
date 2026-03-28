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
import { View, Post, UserProfile } from './types';
import { MOCK_USER } from './data/mockData';

// --- Components ---
import TopNav from './components/layout/TopNav';
import Sidebar from './components/layout/Sidebar';
import RightSidebar from './components/layout/RightSidebar';
import CreatePostModal from './components/feed/CreatePostModal';
import CommentSidebar from './components/feed/CommentSidebar';

// --- Views ---
import NewsfeedView from './components/views/NewsfeedView';
import ProfileView from './components/views/ProfileView';
import MessengerView from './components/views/MessengerView';
import SearchView from './components/views/SearchView';
import NotificationsView from './components/views/NotificationsView';

export default function App() {
  const [currentView, setView] = useState<View>('newsfeed');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile>(MOCK_USER);

  const handleViewProfile = (user: UserProfile) => {
    setSelectedUser(user);
    setView('profile');
  };

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveCommentPost(null);
  }, [currentView, selectedUser]);

  return (
    <div className="min-h-screen bg-surface">
      <TopNav currentView={currentView} setView={setView} onProfileClick={() => handleViewProfile(MOCK_USER)} />
      
      <main className="pt-24 pb-12 max-w-[1440px] mx-auto px-6 grid grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[260px_1fr_320px] gap-8">
        <Sidebar currentView={currentView} setView={setView} onOpenCreate={() => setIsCreateOpen(true)} onProfileClick={() => handleViewProfile(MOCK_USER)} />
        
        <section className={`${currentView === 'profile' ? 'lg:col-span-2' : 'min-w-0'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentView}-${selectedUser.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'newsfeed' && <NewsfeedView onOpenCreate={() => setIsCreateOpen(true)} onCommentClick={setActiveCommentPost} />}
              {currentView === 'profile' && <ProfileView user={selectedUser} onCommentClick={setActiveCommentPost} />}
              {currentView === 'messenger' && <MessengerView />}
              {currentView === 'search' && <SearchView onCommentClick={setActiveCommentPost} onUserClick={handleViewProfile} />}
              {currentView === 'notifications' && <NotificationsView />}
            </motion.div>
          </AnimatePresence>
        </section>

        {activeCommentPost ? (
          <CommentSidebar post={activeCommentPost} onClose={() => setActiveCommentPost(null)} />
        ) : currentView !== 'profile' ? (
          <RightSidebar onUserClick={handleViewProfile} />
        ) : null}
      </main>

      <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-surface-container flex justify-around items-center h-16 px-4 z-50">
        <button onClick={() => setView('newsfeed')} className={`p-2 ${currentView === 'newsfeed' ? 'text-primary' : 'text-outline'}`}><Rss className="w-6 h-6" /></button>
        <button onClick={() => setView('search')} className={`p-2 ${currentView === 'search' ? 'text-primary' : 'text-outline'}`}><Search className="w-6 h-6" /></button>
        <button onClick={() => setIsCreateOpen(true)} className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg -mt-8 ring-4 ring-white">
          <Plus className="w-6 h-6" />
        </button>
        <button onClick={() => setView('notifications')} className={`p-2 ${currentView === 'notifications' ? 'text-primary' : 'text-outline'}`}><Bell className="w-6 h-6" /></button>
        <button onClick={() => handleViewProfile(MOCK_USER)} className={`p-2 ${currentView === 'profile' && selectedUser.id === MOCK_USER.id ? 'text-primary' : 'text-outline'}`}><User className="w-6 h-6" /></button>
      </nav>
    </div>
  );
}
