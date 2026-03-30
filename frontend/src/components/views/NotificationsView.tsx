import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, UserPlus, Bell, CheckCheck, Loader, AlertCircle } from 'lucide-react';
import { getSocialNetworkApiV1, type NotificationDto } from '../../api/api-generated';
import { timeAgo } from '../../utils/time';

// Icon theo loại thông báo
const iconForType = (type: string) => {
  switch (type) {
    case 'like':    return { icon: <Heart    className="w-3 h-3 text-white fill-current" />, bg: 'bg-primary' };
    case 'comment': return { icon: <MessageCircle className="w-3 h-3 text-white" />, bg: 'bg-tertiary' };
    case 'reply':   return { icon: <MessageCircle className="w-3 h-3 text-white" />, bg: 'bg-tertiary' };
    case 'follow':  return { icon: <UserPlus className="w-3 h-3 text-white" />, bg: 'bg-secondary' };
    default:        return { icon: <Bell     className="w-3 h-3 text-white" />, bg: 'bg-outline' };
  }
};

const actionLabel = (type: string) => {
  switch (type) {
    case 'like':    return 'đã thích bài viết của bạn.';
    case 'comment': return 'đã bình luận bài viết của bạn.';
    case 'reply':   return 'đã trả lời bình luận của bạn.';
    case 'follow':  return 'đã bắt đầu theo dõi bạn.';
    default:        return 'đã tương tác với bạn.';
  }
};

interface NotificationItemProps {
  notification: NotificationDto;
  onRead: (id: number) => void;
}

const NotificationItem = ({ notification, onRead }: NotificationItemProps) => {
  const api = getSocialNetworkApiV1();
  const { icon, bg } = iconForType(notification.notificationType ?? '');
  const actorName   = notification.actor?.fullName || notification.actor?.username || 'Ai đó';
  const actorAvatar = notification.actor?.avatarUrl || `https://picsum.photos/seed/${notification.actor?.id}/50/50`;

  const handleClick = async () => {
    if (!notification.isRead && notification.id) {
      await api.putApiNotificationsIdRead(Number(notification.id));
      onRead(Number(notification.id));
    }
  };

  return (
    <div
      className={`group bg-surface-container-lowest p-5 rounded-xl shadow-sm hover:shadow-md transition-all flex gap-4 relative cursor-pointer ${
        !notification.isRead ? 'border-l-4 border-primary' : ''
      }`}
      onClick={handleClick}
    >
      {!notification.isRead && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
      )}
      <div className="flex-shrink-0">
        <div className="relative">
          <img
            alt={actorName}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
            src={actorAvatar}
            referrerPolicy="no-referrer"
          />
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${bg} rounded-full flex items-center justify-center border-2 border-white`}>
            {icon}
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-on-surface leading-tight">
          <span className="font-bold">{actorName}</span>{' '}
          {actionLabel(notification.notificationType ?? '')}
        </p>
        <span className="text-xs text-outline mt-1 block">{timeAgo(notification.createdAt)}</span>
      </div>
    </div>
  );
};

const NotificationsView = () => {
  const api = getSocialNetworkApiV1();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [markingAll, setMarkingAll]       = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getApiNotifications({ page: 1, pageSize: 30 })
      .then(res => {
        if (res.success && res.data) setNotifications(res.data.items ?? []);
        else setError(res.message ?? 'Lỗi tải thông báo');
      })
      .catch(() => setError('Không thể tải thông báo.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => Number(n.id) === id ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await api.putApiNotificationsReadAll();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* ignore */ } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-on-surface font-headline tracking-tight">Thông báo</h1>
          <p className="text-outline mt-1">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã đọc tất cả thông báo.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:bg-primary/5 px-4 py-2 rounded-full transition-colors disabled:opacity-60"
          >
            {markingAll ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-error/10 text-error text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="text-center py-20 text-outline">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-headline">Chưa có thông báo nào</p>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map(n => (
          <React.Fragment key={Number(n.id)}><NotificationItem notification={n} onRead={handleRead} /></React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default NotificationsView;
