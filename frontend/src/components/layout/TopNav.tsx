import { Search, MessageSquare, Bell, LogOut } from 'lucide-react';
import { View, UserProfile } from '../../types';
import { MOCK_USER } from '../../data/mockData';

interface TopNavProps {
  currentView: View;
  setView: (v: View) => void;
  onProfileClick: () => void;
  onLogout: () => void;
  user?: UserProfile | null;
}

const TopNav = ({ currentView, setView, onProfileClick, onLogout, user }: TopNavProps) => (
  <header className="fixed top-0 w-full z-50 glass-nav px-6 h-16 flex justify-between items-center">
    <div className="flex items-center gap-8">
      <span className="font-elephant text-2xl font-bold text-primary cursor-pointer" onClick={() => setView('newsfeed')}>Social</span>
    </div>
    <nav className="flex items-center gap-6">
      <div className="hidden lg:flex items-center gap-6">
        <button 
          onClick={() => setView('newsfeed')}
          className={`font-headline font-semibold px-1 py-4 transition-colors ${currentView === 'newsfeed' ? 'text-primary border-b-2 border-primary' : 'text-outline hover:text-primary'}`}
        >
          Home
        </button>
        <button 
          onClick={() => setView('messenger')}
          className={`font-headline font-semibold px-1 py-4 transition-colors ${currentView === 'messenger' ? 'text-primary border-b-2 border-primary' : 'text-outline hover:text-primary'}`}
        >
          Messenger
        </button>
        <button 
          onClick={() => setView('notifications')}
          className={`font-headline font-semibold px-1 py-4 transition-colors ${currentView === 'notifications' ? 'text-primary border-b-2 border-primary' : 'text-outline hover:text-primary'}`}
        >
          Notifications
        </button>
      </div>
      <div className="flex items-center gap-4 border-l border-outline-variant/30 pl-6 ml-2">
        <button className="p-2 text-outline hover:bg-surface-container rounded-full transition-colors" onClick={() => setView('messenger')}>
          <MessageSquare className="w-5 h-5" />
        </button>
        <button className="p-2 text-outline hover:bg-surface-container rounded-full transition-colors" onClick={() => setView('notifications')}>
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-outline hover:bg-surface-container rounded-full transition-colors" onClick={onLogout} title="Logout">
          <LogOut className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest flex-shrink-0 cursor-pointer border-2 border-primary/10" onClick={onProfileClick}>
          <img alt="User Profile" src={user?.avatar || MOCK_USER.avatar} referrerPolicy="no-referrer" />
        </div>
      </div>
    </nav>
  </header>
);

export default TopNav;
