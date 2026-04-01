import React, { useState, useEffect } from 'react';
import { UserPlus, Check, Loader, ChevronRight } from 'lucide-react';
import { getSocialNetworkApiV1, type UserSummaryDto } from '../../api/api-generated';
import { UserProfile } from '../../types';
import BadgeChip from '../ui/BadgeChip';

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

interface SuggestionsRowProps {
  onUserClick: (u: UserProfile) => void;
}

const SuggestionCard = ({ user, onUserClick }: { user: UserSummaryDto; onUserClick: (u: UserProfile) => void }) => {
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
    <div 
      className="flex flex-col items-center p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer shrink-0 w-44 snap-start group"
      onClick={() => onUserClick(summaryToProfile(user))}
    >
      <div className="relative mb-3">
        <img 
          src={avatar} 
          alt={name} 
          className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/5 group-hover:ring-primary/20 transition-all" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-lg border-2 border-surface-container-lowest">
          <UserPlus className="w-3 h-3" />
        </div>
      </div>
      
      <div className="w-full min-w-0 text-center mb-4">
        <div className="flex items-center justify-center gap-1 mb-0.5">
          <p className="text-sm font-bold text-on-surface truncate">{name}</p>
          {user.displayedBadge && <BadgeChip badge={user.displayedBadge} size="sm" />}
        </div>
        <p className="text-[10px] text-outline truncate">@{user.username}</p>
      </div>

      <button 
        className={`w-full py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-2 ${
          followed 
            ? 'bg-surface-container text-outline cursor-default' 
            : 'bg-primary text-on-primary hover:brightness-110 active:scale-95 shadow-md shadow-primary/20'
        }`}
        onClick={handleFollow}
        disabled={loading || followed}
      >
        {loading ? (
          <Loader className="w-3.5 h-3.5 animate-spin" />
        ) : followed ? (
          <><Check className="w-3.5 h-3.5" /> Đã theo dõi</>
        ) : (
          'Theo dõi'
        )}
      </button>
    </div>
  );
};

const SuggestionsRow = ({ onUserClick }: SuggestionsRowProps) => {
  const api = getSocialNetworkApiV1();
  const [suggestions, setSuggestions] = useState<UserSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getApiUsersSuggestions()
      .then(res => {
        if (res.success && res.data) {
          // Lấy tối đa 5 người như yêu cầu
          setSuggestions(res.data.slice(0, 5));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loading && suggestions.length === 0) return null;

  return (
    <div className="bg-surface-container-low/50 rounded-[32px] p-6 border border-outline-variant/10 shadow-sm">
      <div className="flex items-center justify-between px-1 mb-6">
        <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Gợi ý cho bạn
        </h3>
        <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
          Xem tất cả <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-2 custom-scrollbar snap-x scroll-smooth">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="w-44 h-56 bg-surface-container-low animate-pulse rounded-[28px] shrink-0" />
          ))
        ) : (
          suggestions.map(user => (
            <SuggestionCard key={user.id} user={user} onUserClick={onUserClick} />
          ))
        )}
      </div>
    </div>
  );
};

export default SuggestionsRow;
