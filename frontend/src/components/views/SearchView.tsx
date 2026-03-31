import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader, Users } from 'lucide-react';
import { getSocialNetworkApiV1, type UserSummaryDto, type PostDto } from '../../api/api-generated';
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
    followers: '0',
    following: '0',
    posts:     '0',
  };
}

// ─── UserCard ──────────────────────────────────────────────────────────────────

const UserCard = ({ user, onUserClick }: { user: UserSummaryDto; onUserClick: (u: UserProfile) => void }) => {
  const [followed, setFollowed] = useState(false);
  const [loading, setLoading]   = useState(false);
  const api = getSocialNetworkApiV1();

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
        {loading ? '...' : followed ? 'Đang theo dõi' : 'Theo dõi'}
      </button>
    </div>
  );
};

// ─── SearchView ────────────────────────────────────────────────────────────────

type Tab = 'all' | 'people' | 'posts';

interface SearchViewProps {
  onCommentClick: (post: PostDto) => void;
  onUserClick: (u: UserProfile) => void;
  onHashtagClick?: (tag: string) => void;
}

const SearchView = ({ onCommentClick, onUserClick, onHashtagClick }: SearchViewProps) => {
  const api = getSocialNetworkApiV1();
  const [query,      setQuery]      = useState('');
  const [activeTab,  setActiveTab]  = useState<Tab>('all');
  const [users,      setUsers]      = useState<UserSummaryDto[]>([]);
  const [posts,      setPosts]      = useState<PostDto[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [searched,   setSearched]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          api.getApiPostsSearch({ q, page: 1, pageSize: 20 }),
        ]);
        // Search trả về List (không phải paged)
        setUsers(userRes.success && userRes.data ? (userRes.data as UserSummaryDto[]) : []);
        setPosts(postRes.success && postRes.data?.items ? (postRes.data.items as PostDto[]) : []);
        setSearched(true);
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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'people', label: 'Người dùng' },
    { key: 'posts', label: 'Bài viết' },
  ];

  const showUsers = activeTab === 'all' || activeTab === 'people';
  const showPosts = activeTab === 'all' || activeTab === 'posts';
  const hasResults = users.length > 0 || posts.length > 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Search box */}
      <div className="bg-surface-container-lowest p-6 rounded-3xl surface-elevation-tonal border border-outline-variant/10">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
          {loading && <Loader className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm kiếm người dùng..."
            className="w-full pl-12 pr-12 py-4 bg-surface-container-low border border-transparent focus:border-primary/30 focus:bg-surface-container-lowest rounded-2xl outline-none transition-all text-lg"
          />
        </div>
      </div>

      {/* Tabs */}
      {searched && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
            Kết quả cho &ldquo;{query.trim()}&rdquo;
          </h1>
          <div className="flex bg-surface-container-high p-1 rounded-full">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === t.key ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-outline hover:text-primary'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {searched && !loading && !hasResults && (
        <div className="text-center py-20 text-outline">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-headline">Không tìm thấy kết quả</p>
          <p className="text-sm mt-1">Thử tìm với từ khóa khác</p>
        </div>
      )}

      {searched && hasResults && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* People */}
          {showUsers && users.length > 0 && (
            <div className={`space-y-4 ${showPosts && posts.length > 0 ? 'lg:col-span-4' : 'lg:col-span-12'}`}>
              <h2 className="font-headline font-bold text-lg text-on-surface">Người dùng</h2>
              {users.map(u => (
                <React.Fragment key={Number(u.id)}>
                  <UserCard user={u} onUserClick={onUserClick} />
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Posts */}
          {showPosts && posts.length > 0 && (
            <div className={`space-y-6 ${showUsers && users.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
              <h2 className="font-headline font-bold text-lg text-on-surface">Bài viết</h2>
              {posts.map(p => (
                <React.Fragment key={p.id}>
                  <PostCard
                    post={p}
                    onCommentClick={onCommentClick}
                    onHashtagClick={onHashtagClick}
                  />
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state before search */}
      {!searched && !loading && (
        <div className="text-center py-20 text-outline">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-headline">Nhập từ khóa để tìm kiếm</p>
        </div>
      )}
    </div>
  );
};

export default SearchView;
