import { ReactNode } from 'react';
import { Rss, User, MessageSquare, Search, Bell, PlusSquare, ShieldCheck } from 'lucide-react';
import { View, UserProfile } from '../../types';

interface SidebarProps {
  currentView: View;
  setView: (v: View) => void;
  onOpenCreate: () => void;
  onProfileClick: () => void;
  user?: UserProfile | null;
}

const SidebarLink = ({ active, icon, label, onClick }: { active: boolean, icon: ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-headline font-medium text-sm transition-all ${
      active ? 'bg-white text-primary shadow-sm' : 'text-outline hover:translate-x-1 hover:text-primary'
    }`}
  >
    {icon}
    {label}
  </button>
);

const Sidebar = ({ currentView, setView, onOpenCreate, onProfileClick, user }: SidebarProps) => {
  const avatar   = user?.avatar  || `https://picsum.photos/seed/${user?.id || 'me'}/100/100`;
  const name     = user?.name    || 'Người dùng';
  const role     = user?.role    || 'Thành viên';

  return (
    <aside className="hidden md:flex flex-col gap-4 sticky top-24 h-[calc(100vh-120px)] overflow-y-auto">
      <div className="flex flex-col gap-4 p-4 bg-surface-container-low rounded-xl">
        {/* Profile snippet */}
        <div className="flex items-center gap-3 px-2 mb-4 cursor-pointer" onClick={onProfileClick}>
          <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/10 flex-shrink-0">
            <img alt="User Avatar" src={avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="min-w-0">
            <h3 className="font-headline font-bold text-sm text-on-surface truncate">{name}</h3>
            <p className="text-xs text-outline truncate">{role}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          <SidebarLink active={currentView === 'newsfeed'}     icon={<Rss          className="w-5 h-5" />} label="Newsfeed"    onClick={() => setView('newsfeed')} />
          <SidebarLink active={currentView === 'profile'}      icon={<User         className="w-5 h-5" />} label="Profile"     onClick={onProfileClick} />
          <SidebarLink active={currentView === 'messenger'}    icon={<MessageSquare className="w-5 h-5" />} label="Messenger"   onClick={() => setView('messenger')} />
          <SidebarLink active={currentView === 'notifications'} icon={<Bell        className="w-5 h-5" />} label="Thông báo"   onClick={() => setView('notifications')} />
          <SidebarLink active={currentView === 'search'}       icon={<Search       className="w-5 h-5" />} label="Tìm kiếm"   onClick={() => setView('search')} />
          {user?.role === 'Admin' && (
            <SidebarLink active={currentView === 'admin'} icon={<ShieldCheck className="w-5 h-5" />} label="Admin Panel" onClick={() => setView('admin')} />
          )}
        </nav>

        <button 
          onClick={onOpenCreate}
          className="mt-4 w-full btn-primary py-3 flex items-center justify-center gap-2"
        >
          <PlusSquare className="w-4 h-4" /> Đăng bài
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
