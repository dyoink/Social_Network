import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Camera, Settings, Plus, LayoutGrid, MapPin, Share2, UserPlus, UserMinus, MessageSquare, Loader, AlertCircle, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSocialNetworkApiV1, type PostDto } from '../../api/api-generated';
import { UserProfile } from '../../types';
import useAuthStore from '../../store/authStore';
import PostCard from '../feed/PostCard';
import { formatCount } from '../../utils/time';

interface ProfileViewProps {
  user?: UserProfile;
  onCommentClick?: (post: PostDto) => void;
}

const Stat = ({ value, label, border }: { value: string; label: string; border?: boolean }) => (
  <div className={`text-center md:text-left ${border ? 'border-x border-outline-variant/30 px-6' : ''}`}>
    <span className="block font-bold text-lg text-on-surface">{value}</span>
    <span className="text-xs text-outline uppercase tracking-wider font-semibold">{label}</span>
  </div>
);

const IntroItem = ({ icon, text, isLink }: { icon: ReactNode; text: string; isLink?: boolean }) => (
  <div className="flex items-center gap-3 text-on-surface-variant">
    {icon}
    <span className={`text-sm ${isLink ? 'text-primary hover:underline cursor-pointer' : ''}`}>{text}</span>
  </div>
);

const ProfileView = ({ user, onCommentClick }: ProfileViewProps) => {
  const api = getSocialNetworkApiV1();
  const { user: currentUser, updateUser } = useAuthStore();

  // posts state
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // follow state — khởi tạo từ prop user, sau đó đồng bộ với API
  const [isFollowing, setIsFollowing] = useState(user?.isFollowing ?? false);
  const [followersCount, setFollowersCount] = useState(Number(user?.followers ?? 0));
  const [followLoading, setFollowLoading] = useState(false);

  const userId = user ? Number(user.id) : null;
  const isMe   = userId !== null && currentUser ? Number(currentUser.id) === userId : false;

  // Profile edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const openEditModal = () => {
    setEditFullName(user?.name ?? '');
    setEditBio(user?.bio ?? '');
    setEditAvatarUrl(user?.avatar ?? '');
    setEditCoverUrl(user?.cover ?? '');
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (editSaving) return;
    setEditSaving(true);
    try {
      const res = await api.putApiUsersMe({
        fullName: editFullName || null,
        bio: editBio || null,
        avatarUrl: editAvatarUrl || null,
        coverUrl: editCoverUrl || null,
      });
      if (res.success && res.data) {
        updateUser(res.data);
        toast.success('Cập nhật profile thành công!');
      }
      setShowEditModal(false);
    } catch {
      toast.error('Không thể cập nhật profile, vui lòng thử lại.');
      // giữ nguyên modal nếu lỗi
    } finally {
      setEditSaving(false);
    }
  };

  // Fetch posts khi profile thay đổi
  const fetchPosts = useCallback(async (pageNum: number, replace = false) => {
    if (!userId) return;
    setPostsLoading(true);
    setPostsError(null);
    try {
      const res = await api.getApiPostsUserUserId(userId, { page: pageNum, pageSize: 10 });
      if (!res.success || !res.data) throw new Error(res.message ?? 'Lỗi tải bài viết');
      const { items = [], hasNextPage = false } = res.data;
      setPosts(prev => replace ? items : [...prev, ...items]);
      setHasMore(hasNextPage);
      setPage(pageNum);
    } catch (e: unknown) {
      setPostsError((e as Error).message);
    } finally {
      setPostsLoading(false);
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setIsFollowing(user?.isFollowing ?? false);
    setFollowersCount(Number(user?.followers ?? 0));
    fetchPosts(1, true);
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFollowToggle = async () => {
    if (!userId || isMe || followLoading) return;
    setFollowLoading(true);

    // Optimistic update
    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);
    setFollowersCount(prev => newFollowing ? prev + 1 : prev - 1);

    try {
      const res = await api.postApiUsersIdFollow(userId);
      if (res.success && res.data) {
        setIsFollowing(res.data.isFollowing ?? newFollowing);
        setFollowersCount(Number(res.data.followersCount ?? followersCount));
      }
    } catch {
      // Rollback
      setIsFollowing(!newFollowing);
      setFollowersCount(prev => newFollowing ? prev - 1 : prev + 1);
    } finally {
      setFollowLoading(false);
    }
  };

  const displayName = user?.name || 'Unknown';
  const avatar      = user?.avatar || `https://picsum.photos/seed/${user?.id}/200/200`;
  const cover       = user?.cover  || 'https://picsum.photos/seed/cover/1200/400';

  return (
    <div className="flex flex-col gap-8">
      {/* Cover + Profile header */}
      <div className="bg-surface-container-lowest rounded-b-3xl overflow-hidden surface-elevation-tonal">
        <div className="h-64 md:h-80 w-full relative">
          <img alt="Cover" className="w-full h-full object-cover" src={cover} referrerPolicy="no-referrer" />
          {isMe && (
            <div className="absolute bottom-4 right-6">
              <button className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-headline hover:bg-white/30 transition-colors flex items-center gap-2">
                <Camera className="w-4 h-4" /> Đổi ảnh bìa
              </button>
            </div>
          )}
        </div>

        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative group -mt-16 md:-mt-20">
              <img
                alt="Profile"
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-8 border-surface-container-lowest object-cover shadow-xl"
                src={avatar}
                referrerPolicy="no-referrer"
              />
              {isMe && (
                <button className="absolute bottom-2 right-2 p-2 bg-surface-container-high text-on-surface rounded-full shadow-md hover:brightness-110 transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Name + bio + stats */}
            <div className="flex-1 text-center md:text-left pt-4 md:pt-6">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <h1 className="font-headline font-extrabold text-3xl md:text-4xl text-on-surface tracking-tight">
                  {displayName}
                </h1>
                {!isMe && user?.role && (
                  <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full w-fit mx-auto md:mx-0">
                    {user.role}
                  </span>
                )}
              </div>
              {user?.bio && (
                <p className="text-on-surface-variant mt-1 max-w-lg leading-relaxed">{user.bio}</p>
              )}
              <div className="flex items-center justify-center md:justify-start gap-6 mt-4">
                <Stat value={user?.following ?? '0'} label="Following" />
                <Stat value={formatCount(followersCount)} label="Followers" border />
                <Stat value={user?.posts ?? '0'} label="Bài viết" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 md:pt-6 flex items-center gap-3">
              {isMe ? (
                <button onClick={openEditModal} className="btn-primary px-8 py-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Chỉnh sửa
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`px-8 py-3 rounded-xl font-headline font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-60 ${
                      isFollowing
                        ? 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                        : 'bg-primary text-on-primary hover:brightness-110 shadow-lg shadow-primary/20'
                    }`}
                  >
                    {followLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : isFollowing ? (
                      <><UserMinus className="w-4 h-4" /> Đang theo dõi</>
                    ) : (
                      <><UserPlus className="w-4 h-4" /> Theo dõi</>
                    )}
                  </button>
                  <button className="p-3 bg-surface-container-high text-on-surface rounded-xl hover:bg-surface-container-highest transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8 border-t border-outline-variant/10">
          <div className="flex items-center gap-8">
            {['Bài viết', 'Ảnh', 'Giới thiệu'].map((tab, i) => (
              <button
                key={tab}
                className={`py-5 font-headline font-bold text-sm transition-colors ${
                  i === 0 ? 'text-primary border-b-2 border-primary' : 'text-outline hover:text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content: Intro + Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Intro card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl surface-elevation-tonal space-y-4">
            <h3 className="font-headline font-bold text-lg text-on-surface">Giới thiệu</h3>
            <div className="space-y-4">
              <IntroItem icon={<LayoutGrid className="w-4 h-4 text-primary" />} text={user?.role ?? 'Thành viên'} />
              <IntroItem icon={<MapPin className="w-4 h-4 text-primary" />} text="Vietnam" />
              {user?.name && (
                <IntroItem icon={<Share2 className="w-4 h-4 text-primary" />} text={user.name} isLink />
              )}
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {postsError && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-error/10 text-error text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{postsError}</span>
            </div>
          )}

          {postsLoading && posts.length === 0 && (
            <div className="flex justify-center py-16">
              <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!postsLoading && posts.length === 0 && (
            <div className="text-center py-16 text-outline">
              <p className="font-headline text-lg mb-1">Chưa có bài viết nào</p>
            </div>
          )}

          {posts.map(post => (
            <PostCard
              key={Number(post.id)}
              post={post}
              onCommentClick={onCommentClick}
              onPostDeleted={(id) => setPosts(prev => prev.filter(p => Number(p.id) !== id))}
              onPostUpdated={(id, updates) => setPosts(prev => prev.map(p => Number(p.id) === id ? { ...p, ...updates } : p))}
            />
          ))}

          {hasMore && posts.length > 0 && (
            <button
              onClick={() => fetchPosts(page + 1)}
              disabled={postsLoading}
              className="w-full py-3 rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-surface-container font-medium text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {postsLoading ? <Loader className="w-4 h-4 animate-spin" /> : null}
              Tải thêm bài viết
            </button>
          )}
        </div>
      </div>

      {/* Profile edit modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-surface-container">
              <h2 className="font-headline font-bold text-lg text-on-surface">Chỉnh sửa profile</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-full hover:bg-surface-container transition-colors">
                <X className="w-5 h-5 text-outline" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">Họ tên</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none"
                  placeholder="Nhập tên hiển thị"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none resize-none"
                  placeholder="Mô tả ngắn về bản thân"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">URL ảnh đại diện</label>
                <input
                  type="text"
                  value={editAvatarUrl}
                  onChange={e => setEditAvatarUrl(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">URL ảnh bìa</label>
                <input
                  type="text"
                  value={editCoverUrl}
                  onChange={e => setEditCoverUrl(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 pb-6 justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={editSaving}
                className="px-6 py-2.5 rounded-xl text-sm text-outline hover:bg-surface-container transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={editSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:brightness-110 disabled:opacity-60 transition-all"
              >
                {editSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
