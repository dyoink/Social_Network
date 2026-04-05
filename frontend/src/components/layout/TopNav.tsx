import { useState, useEffect, useCallback } from 'react';
import { Search, Bell, LogOut, MessageSquare, Sun, Moon } from 'lucide-react';
import { View, UserProfile } from '../../types';
import { getSocialNetworkApiV1 } from '../../api/api-generated';
import { getChatConnection, getNotificationConnection } from '../../api/signalr';
import useThemeStore from '../../store/themeStore';

interface TopNavProps {
  currentView: View;
  setView: (v: View) => void;
  onProfileClick: () => void;
  onLogout: () => void;
  user?: UserProfile | null;
}

const TopNav = ({ currentView, setView, onProfileClick, onLogout, user }: TopNavProps) => {
  const avatar = user?.avatar || `https://picsum.photos/seed/${user?.id || 'me'}/100/100`;
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount,   setMsgCount]   = useState(0);
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    if (!user) return;
    const api = getSocialNetworkApiV1();

    // Lấy counts ban đầu qua REST
    api.getApiNotificationsUnreadCount().then(r => { if (r.success && r.data) setNotifCount(Number(r.data.count ?? 0)); }).catch(console.error);
    api.getApiConversationsUnreadCount().then(r => { if (r.success && r.data) setMsgCount(Number(r.data.count ?? 0)); }).catch(console.error);

    // SignalR real-time updates — tăng badge count khi có event mới
    const notifConn = getNotificationConnection();
    const chatConn = getChatConnection();

    const onReceiveNotification = () => {
      setNotifCount(prev => prev + 1);
    };
    const onConversationUpdated = () => {
      setMsgCount(prev => prev + 1);
    };

    // Đăng ký listeners
    notifConn.on('ReceiveNotification', onReceiveNotification);
    chatConn.on('ConversationUpdated', onConversationUpdated);

    // Lắng nghe event local để giảm count khi đọc
    const onNotificationRead = (e: any) => {
      const { all } = e.detail || {};
      if (all) setNotifCount(0);
      else setNotifCount(prev => Math.max(0, prev - 1));
    };
    const onMessageRead = (e: any) => {
      const { all } = e.detail || {};
      if (all) setMsgCount(0);
      else setMsgCount(prev => Math.max(0, prev - 1));
    };

    window.addEventListener('app:notification-read', onNotificationRead);
    window.addEventListener('app:message-read', onMessageRead);

    return () => {
      notifConn.off('ReceiveNotification', onReceiveNotification);
      chatConn.off('ConversationUpdated', onConversationUpdated);
      window.removeEventListener('app:notification-read', onNotificationRead);
      window.removeEventListener('app:message-read', onMessageRead);
    };
  }, [user]);

  return (
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
            Trang chủ
          </button>
          <button 
            onClick={() => setView('messenger')}
            className={`font-headline font-semibold px-1 py-4 transition-colors ${currentView === 'messenger' ? 'text-primary border-b-2 border-primary' : 'text-outline hover:text-primary'}`}
          >
            Tin nhắn
          </button>
          <button 
            onClick={() => setView('notifications')}
            className={`font-headline font-semibold px-1 py-4 transition-colors ${currentView === 'notifications' ? 'text-primary border-b-2 border-primary' : 'text-outline hover:text-primary'}`}
          >
            Thông báo
          </button>
        </div>

        <div className="flex items-center gap-4 border-l border-outline-variant/30 pl-6 ml-2">
          <button className="p-2 text-outline hover:bg-surface-container rounded-full transition-colors" onClick={() => setView('search')}>
            <Search className="w-5 h-5" />
          </button>
          <button className="relative p-2 text-outline hover:bg-surface-container rounded-full transition-colors" onClick={() => { setView('messenger'); setMsgCount(0); }}>
            <MessageSquare className="w-5 h-5" />
            {msgCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {msgCount > 99 ? '99+' : msgCount}
              </span>
            )}
          </button>
          <button className="relative p-2 text-outline hover:bg-surface-container rounded-full transition-colors" onClick={() => { setView('notifications'); setNotifCount(0); }}>
            <Bell className="w-5 h-5" />
            {notifCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            )}
          </button>
          <button
            className="p-2 text-outline hover:bg-surface-container rounded-full transition-colors"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button className="p-2 text-outline hover:bg-surface-container rounded-full transition-colors" onClick={onLogout} title="Đăng xuất">
            <LogOut className="w-5 h-5" />
          </button>
          <div
            className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest flex-shrink-0 cursor-pointer border-2 border-primary/10"
            onClick={onProfileClick}
          >
            <img alt="User Profile" src={avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default TopNav;
