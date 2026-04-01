import { ReactNode, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Camera, Settings, LayoutGrid, MapPin, Share2, UserPlus, UserMinus, MessageSquare, Loader, AlertCircle, X, Check, CalendarDays, Info, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSocialNetworkApiV1, type PostDto, type BadgeProgressDto, type UserBadgeDto } from '../../api/api-generated';
import { uploadImage } from '../../api/axios';
import { UserProfile } from '../../types';
import useAuthStore from '../../store/authStore';
import PostCard from '../feed/PostCard';
import ImageUpload from '../ui/ImageUpload';
import BadgeChip from '../ui/BadgeChip';
import { formatCount } from '../../utils/time';
import PokeModal from '../poke/PokeModal';
import UsersModal from '../ui/UsersModal';

interface ProfileViewProps {
  user?: UserProfile;
  onCommentClick?: (post: PostDto) => void;
  /** Chuyển sang Messenger và mở conversation với user này */
  onMessageClick?: (userId: number) => void;
  onHashtagClick?: (tag: string) => void;
  onUserClick?: (user: UserProfile) => void;
}

const Stat = ({ value, label, border, onClick }: { value: string; label: string; border?: boolean; onClick?: () => void }) => (
  <div 
    className={`text-center md:text-left ${border ? 'border-x border-outline-variant/30 px-6' : ''} ${onClick ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
    onClick={(e) => {
      if (onClick) {
        e.stopPropagation();
        onClick();
      }
    }}
  >
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

const ProfileView = ({ user, onCommentClick, onMessageClick, onHashtagClick, onUserClick }: ProfileViewProps) => {
  const api = useMemo(() => getSocialNetworkApiV1(), []);
  const { user: currentUser, updateUser } = useAuthStore();

  // posts state
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // follow state — khởi tạo từ prop user, sau đó đồng bộ với API
  const [internalUser, setInternalUser] = useState<UserProfile | undefined>(user);
  const [isFollowing, setIsFollowing] = useState(user?.isFollowing ?? false);
  const [followersCount, setFollowersCount] = useState(Number(user?.followers ?? 0));
  const [followLoading, setFollowLoading] = useState(false);

  const userId = user ? Number(user.id) : null;
  const isMe   = userId !== null && currentUser ? Number(currentUser.id) === userId : false;

  // Users modal state
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [usersModalType, setUsersModalType] = useState<'followers' | 'following'>('followers');

  const openUsersModal = (type: 'followers' | 'following') => {
    if (!userId) return;
    setUsersModalType(type);
    setShowUsersModal(true);
  };

  // Fetch user data để sync mới nhất (isFollowing, counts, badges...)
  const fetchUserData = useCallback(async () => {
    if (!userId) return;
    try {
      // Dùng endpoint getApiUsersUsername để lấy UserDto mới nhất
      // Nếu là chính mình thì lấy từ Me, nếu là người khác thì lấy theo username
      const username = internalUser?.username || user?.username;
      if (!username) return;

      const res = await api.getApiUsersUsername(username);
      if (res.success && res.data) {
        const freshUser = {
          id: String(res.data.id ?? ''),
          username: res.data.username || '',
          name: res.data.fullName || res.data.username || 'Unknown',
          avatar: res.data.avatarUrl || `https://picsum.photos/seed/${res.data.username}/200/200`,
          cover: res.data.coverUrl || 'https://picsum.photos/seed/cover/1200/400',
          bio: res.data.bio || '',
          role: res.data.role || 'Member',
          followers: String(res.data.followersCount ?? 0),
          following: String(res.data.followingCount ?? 0),
          posts: String(res.data.postsCount ?? 0),
          isFollowing: res.data.isFollowing,
          createdAt: res.data.createdAt,
          dateOfBirth: res.data.dateOfBirth ?? undefined,
          hometown: res.data.hometown ?? undefined,
          gender: res.data.gender ?? undefined,
          displayedBadge: res.data.displayedBadge,
        };
        setInternalUser(freshUser);
        setIsFollowing(freshUser.isFollowing ?? false);
        setFollowersCount(Number(freshUser.followers ?? 0));
      }
    } catch { /* ignore */ }
  }, [userId, api, internalUser?.username, user?.username]);


  // Profile edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPokeModal, setShowPokeModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editHometown, setEditHometown] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Tab state
  type ProfileTab = 'posts' | 'photos' | 'about' | 'badges';
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Badge state
  const [userBadges, setUserBadges] = useState<UserBadgeDto[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgressDto[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const openEditModal = () => {
    setEditFullName(user?.name ?? '');
    setEditBio(user?.bio ?? '');
    setEditAvatarUrl(user?.avatar ?? '');
    setEditCoverUrl(user?.cover ?? '');
    setEditHometown(user?.hometown ?? '');
    setEditGender(user?.gender ?? '');
    setEditDateOfBirth(user?.dateOfBirth ? String(user.dateOfBirth).split('T')[0] : '');
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
        hometown: editHometown || null,
        gender: editGender || null,
        dateOfBirth: editDateOfBirth || null,
      });
      if (res.success && res.data) {
        updateUser(res.data);
        toast.success('Cập nhật profile thành công!');
      }
      setShowEditModal(false);
    } catch {
      toast.error('Không thể cập nhật profile, vui lòng thử lại.');
    } finally {
      setEditSaving(false);
    }
  };

  // Upload ảnh bìa / avatar trực tiếp
  const handleDirectUpload = async (file: File, field: 'avatar' | 'cover') => {
    try {
      const uploadRes = await uploadImage(file);
      if (!uploadRes.success || !uploadRes.data?.url) { toast.error('Upload thất bại'); return; }
      const url = uploadRes.data.url;
      const updatePayload = field === 'avatar'
        ? { avatarUrl: url, fullName: user?.name, bio: user?.bio, coverUrl: user?.cover }
        : { coverUrl: url, fullName: user?.name, bio: user?.bio, avatarUrl: user?.avatar };
      const res = await api.putApiUsersMe(updatePayload);
      if (res.success && res.data) {
        updateUser(res.data);
        toast.success(field === 'avatar' ? 'Đã cập nhật ảnh đại diện' : 'Đã cập nhật ảnh bìa');
      }
    } catch { toast.error('Lỗi upload'); }
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
    setInternalUser(user);
    setIsFollowing(user?.isFollowing ?? false);
    setFollowersCount(Number(user?.followers ?? 0));
    fetchUserData();
    fetchPosts(1, true);
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch badges khi chuyển sang tab badges
  const fetchBadges = useCallback(async () => {
    if (!userId) return;
    setBadgesLoading(true);
    try {
      const badgesRes = await api.getApiBadgesUserUserId(userId);
      if (badgesRes.success && badgesRes.data) setUserBadges(badgesRes.data as UserBadgeDto[]);
      if (isMe) {
        const progressRes = await api.getApiBadgesProgress();
        if (progressRes.success && progressRes.data) setBadgeProgress(progressRes.data as BadgeProgressDto[]);
      }
    } catch { /* ignore */ }
    finally { setBadgesLoading(false); }
  }, [userId, isMe]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'badges') fetchBadges();
  }, [activeTab, fetchBadges]);

  const handleSetDisplayBadge = async (badgeId: number | null) => {
    try {
      await api.putApiBadgesDisplay({ badgeId });
      toast.success(badgeId ? 'Đã chọn badge hiển thị!' : 'Đã tắt badge.');
      fetchBadges();
    } catch { toast.error('Lỗi khi cập nhật badge.'); }
  };

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

  const displayName = (internalUser || user)?.name || 'Unknown';
  const avatar      = (internalUser || user)?.avatar || `https://picsum.photos/seed/${(internalUser || user)?.id}/200/200`;
  const cover       = (internalUser || user)?.cover  || 'https://picsum.photos/seed/cover/1200/400';

  return (
    <div className="flex flex-col gap-8">
      {/* Cover + Profile header */}
      <div className="bg-surface-container-lowest rounded-b-3xl overflow-hidden surface-elevation-tonal">
        <div className="h-64 md:h-80 w-full relative">
          <img alt="Cover" className="w-full h-full object-cover" src={cover} referrerPolicy="no-referrer" />
          {isMe && (
            <div className="absolute bottom-4 right-6">
              <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleDirectUpload(f, 'cover'); e.target.value = ''; }} />
              <button onClick={() => coverInputRef.current?.click()} className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-headline hover:bg-white/30 transition-colors flex items-center gap-2">
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
                <>
                  <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleDirectUpload(f, 'avatar'); e.target.value = ''; }} />
                  <button onClick={() => avatarInputRef.current?.click()} className="absolute bottom-2 right-2 p-2 bg-surface-container-high text-on-surface rounded-full shadow-md hover:brightness-110 transition-all" title="Đổi ảnh đại diện">
                    <Camera className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Name + bio + stats */}
            <div className="flex-1 text-center md:text-left pt-4 md:pt-6">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <h1 className="font-headline font-extrabold text-3xl md:text-4xl text-on-surface tracking-tight">
                  {displayName}
                  {(internalUser || user)?.displayedBadge && (
                    <span className="ml-2 align-middle"><BadgeChip badge={(internalUser || user)!.displayedBadge!} size="md" /></span>
                  )}
                </h1>
                {!isMe && (internalUser || user)?.role && (
                  <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full w-fit mx-auto md:mx-0">
                    {(internalUser || user)?.role}
                  </span>
                )}
              </div>
              {(internalUser || user)?.bio && (
                <p className="text-on-surface-variant mt-1 max-w-lg leading-relaxed">{(internalUser || user)?.bio}</p>
              )}
              <div className="flex items-center justify-center md:justify-start gap-6 mt-4">
                <Stat value={(internalUser || user)?.following ?? '0'} label="Following" onClick={() => openUsersModal('following')} />
                <Stat value={formatCount(followersCount)} label="Followers" border onClick={() => openUsersModal('followers')} />
                <Stat value={(internalUser || user)?.posts ?? '0'} label="Bài viết" />
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
                  <button
                    onClick={() => userId && onMessageClick?.(userId)}
                    className="px-6 py-3 bg-surface-container-high text-on-surface rounded-xl hover:bg-surface-container-highest transition-colors font-headline font-bold text-sm flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Nhắn tin
                  </button>
                  <button
                    onClick={() => setShowPokeModal(true)}
                    className="px-6 py-3 bg-surface-container-high text-on-surface rounded-xl hover:bg-surface-container-highest transition-colors font-headline font-bold text-sm flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" /> Chọc
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8 border-t border-outline-variant/10">
          <div className="flex items-center gap-8">
            {([{ key: 'posts', label: 'Bài viết' }, { key: 'photos', label: 'Ảnh' }, { key: 'about', label: 'Giới thiệu' }, { key: 'badges', label: 'Danh hiệu' }] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-5 font-headline font-bold text-sm transition-colors ${
                  activeTab === tab.key ? 'text-primary border-b-2 border-primary' : 'text-outline hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content: depends on active tab */}
      {activeTab === 'posts' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Intro card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl surface-elevation-tonal space-y-4">
            <h3 className="font-headline font-bold text-lg text-on-surface">Giới thiệu</h3>
            <div className="space-y-4">
              <IntroItem icon={<LayoutGrid className="w-4 h-4 text-primary" />} text={(internalUser || user)?.role ?? 'Thành viên'} />
              <IntroItem icon={<MapPin className="w-4 h-4 text-primary" />} text="Vietnam" />
              {(internalUser || user)?.name && (
                <IntroItem icon={<Share2 className="w-4 h-4 text-primary" />} text={(internalUser || user)!.name} isLink />
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
              onHashtagClick={onHashtagClick}
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
      )}

      {/* Tab: Ảnh */}
      {activeTab === 'photos' && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 surface-elevation-tonal">
          <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Ảnh</h3>
          {(() => {
            const photoPosts = posts.filter(p => p.imageUrl);
            if (postsLoading && posts.length === 0) return <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-primary" /></div>;
            if (photoPosts.length === 0) return <p className="text-outline text-center py-12">Chưa có ảnh nào</p>;
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photoPosts.map(post => (
                  <div key={Number(post.id)} className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => { setActiveTab('posts'); onCommentClick?.(post); }}>
                    <img src={post.imageUrl!} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab: Giới thiệu */}
      {activeTab === 'about' && (
        <div className="max-w-2xl">
          <div className="bg-surface-container-lowest rounded-2xl p-6 surface-elevation-tonal space-y-6">
            <h3 className="font-headline font-bold text-lg text-on-surface">Giới thiệu</h3>

            {(internalUser || user)?.bio && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-outline uppercase tracking-wider">Bio</span>
                <p className="text-on-surface-variant leading-relaxed">{(internalUser || user)?.bio}</p>
              </div>
            )}

            <div className="space-y-4 pt-2">
              <IntroItem icon={<Info className="w-4 h-4 text-primary" />} text={`@${(internalUser || user)?.username ?? 'unknown'}`} />
              <IntroItem icon={<LayoutGrid className="w-4 h-4 text-primary" />} text={(internalUser || user)?.role ?? 'Thành viên'} />
              {(internalUser || user)?.hometown && (
                <IntroItem icon={<MapPin className="w-4 h-4 text-primary" />} text={(internalUser || user)!.hometown!} />
              )}
              {!(internalUser || user)?.hometown && (
                <IntroItem icon={<MapPin className="w-4 h-4 text-primary" />} text="Chưa cập nhật quê quán" />
              )}
              {(internalUser || user)?.gender && (
                <IntroItem icon={<Share2 className="w-4 h-4 text-primary" />} text={(internalUser || user)!.gender === 'Male' ? 'Nam' : (internalUser || user)!.gender === 'Female' ? 'Nữ' : 'Khác'} />
              )}
              {(internalUser || user)?.dateOfBirth && (
                <IntroItem icon={<CalendarDays className="w-4 h-4 text-primary" />} text={`Sinh ngày: ${new Date((internalUser || user)!.dateOfBirth!).toLocaleDateString('vi-VN')}`} />
              )}
              <IntroItem icon={<CalendarDays className="w-4 h-4 text-primary" />} text={`Tham gia: ${(internalUser || user)?.createdAt ? new Date((internalUser || user)!.createdAt!).toLocaleDateString('vi-VN') : '—'}`} />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-outline-variant/10">
              <div className="text-center p-4 bg-surface-container-low rounded-xl">
                <span className="block font-bold text-xl text-on-surface">{(internalUser || user)?.posts ?? '0'}</span>
                <span className="text-xs text-outline">Bài viết</span>
              </div>
              <div 
                className="text-center p-4 bg-surface-container-low rounded-xl cursor-pointer hover:bg-surface-container transition-colors"
                onClick={(e) => { e.stopPropagation(); openUsersModal('followers'); }}
              >
                <span className="block font-bold text-xl text-on-surface">{formatCount(followersCount)}</span>
                <span className="text-xs text-outline">Followers</span>
              </div>
              <div 
                className="text-center p-4 bg-surface-container-low rounded-xl cursor-pointer hover:bg-surface-container transition-colors"
                onClick={(e) => { e.stopPropagation(); openUsersModal('following'); }}
              >
                <span className="block font-bold text-xl text-on-surface">{(internalUser || user)?.following ?? '0'}</span>
                <span className="text-xs text-outline">Following</span>
              </div>
            </div>

            {isMe && (
              <button onClick={openEditModal} className="w-full py-3 bg-surface-container-low text-on-surface-variant rounded-xl hover:bg-surface-container font-medium text-sm transition-colors flex items-center justify-center gap-2">
                <Settings className="w-4 h-4" /> Chỉnh sửa thông tin
              </button>
            )}
          </div>
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div className="max-w-2xl">
          <div className="bg-surface-container-lowest rounded-2xl p-6 surface-elevation-tonal space-y-6">
            <h3 className="font-headline font-bold text-lg text-on-surface">Danh hiệu</h3>

            {badgesLoading ? (
              <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <>
                {/* Earned badges grid */}
                {userBadges.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {userBadges.map(b => (
                      <div
                        key={b.badgeId}
                        className={`relative p-4 rounded-xl text-center cursor-default transition-all ${
                          b.isDisplayed
                            ? 'ring-2 ring-primary bg-primary/5'
                            : 'bg-surface-container-low hover:bg-surface-container'
                        }`}
                      >
                        <span className="text-3xl block mb-1">{b.icon}</span>
                        <span className="text-sm font-bold text-on-surface block">{b.name}</span>
                        <span className="text-[10px] text-outline block mt-0.5">{b.description}</span>
                        <span className="text-[9px] text-outline block mt-1">{b.earnedAt ? new Date(b.earnedAt).toLocaleDateString('vi-VN') : ''}</span>
                        {isMe && (
                          <button
                            onClick={() => handleSetDisplayBadge(b.isDisplayed ? null : Number(b.badgeId))}
                            className={`mt-2 text-[10px] font-bold px-3 py-1 rounded-full transition-colors ${
                              b.isDisplayed
                                ? 'bg-primary text-white'
                                : 'bg-surface-container-high text-on-surface-variant hover:bg-primary/20 hover:text-primary'
                            }`}
                          >
                            {b.isDisplayed ? '✓ Đang hiển thị' : 'Chọn hiển thị'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-on-surface-variant text-sm text-center py-4">Chưa có danh hiệu nào.</p>
                )}

                {/* Progress section (only for self) */}
                {isMe && badgeProgress.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-outline-variant/10">
                    <h4 className="font-bold text-sm text-on-surface">Tiến độ</h4>
                    {badgeProgress.filter(b => !b.isEarned && b.conditionType !== 'Manual').map(b => {
                      const pct = b.conditionValue ? Math.min(100, Math.round((Number(b.currentValue) / Number(b.conditionValue)) * 100)) : 0;
                      return (
                        <div key={b.badgeId} className="flex items-center gap-3">
                          <span className="text-xl flex-shrink-0">{b.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="font-semibold text-on-surface truncate">{b.name}</span>
                              <span className="text-outline">{b.currentValue}/{b.conditionValue}</span>
                            </div>
                            <div className="w-full bg-surface-container-high rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full transition-all"
                                style={{ width: `${pct}%`, backgroundColor: b.color ?? '#6366f1' }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Profile edit modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/10">
              <h2 className="font-headline font-bold text-lg text-on-surface">Chỉnh sửa profile</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-full hover:bg-surface-container transition-colors">
                <X className="w-5 h-5 text-outline" />
              </button>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div>
                <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1.5 ml-1">Họ tên</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl py-2 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all"
                  placeholder="Nhập tên hiển thị"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1.5 ml-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  rows={2}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl py-2 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none resize-none transition-all"
                  placeholder="Mô tả ngắn về bản thân"
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1.5 ml-1">Ảnh đại diện</label>
                  <ImageUpload value={editAvatarUrl || undefined} onChange={url => setEditAvatarUrl(url ?? '')} variant="avatar" placeholder="Chọn avatar" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1.5 ml-1">Ảnh bìa</label>
                  <ImageUpload value={editCoverUrl || undefined} onChange={url => setEditCoverUrl(url ?? '')} variant="banner" placeholder="Chọn ảnh bìa" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1.5 ml-1">Ngày sinh</label>
                <input
                  type="date"
                  value={editDateOfBirth}
                  onChange={e => setEditDateOfBirth(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl py-2 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1.5 ml-1">Quê quán</label>
                <input
                  type="text"
                  value={editHometown}
                  onChange={e => setEditHometown(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl py-2 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all"
                  placeholder="Nhập quê quán"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1.5 ml-1">Giới tính</label>
                <select
                  value={editGender}
                  onChange={e => setEditGender(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl py-2 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all"
                >
                  <option value="">Chưa chọn</option>
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                  <option value="Other">Khác</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 p-5 bg-surface-container-lowest border-t border-outline-variant/10 justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={editSaving}
                className="px-5 py-2 rounded-xl text-sm font-bold text-outline hover:bg-surface-container transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={editSaving}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:brightness-110 shadow-lg shadow-primary/20 disabled:opacity-60 transition-all active:scale-95"
              >
                {editSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Poke Modal */}
      {userId && (internalUser || user) && (
        <PokeModal
          targetUserId={userId}
          targetName={(internalUser || user)!.name}
          isOpen={showPokeModal}
          onClose={() => setShowPokeModal(false)}
        />
      )}

      {/* Users Modal (Followers/Following) */}
      {userId && (
        <UsersModal
          userId={userId}
          type={usersModalType}
          isOpen={showUsersModal}
          onClose={() => setShowUsersModal(false)}
          onUserClick={onUserClick}
        />
      )}
    </div>
  );
};

export default ProfileView;
