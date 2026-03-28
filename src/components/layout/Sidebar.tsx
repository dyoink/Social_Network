import { ReactNode } from 'react';
import { Rss, User, MessageSquare, Search, Bookmark, Settings } from 'lucide-react';
import { View } from '../../types';
import { MOCK_USER } from '../../data/mockData';

interface SidebarProps {
  currentView: View;
  setView: (v: View) => void;
  onOpenCreate: () => void;
  onProfileClick: () => void;
}

const SidebarLink = ({ active, icon, label, onClick }: { active: boolean, icon: ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-headline font-medium text-sm transition-all ${active ? 'bg-white text-primary shadow-sm' : 'text-outline hover:translate-x-1 hover:text-primary'}`}
  >
    {icon}
    {label}
  </button>
);

const Sidebar = ({ currentView, setView, onOpenCreate, onProfileClick }: SidebarProps) => (
  <aside className="hidden md:flex flex-col gap-4 sticky top-24 h-[calc(100vh-120px)] overflow-y-auto">
    <div className="flex flex-col gap-4 p-4 bg-surface-container-low rounded-xl">
      <div className="flex items-center gap-3 px-2 mb-4 cursor-pointer" onClick={onProfileClick}>
        <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/10">
          <img alt="User Avatar" src={MOCK_USER.avatar} referrerPolicy="no-referrer" />
        </div>
        <div>
          <h3 className="font-headline font-bold text-sm text-on-surface">{MOCK_USER.name}</h3>
          <p className="text-xs text-outline">{MOCK_USER.role}</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        <SidebarLink active={currentView === 'newsfeed'} icon={<Rss className="w-5 h-5" />} label="Newsfeed" onClick={() => setView('newsfeed')} />
        <SidebarLink active={currentView === 'profile'} icon={<User className="w-5 h-5" />} label="Profile" onClick={onProfileClick} />
        <SidebarLink active={currentView === 'messenger'} icon={<MessageSquare className="w-5 h-5" />} label="Messenger" onClick={() => setView('messenger')} />
        <SidebarLink active={currentView === 'search'} icon={<Search className="w-5 h-5" />} label="Search" onClick={() => setView('search')} />
        <SidebarLink active={false} icon={<Bookmark className="w-5 h-5" />} label="Saved" onClick={() => {}} />
        <SidebarLink active={false} icon={<Settings className="w-5 h-5" />} label="Settings" onClick={() => {}} />
      </nav>
      <button 
        onClick={onOpenCreate}
        className="mt-4 w-full btn-primary py-3"
      >
        Create Post
      </button>
    </div>
  </aside>
);

export default Sidebar;
