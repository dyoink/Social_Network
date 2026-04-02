import React from 'react';
import { LayoutDashboard, Users, FileText, MessageSquare, Flag, LogOut, X, Award, Sun, Moon, Sprout } from 'lucide-react';
import useThemeStore from '../../store/themeStore';

export type AdminTab = 'dashboard' | 'users' | 'posts' | 'comments' | 'reports' | 'badges' | 'seed';

interface AdminLayoutProps {
  activeTab: AdminTab;
  setTab: (tab: AdminTab) => void;
  onExit: () => void;
  children: React.ReactNode;
}

const navItems: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Tổng quan',    icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: 'users',     label: 'Người dùng',   icon: <Users className="w-5 h-5" /> },
  { key: 'posts',     label: 'Bài viết',     icon: <FileText className="w-5 h-5" /> },
  { key: 'comments',  label: 'Bình luận',    icon: <MessageSquare className="w-5 h-5" /> },
  { key: 'reports',   label: 'Báo cáo',      icon: <Flag className="w-5 h-5" /> },
  { key: 'badges',    label: 'Danh hiệu',    icon: <Award className="w-5 h-5" /> },
  { key: 'seed',      label: 'Seed Data',     icon: <Sprout className="w-5 h-5" /> },
];

const AdminLayout = ({ activeTab, setTab, onExit, children }: AdminLayoutProps) => {
  const { theme, toggleTheme } = useThemeStore();

  return (
  <div className="min-h-screen bg-surface-container-low flex flex-col md:flex-row">
    {/* Mobile top bar */}
    <div className="md:hidden flex items-center justify-between px-4 py-3 bg-surface-container-lowest border-b border-outline-variant/20">
      <div className="flex items-center gap-2">
        <span className="font-headline text-lg font-extrabold text-primary">Social</span>
        <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">ADMIN</span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={toggleTheme} className="p-1.5 text-outline hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors" title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}>
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button onClick={onExit} className="p-1.5 text-outline hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors" title="Thoát Admin">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
    {/* Mobile tab bar */}
    <nav className="md:hidden flex overflow-x-auto gap-1 px-3 py-2 bg-surface-container-lowest border-b border-outline-variant/10">
      {navItems.map(item => (
        <button
          key={item.key}
          onClick={() => setTab(item.key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
            ${activeTab === item.key
              ? 'bg-primary text-white shadow-sm shadow-primary/20'
              : 'text-outline hover:bg-surface-container hover:text-on-surface'}`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>

    {/* Desktop sidebar */}
    <aside className="hidden md:flex w-64 bg-surface-container-lowest border-r border-outline-variant/20 flex-col flex-shrink-0 sticky top-0 h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between">
        <div>
          <span className="font-headline text-xl font-extrabold text-primary">Social</span>
          <span className="ml-2 text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">ADMIN</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="p-1.5 text-outline hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors" title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}>
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={onExit} className="p-1.5 text-outline hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors" title="Thoát Admin">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
              ${activeTab === item.key
                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                : 'text-outline hover:bg-surface-container hover:text-on-surface'}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-outline-variant/10">
        <button
          onClick={onExit}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-outline hover:bg-red-50 hover:text-red-600 transition-all dark:hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
          Về trang chính
        </button>
      </div>
    </aside>

    {/* Main content */}
    <main className="flex-1 overflow-auto p-4 md:p-8">
      {children}
    </main>
  </div>
  );
};

export default AdminLayout;
