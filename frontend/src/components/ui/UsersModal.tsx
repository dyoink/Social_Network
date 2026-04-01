import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader, UserPlus, UserMinus } from 'lucide-react';
import { getSocialNetworkApiV1, type UserSummaryDto } from '../../api/api-generated';
import { UserProfile } from '../../types';

interface UsersModalProps {
  userId: number;
  type: 'followers' | 'following';
  isOpen: boolean;
  onClose: () => void;
  onUserClick?: (user: UserProfile) => void;
}

// Helper to convert UserSummaryDto to UserProfile (legacy compatibility)
function summaryToProfile(u: UserSummaryDto): UserProfile {
  return {
    id: String(u.id ?? ''),
    name: u.fullName || u.username || 'Unknown',
    username: u.username || '',
    avatar: u.avatarUrl || `https://picsum.photos/seed/${u.id}/100/100`,
    cover: `https://picsum.photos/seed/cover${u.id}/1200/400`,
    bio: '',
    role: 'Thành viên',
    followers: String(u.followersCount ?? 0),
    following: '0',
    posts: '0',
    isFollowing: u.isFollowing,
    displayedBadge: u.displayedBadge,
  };
}

const UserItem = ({ user, onUserClick }: { user: UserSummaryDto; onUserClick?: (u: UserProfile) => void }) => {
  const [followed, setFollowed] = useState(user.isFollowing ?? false);
  const [loading, setLoading] = useState(false);
  const api = useMemo(() => getSocialNetworkApiV1(), []);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      await api.postApiUsersIdFollow(Number(user.id));
      setFollowed(f => !f);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors cursor-pointer group"
      onClick={() => onUserClick?.(summaryToProfile(user))}
    >
      <img
        alt={user.fullName || user.username || ''}
        className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all"
        src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/100/100`}
        referrerPolicy="no-referrer"
      />
      <div className="flex-grow min-w-0">
        <h4 className="font-bold text-on-surface leading-tight truncate group-hover:text-primary transition-colors">
          {user.fullName || user.username}
        </h4>
        <p className="text-xs text-outline truncate">@{user.username}</p>
      </div>
      <button
        onClick={handleFollow}
        disabled={loading}
        className={`p-2 rounded-full transition-all active:scale-90 disabled:opacity-50 ${
          followed 
            ? 'bg-surface-container-high text-on-surface hover:text-error hover:bg-error/10' 
            : 'bg-primary/10 text-primary hover:bg-primary hover:text-on-primary'
        }`}
        title={followed ? 'Bỏ theo dõi' : 'Theo dõi'}
      >
        {loading ? <Loader className="w-4 h-4 animate-spin" /> : followed ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default function UsersModal({ userId, type, isOpen, onClose, onUserClick }: UsersModalProps) {
  const api = useMemo(() => getSocialNetworkApiV1(), []);
  const [users, setUsers] = useState<UserSummaryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchUsers = useCallback(async (pageNum: number, replace = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = type === 'followers' 
        ? await api.getApiUsersIdFollowers(userId, { page: pageNum, pageSize: 20 })
        : await api.getApiUsersIdFollowing(userId, { page: pageNum, pageSize: 20 });
      
      if (res.success && res.data) {
        const { items = [], hasNextPage = false } = res.data;
        setUsers(prev => replace ? items : [...prev, ...items]);
        setHasMore(hasNextPage);
        setPage(pageNum);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [userId, type, api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOpen) {
      setUsers([]);
      setPage(1);
      setHasMore(true);
      fetchUsers(1, true);
    }
    // We only want to re-fetch when isOpen changes to true or type/userId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId, type]); 

  const title = type === 'followers' ? 'Người theo dõi' : 'Đang theo dõi';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/20 w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/10">
              <h3 className="font-headline font-bold text-on-surface text-xl">
                {title}
              </h3>
              <button onClick={onClose} className="text-outline hover:text-on-surface p-2 rounded-full hover:bg-surface-container transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
              {users.length === 0 && !loading && (
                <div className="py-20 text-center text-outline">
                  <p className="font-headline">Chưa có ai trong danh sách này</p>
                </div>
              )}
              
              <div className="flex flex-col gap-1">
                {users.map((user, idx) => (
                  <UserItem 
                    key={`${user.id}-${idx}`} 
                    user={user} 
                    onUserClick={(u) => {
                      onUserClick?.(u);
                      onClose();
                    }} 
                  />
                ))}
              </div>

              {loading && (
                <div className="flex justify-center py-6">
                  <Loader className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}

              {hasMore && !loading && (
                <button
                  onClick={() => fetchUsers(page + 1)}
                  className="w-full py-3 text-sm font-bold text-primary hover:bg-primary/5 rounded-xl transition-colors mt-2"
                >
                  Xem thêm
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
