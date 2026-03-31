import React, { useState, useEffect } from 'react';
import { TrendingUp, UserPlus, Check, Loader, Hash } from 'lucide-react';
import { getSocialNetworkApiV1, type UserSummaryDto, type TrendingHashtagDto } from '../../api/api-generated';
import { UserProfile } from '../../types';

// Chuyển UserSummaryDto → UserProfile tạm để onUserClick tương thích
function summaryToProfile(u: UserSummaryDto): UserProfile {
  return {
    id: String(u.id ?? ''),
    name: u.fullName || u.username || 'Unknown',
    username: u.username || '',
    avatar: u.avatarUrl || `https://picsum.photos/seed/${u.id}/100/100`,
    cover: `https://picsum.photos/seed/cover${u.id}/1200/400`,
    bio: '',
    role: 'Thành viên',
    followers: '0',
    following: '0',
    posts: '0',
  };
}

const TrendingTopic = ({ category, title, meta }: { category: string; title: string; meta: string }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-outline font-bold mb-1">{category}</p>
    <h4 className="text-sm font-bold text-on-surface hover:text-primary cursor-pointer leading-tight mb-1">{title}</h4>
    <p className="text-xs text-outline">{meta}</p>
  </div>
);

interface SuggestedUserProps {
  user: UserSummaryDto;
  onUserClick: (u: UserProfile) => void;
}

const SuggestedUser = ({ user, onUserClick }: SuggestedUserProps) => {
  const [followed, setFollowed] = useState(false);
  const [loading, setLoading]   = useState(false);
  const api = getSocialNetworkApiV1();

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading || followed) return;
    setLoading(true);
    try {
      await api.postApiUsersIdFollow(Number(user.id));
      setFollowed(true);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const name   = user.fullName || user.username || 'Unknown';
  const avatar = user.avatarUrl || `https://picsum.photos/seed/${user.id}/100/100`;

  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onUserClick(summaryToProfile(user))}>
        <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/5 group-hover:ring-2 group-hover:ring-primary/20 transition-all flex-shrink-0">
          <img alt={name} src={avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-on-surface leading-none mb-1 group-hover:text-primary transition-colors truncate">{name}</h4>
          <p className="text-[10px] text-outline truncate">@{user.username}</p>
        </div>
      </div>
      <button
        onClick={handleFollow}
        disabled={loading || followed}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ml-2 ${
          followed
            ? 'bg-surface-container text-outline cursor-default'
            : 'bg-primary/10 text-primary hover:bg-primary hover:text-white disabled:opacity-60'
        }`}
      >
        {loading ? (
          <Loader className="w-3 h-3 animate-spin" />
        ) : followed ? (
          <Check className="w-4 h-4" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

const RightSidebar = ({ onUserClick, onHashtagClick }: { onUserClick: (u: UserProfile) => void; onHashtagClick?: (tag: string) => void }) => {
  const api = getSocialNetworkApiV1();
  const [suggestions, setSuggestions] = useState<UserSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [trending, setTrending] = useState<TrendingHashtagDto[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    api.getApiUsersSuggestions()
      .then(res => {
        if (res.success && res.data) setSuggestions(res.data.slice(0, 5));
      })
      .catch(() => { /* ẩn lỗi nếu chưa login */ })
      .finally(() => setLoading(false));

    api.getApiPostsTrendingHashtags({ limit: 10 })
      .then(res => {
        if (res.success && res.data) setTrending(res.data);
      })
      .catch(() => {})
      .finally(() => setTrendingLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <aside className="hidden lg:flex flex-col gap-8 sticky top-24 h-fit">
      {/* Suggested users */}
      <div className="bg-surface-container-lowest p-6 rounded-xl surface-elevation-tonal">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline font-bold text-on-surface">Gợi ý theo dõi</h3>
        </div>
        <div className="flex flex-col gap-5">
          {loading && (
            <div className="flex justify-center py-4">
              <Loader className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
          {!loading && suggestions.length === 0 && (
            <p className="text-xs text-outline text-center">Không có gợi ý nào.</p>
          )}
          {suggestions.map(user => (
            <React.Fragment key={Number(user.id)}>
              <SuggestedUser user={user} onUserClick={onUserClick} />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Trending hashtags */}
      <div className="bg-surface-container-lowest p-6 rounded-xl surface-elevation-tonal">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline font-bold text-on-surface">Xu hướng</h3>
          <TrendingUp className="w-5 h-5 text-outline" />
        </div>
        <div className="flex flex-col gap-4">
          {trendingLoading && (
            <div className="flex justify-center py-4">
              <Loader className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
          {!trendingLoading && trending.length === 0 && (
            <p className="text-xs text-outline text-center py-2">Chưa có xu hướng nào.</p>
          )}
          {trending.map((t, i) => (
            <button
              key={t.tag}
              onClick={() => onHashtagClick?.(t.tag ?? '')}
              className="text-left group"
            >
              <p className="text-[10px] uppercase tracking-wider text-outline font-bold mb-0.5">#{i + 1} Trending</p>
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-primary" />
                <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{t.tag ?? ''}</h4>
              </div>
              <p className="text-xs text-outline mt-0.5">{(t.postCount ?? 0).toLocaleString()} bài viết</p>
            </button>
          ))}
        </div>
      </div>

      <footer className="px-4 flex flex-wrap gap-x-4 gap-y-2">
        {['Quyền riêng tư', 'Điều khoản', 'Quảng cáo', 'Cookie'].map(link => (
          <button key={link} className="text-[10px] text-outline hover:text-primary uppercase font-bold tracking-wider">{link}</button>
        ))}
        <p className="text-[10px] text-outline w-full mt-2 uppercase font-bold tracking-wider">Social Network © 2026</p>
      </footer>
    </aside>
  );
};

export default RightSidebar;
