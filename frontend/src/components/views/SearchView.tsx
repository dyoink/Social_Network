import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader, Users, Clock, X, TrendingUp, UserPlus, Image as ImageIcon, Video, Hash } from 'lucide-react';
import { getSocialNetworkApiV1, type UserSummaryDto, type PostDto, type TrendingHashtagDto } from '../../api/api-generated';
import { UserProfile } from '../../types';
import PostCard from '../feed/PostCard';

// Chuyển UserSummaryDto → UserProfile để tương thích với onUserClick
function summaryToProfile(u: UserSummaryDto): UserProfile {
  return {
    id:        String(u.id ?? ''),
    name:      u.fullName || u.username || 'Unknown',
    username:  u.username || '',
    avatar:    u.avatarUrl || `https://picsum.photos/seed/${u.id}/100/100`,
    cover:     `https://picsum.photos/seed/cover${u.id}/1200/400`,
    bio:       '',
    role:      'Thành viên',
    followers: String(u.followersCount ?? 0),
    following: '0',
    posts:     '0',
    isFollowing: u.isFollowing,
    displayedBadge: u.displayedBadge,
  };
}

// ─── UserCard ──────────────────────────────────────────────────────────────────

const UserCard = ({ user, onUserClick }: { user: UserSummaryDto; onUserClick: (u: UserProfile) => void }) => {
  const [followed, setFollowed] = useState(user.isFollowing ?? false);
  const [loading, setLoading]   = useState(false);
  const api = getSocialNetworkApiV1();

  // Đồng bộ lại state nếu prop thay đổi (ví dụ khi search lại)
  useEffect(() => {
    setFollowed(user.isFollowing ?? false);
  }, [user.isFollowing]);

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
      className="bg-surface-container-lowest p-5 rounded-xl surface-elevation-tonal transition-all hover:shadow-xl hover:shadow-blue-500/5 group border border-transparent hover:border-outline-variant/10 cursor-pointer"
      onClick={() => onUserClick(summaryToProfile(user))}
    >
      <div className="flex items-center gap-4">
        <img
          alt={user.fullName || user.username || ''}
          className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/10"
          src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/100/100`}
          referrerPolicy="no-referrer"
        />
        <div className="flex-grow min-w-0">
          <h4 className="font-bold text-on-surface leading-tight group-hover:text-primary transition-colors truncate">
            {user.fullName || user.username}
          </h4>
          <p className="text-xs text-outline mt-0.5">@{user.username}</p>
        </div>
      </div>
      <button
        className={`mt-4 w-full py-2.5 rounded-full font-semibold text-sm transition-all active:scale-95 disabled:opacity-60
          ${followed ? 'bg-surface-container text-on-surface-variant border border-outline-variant/50 hover:bg-error/10 hover:text-error hover:border-error/30' : 'bg-secondary-container text-on-secondary-container hover:brightness-105'}`}
        onClick={handleFollow}
        disabled={loading}
      >
        {loading ? '...' : followed ? 'Bỏ theo dõi' : 'Theo dõi'}
      </button>
    </div>
  );
};

// ─── SearchView ────────────────────────────────────────────────────────────────

type Tab = 'all' | 'people' | 'posts' | 'images' | 'videos' | 'groups';

interface SearchViewProps {
  onCommentClick: (post: PostDto) => void;
  onImageClick?: (post: PostDto) => void;
  onUserClick: (u: UserProfile) => void;
  onHashtagClick?: (tag: string) => void;
}

const SearchView = ({ onCommentClick, onImageClick, onUserClick, onHashtagClick }: SearchViewProps) => {
  const api = getSocialNetworkApiV1();
  const [query,      setQuery]      = useState('');
  const [activeTab,  setActiveTab]  = useState<Tab>('all');
  const [users,      setUsers]      = useState<UserSummaryDto[]>([]);
  const [posts,      setPosts]      = useState<PostDto[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [searched,   setSearched]   = useState(false);
  
  // States for empty state
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions,    setSuggestions]    = useState<UserSummaryDto[]>([]);
  const [trending,       setTrending]       = useState<TrendingHashtagDto[]>([]);
  const [emptyLoading,   setEmptyLoading]   = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial data (recent searches, suggestions, trending)
  useEffect(() => {
    // Recent searches from local storage
    const saved = localStorage.getItem('recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));

    // Suggestions & Trending
    setEmptyLoading(true);
    Promise.all([
      api.getApiUsersSuggestions(),
      api.getApiPostsTrendingHashtags({ limit: 8 })
    ]).then(([sugRes, trendRes]) => {
      if (sugRes.success && sugRes.data) setSuggestions(sugRes.data.slice(0, 5));
      if (trendRes.success && trendRes.data) setTrending(trendRes.data);
    }).catch(() => {})
      .finally(() => setEmptyLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addRecentSearch = (q: string) => {
    if (!q.trim()) return;
    const newRecent = [q, ...recentSearches.filter(s => s !== q)].slice(0, 10);
    setRecentSearches(newRecent);
    localStorage.setItem('recent_searches', JSON.stringify(newRecent));
  };

  const removeRecentSearch = (q: string) => {
    const newRecent = recentSearches.filter(s => s !== q);
    setRecentSearches(newRecent);
    localStorage.setItem('recent_searches', JSON.stringify(newRecent));
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setUsers([]);
      setPosts([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [userRes, postRes] = await Promise.all([
          api.getApiUsersSearch({ q }),
          api.getApiPostsSearch({ q, page: 1, pageSize: 40 }),
        ]);
        setUsers(userRes.success && userRes.data ? (userRes.data as UserSummaryDto[]) : []);
        setPosts(postRes.success && postRes.data?.items ? (postRes.data.items as PostDto[]) : []);
        setSearched(true);
        if (userRes.success || postRes.success) addRecentSearch(q);
      } catch {
        setUsers([]);
        setPosts([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs: { key: Tab; label: string; icon?: React.ReactNode }[] = [
    { key: 'all',    label: 'Tất cả' },
    { key: 'people', label: 'Người dùng', icon: <Users className="w-4 h-4" /> },
    { key: 'posts',  label: 'Bài viết',   icon: <Hash className="w-4 h-4" /> },
    { key: 'images', label: 'Hình ảnh',   icon: <ImageIcon className="w-4 h-4" /> },
    { key: 'videos', label: 'Video',      icon: <Video className="w-4 h-4" /> },
    { key: 'groups', label: 'Nhóm',       icon: <Users className="w-4 h-4" /> },
  ];

  // Filtering results based on tab
  const filteredPosts = posts.filter(p => {
    if (activeTab === 'images') return !!p.imageUrl;
    if (activeTab === 'videos') return !!p.videoUrl;
    return true;
  });

  const showUsers = (activeTab === 'all' || activeTab === 'people') && users.length > 0;
  const showPosts = (activeTab === 'all' || activeTab === 'posts' || activeTab === 'images' || activeTab === 'videos') && filteredPosts.length > 0;
  const showGroups = activeTab === 'groups';
  const hasResults = showUsers || showPosts;

  return (
    <div className="flex flex-col gap-8">
      {/* Search box & Filter Chips */}
      <div className="bg-surface-container-lowest p-6 rounded-3xl surface-elevation-tonal border border-outline-variant/10 space-y-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
          {loading && <Loader className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm kiếm người dùng, bài viết..."
            className="w-full pl-12 pr-12 py-4 bg-surface-container-low border border-transparent focus:border-primary/30 focus:bg-surface-container-lowest rounded-2xl outline-none transition-all text-lg"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === t.key ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-container-low text-outline hover:text-primary hover:bg-surface-container-high'}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State: Recent, Trending, Suggestions */}
      {!searched && !loading && (
        <div className="space-y-10">
          {/* Top Section: Recent & Trending */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-12 space-y-8">
              {recentSearches.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline font-bold text-lg text-on-surface">Tìm kiếm gần đây</h3>
                    <button onClick={() => { setRecentSearches([]); localStorage.removeItem('recent_searches'); }} className="text-xs font-bold text-primary hover:underline">Xóa tất cả</button>
                  </div>
                  <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10">
                    {recentSearches.map(s => (
                      <div key={s} className="group flex items-center justify-between px-5 py-3 hover:bg-surface-container-low cursor-pointer transition-colors" onClick={() => setQuery(s)}>
                        <div className="flex items-center gap-4 text-on-surface-variant">
                          <Clock className="w-4 h-4 text-outline" />
                          <span className="text-sm font-medium">{s}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeRecentSearch(s); }} className="p-1 opacity-0 group-hover:opacity-100 text-outline hover:text-error transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Pills */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-headline font-bold text-lg text-on-surface">Xu hướng</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {emptyLoading ? (
                    Array(5).fill(0).map((_, i) => <div key={i} className="h-10 w-24 bg-surface-container-low animate-pulse rounded-full" />)
                  ) : trending.map((t, i) => (
                    <button 
                      key={t.tag} 
                      onClick={() => { if (onHashtagClick) onHashtagClick(t.tag!); else setQuery(`#${t.tag}`); }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-full text-sm font-bold text-on-surface-variant hover:border-primary hover:text-primary transition-all hover:scale-105 active:scale-95 shadow-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary">
                        {i + 1}
                      </div>
                      #{t.tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Suggestions Horizontal Scroll Bar */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              <h3 className="font-headline font-bold text-lg text-on-surface">Gợi ý cho bạn</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
              {emptyLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="w-40 h-48 bg-surface-container-low animate-pulse rounded-3xl shrink-0" />
                ))
              ) : suggestions.slice(0, 5).map(user => (
                <div 
                  key={user.id} 
                  className="group flex flex-col items-center text-center p-5 bg-surface-container-lowest rounded-3xl border border-outline-variant/10 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer shrink-0 w-40 snap-start"
                  onClick={() => onUserClick(summaryToProfile(user))}
                >
                  <div className="relative mb-3">
                    <img 
                      src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/100/100`} 
                      alt="" 
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/5 group-hover:ring-primary/20 transition-all" 
                    />
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full shadow-lg">
                      <UserPlus className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="w-full min-w-0 mb-3">
                    <p className="text-sm font-bold text-on-surface truncate">{user.fullName || user.username}</p>
                    <p className="text-[10px] text-outline truncate">@{user.username}</p>
                  </div>
                  <button 
                    className="w-full text-[11px] font-bold py-2 rounded-xl bg-primary text-on-primary hover:brightness-110 active:scale-95 transition-all shadow-md shadow-primary/20"
                    onClick={(e) => { e.stopPropagation(); /* handle follow */ }}
                  >
                    Theo dõi
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results State */}
      {searched && !loading && !hasResults && !showGroups && (
        <div className="text-center py-20 text-outline bg-surface-container-lowest rounded-3xl surface-elevation-tonal">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-xl font-headline font-bold text-on-surface">Không tìm thấy kết quả</p>
          <p className="text-sm mt-1">Thử thay đổi từ khóa hoặc bộ lọc</p>
          <button onClick={() => { setQuery(''); setSearched(false); }} className="mt-6 text-sm font-bold text-primary hover:underline">Xóa tìm kiếm</button>
        </div>
      )}

      {searched && showGroups && (
        <div className="text-center py-20 text-outline bg-surface-container-lowest rounded-3xl surface-elevation-tonal">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-xl font-headline font-bold text-on-surface">Chức năng Nhóm đang phát triển</p>
          <p className="text-sm mt-1">Hãy quay lại sau nhé!</p>
        </div>
      )}

      {searched && hasResults && !showGroups && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* People */}
          {showUsers && (
            <div className={`space-y-4 ${showPosts && filteredPosts.length > 0 ? 'lg:col-span-4' : 'lg:col-span-12'}`}>
              <h2 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Người dùng
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {users.map(u => <UserCard key={Number(u.id)} user={u} onUserClick={onUserClick} />)}
              </div>
            </div>
          )}

          {/* Posts */}
          {showPosts && (
            <div className={`space-y-6 ${showUsers && users.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
              <h2 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
                <Hash className="w-5 h-5 text-primary" />
                Bài viết
              </h2>
              <div className="space-y-6">
                {filteredPosts.map(p => (
                  <PostCard
                    key={Number(p.id)}
                    post={p}
                    onCommentClick={onCommentClick}
                    onImageClick={onImageClick}
                    onHashtagClick={onHashtagClick}
                    onUserClick={onUserClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchView;
