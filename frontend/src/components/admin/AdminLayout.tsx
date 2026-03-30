import React from 'react';
import { LayoutDashboard, Users, FileText, Flag, LogOut, X } from 'lucide-react';

export type AdminTab = 'dashboard' | 'users' | 'posts' | 'reports';

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
  { key: 'reports',   label: 'Báo cáo',      icon: <Flag className="w-5 h-5" /> },
];

const AdminLayout = ({ activeTab, setTab, onExit, children }: AdminLayoutProps) => (
  <div className="min-h-screen bg-gray-50 flex">
    {/* Sidebar */}
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <span className="font-headline text-xl font-extrabold text-primary">Social</span>
          <span className="ml-2 text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">ADMIN</span>
        </div>
        <button onClick={onExit} className="p-1.5 text-outline hover:text-on-surface hover:bg-gray-100 rounded-lg transition-colors" title="Thoát Admin">
          <X className="w-4 h-4" />
        </button>
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
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={onExit}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Về trang chính
        </button>
      </div>
    </aside>

    {/* Main content */}
    <main className="flex-1 overflow-auto p-8">
      {children}
    </main>
  </div>
);

export default AdminLayout;
