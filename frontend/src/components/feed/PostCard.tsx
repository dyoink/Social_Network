import { useState, FC, useRef } from 'react';
import { ThumbsUp, Heart, MoreHorizontal, Globe, MessageCircle, Share2, Flag, Pencil, Trash2, Check, X, ArrowRight, Users, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { getSocialNetworkApiV1, type PostDto, type UserDto } from '../../api/api-generated';
import useAuthStore from '../../store/authStore';
import { timeAgo, formatCount } from '../../utils/time';
import ReportModal from '../views/ReportModal';
import BadgeChip from '../ui/BadgeChip';

// 5 loại reaction với emoji thật
const REACTIONS = [
  { type: 'Like',  emoji: '👍', label: 'Thích',     color: 'text-blue-500' },
  { type: 'Love',  emoji: '❤️', label: 'Yêu thích', color: 'text-red-500' },
  { type: 'Wow',   emoji: '😲', label: 'Bất ngờ',   color: 'text-yellow-500' },
  { type: 'Angry', emoji: '😡', label: 'Tức giận',  color: 'text-orange-600' },
  { type: 'Sad',   emoji: '😢', label: 'Buồn',      color: 'text-blue-400' },
] as const;

const REACTION_EMOJI_MAP: Record<string, string> = {
  Like: '👍', Love: '❤️', Wow: '😲', Angry: '😡', Sad: '😢'
};

const REACTION_BG_MAP: Record<string, string> = {
  Like: 'bg-blue-500', Love: 'bg-red-500', Wow: 'bg-yellow-500', Angry: 'bg-orange-600', Sad: 'bg-blue-400'
};

// ─── Inline comment input cho mobile/tablet ─────────────────────────────────
const InlineMobileComment = ({ postId, currentUser, onCommentAdded }: { postId: number; currentUser: UserDto | null; onCommentAdded: () => void }) => {
  const api = getSocialNetworkApiV1();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await api.postApiComments({ postId, content });
      if (res.success) {
        setText('');
        onCommentAdded();
        toast.success('Đã bình luận.');
      }
    } catch {
      toast.error('Gửi bình luận thất bại.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex gap-3 mt-2">
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
        <img
          alt="User"
          src={currentUser?.avatarUrl || `https://picsum.photos/seed/${currentUser?.username}/100/100`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="Viết bình luận..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          disabled={sending}
          className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary/30 rounded-2xl py-2 px-4 pr-10 text-sm text-on-surface placeholder:text-outline"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || sending}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary disabled:text-outline transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface PostCardProps {
  post: PostDto;
  onCommentClick?: (post: PostDto) => void;
  onImageClick?: (post: PostDto) => void;
  onLikeToggle?: (postId: number, isLiked: boolean, likesCount: number) => void;
  onPostDeleted?: (postId: number) => void;
  onPostUpdated?: (postId: number, updates: Partial<PostDto>) => void;
  onHashtagClick?: (tag: string) => void;
  onUserClick?: (user: UserProfile) => void;
}

/** Chuyển đổi UserDto (backend) sang UserProfile (legacy compatibility) */
function userDtoToProfile(user: UserDto): UserProfile {
  return {
    id: String(user.id ?? ''),
    username: user.username || '',
    name: user.fullName || user.username || 'Unknown',
    avatar: user.avatarUrl || `https://picsum.photos/seed/${user.username}/200/200`,
    cover: user.coverUrl || 'https://picsum.photos/seed/cover/1200/400',
    bio: user.bio || '',
    role: user.role || 'Member',
    followers: String(user.followersCount ?? 0),
    following: String(user.followingCount ?? 0),
    posts: String(user.postsCount ?? 0),
    isFollowing: user.isFollowing,
    createdAt: user.createdAt,
    displayedBadge: user.displayedBadge,
  };
}

/** Parse #hashtag và @mention trong content → JSX với highlight */
function renderContentWithHashtags(content: string, onHashtagClick?: (tag: string) => void, onUserClick?: (u: UserProfile) => void) {
  // Match #hashtag hoặc @username
  const parts = content.split(/(#\w+|@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return (
        <span
          key={i}
          className="text-primary font-semibold cursor-pointer hover:underline"
          onClick={(e) => { e.stopPropagation(); onHashtagClick?.(part.slice(1)); }}
        >
          {part}
        </span>
      );
    }
    if (part.startsWith('@')) {
      return (
        <span key={i} className="text-secondary font-semibold">{part}</span>
      );
    }
    return part;
  });
}

const PostCard: FC<PostCardProps> = ({ post, onCommentClick, onImageClick, onLikeToggle, onPostDeleted, onPostUpdated, onHashtagClick, onUserClick }) => {
  const api = getSocialNetworkApiV1();
  const { user: currentUser } = useAuthStore();

  // Optimistic like state — khởi tạo từ dữ liệu server
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(Number(post.likesCount ?? 0));
  const [myReaction, setMyReaction] = useState<string | null>(post.myReaction ?? (post.isLiked ? 'Like' : null));
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(() => {
    const raw = post.reactionCounts;
    if (!raw || typeof raw !== 'object') return {};
    const parsed: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) parsed[k] = Number(v ?? 0);
    return parsed;
  });
  const [likeLoading, setLikeLoading] = useState(false);

  const [commentsCount, setCommentsCount] = useState(Number(post.commentsCount ?? 0));

  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const reactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content ?? '');
  const [editSaving, setEditSaving] = useState(false);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = currentUser && post.user && Number(currentUser.id) === Number(post.user.id);

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.user && onUserClick) {
      onUserClick(userDtoToProfile(post.user));
    }
  };

  const handleCommentToggle = () => {
    if (onCommentClick && window.innerWidth >= 1024) {
      onCommentClick(post);
    } else {
      setShowComments(!showComments);
    }
  };

  const handleEdit = async () => {
    const content = editContent.trim();
    if (!content || editSaving) return;
    setEditSaving(true);
    try {
      const res = await api.putApiPostsId(Number(post.id), { content });
      if (res.success) {
        onPostUpdated?.(Number(post.id), { content });
        setIsEditing(false);
        toast.success('Đã cập nhật bài viết.');
      }
    } catch {
      toast.error('Không thể cập nhật bài viết, vui lòng thử lại.');
      // bỏ qua lỗi — nội dung không cập nhật
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await api.deleteApiPostsId(Number(post.id));
      onPostDeleted?.(Number(post.id));
    } catch {
      toast.error('Không thể xóa bài viết, vui lòng thử lại.');
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleReaction = async (reactionType: string = 'Like') => {
    if (likeLoading || !currentUser) return;

    // Optimistic update
    const prevIsLiked = isLiked;
    const prevCount = likesCount;
    const prevMyReaction = myReaction;

    const isSameReaction = myReaction === reactionType;
    const newIsLiked = !isSameReaction;
    const newCount = isSameReaction ? likesCount - 1 : (isLiked ? likesCount : likesCount + 1);

    setIsLiked(newIsLiked);
    setLikesCount(newCount);
    setMyReaction(newIsLiked ? reactionType : null);
    setShowReactions(false);
    onLikeToggle?.(Number(post.id), newIsLiked, newCount);

    setLikeLoading(true);
    try {
      const res = await api.postApiPostsIdLike(Number(post.id), { reactionType });
      if (res.success && res.data) {
        setIsLiked(res.data.isLiked ?? newIsLiked);
        setLikesCount(Number(res.data.likesCount ?? newCount));
        setMyReaction(res.data.reactionType ?? null);
        // Cập nhật reaction counts từ server
        const counts: Record<string, number> = {};
        if (res.data.reactionCounts) {
          for (const [k, v] of Object.entries(res.data.reactionCounts)) counts[k] = Number(v);
        }
        setReactionCounts(counts);
        onLikeToggle?.(Number(post.id), res.data.isLiked ?? newIsLiked, Number(res.data.likesCount ?? newCount));
      }
    } catch {
      // Rollback
      setIsLiked(prevIsLiked);
      setLikesCount(prevCount);
      setMyReaction(prevMyReaction);
      onLikeToggle?.(Number(post.id), prevIsLiked, prevCount);
    } finally {
      setLikeLoading(false);
    }
  };

  // Top 3 reaction types cho hiển thị
  const topReactions = Object.entries(reactionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .filter(([, count]) => count > 0);

  // Thông tin tác giả
  const authorName   = post.user?.fullName || post.user?.username || 'Unknown';
  const authorAvatar = post.user?.avatarUrl
    || `https://picsum.photos/seed/${post.user?.username ?? 'user'}/100/100`;

  return (
    <>
    <article className="bg-surface-container-lowest rounded-xl surface-elevation-tonal overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleAuthorClick}>
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/5 flex-shrink-0 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
              <img alt={authorName} src={authorAvatar} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-headline font-bold text-on-surface leading-tight group-hover:text-primary transition-colors">
                {authorName}
                {post.user?.displayedBadge && (
                  <span className="ml-1.5 align-middle"><BadgeChip badge={post.user.displayedBadge} /></span>
                )}
              </h4>
              <p className="text-xs text-outline flex items-center gap-1">
                {timeAgo(post.createdAt)} {post.visibility === 'FollowersOnly' ? <Users className="w-3 h-3" /> : post.visibility === 'Private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
              </p>
            </div>
          </div>
          <div className="relative">
            <button
              className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors"
              onClick={() => setShowMenu(m => !m)}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/20 py-1 z-20 min-w-[180px]">
                {isOwner ? (
                  <>
                    <button
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                      onClick={() => { setShowMenu(false); setEditContent(post.content ?? ''); setIsEditing(true); }}
                    >
                      <Pencil className="w-4 h-4 text-primary" />
                      Chỉnh sửa bài viết
                    </button>
                    <button
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      onClick={() => { setShowMenu(false); setDeleteConfirm(true); }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa bài viết
                    </button>
                  </>
                ) : (
                  <button
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    onClick={() => { setShowMenu(false); setShowReportModal(true); }}
                  >
                    <Flag className="w-4 h-4" />
                    Báo cáo bài viết
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {isEditing ? (
          <div className="mb-5">
            <textarea
              className="w-full bg-surface-container-low border border-outline-variant/30 focus:ring-2 focus:ring-primary/30 rounded-xl py-3 px-4 text-sm text-on-surface placeholder:text-outline resize-none min-h-[100px]"
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              disabled={editSaving}
              autoFocus
            />
            <div className="flex items-center gap-2 mt-2 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                disabled={editSaving}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm text-outline hover:bg-surface-container transition-colors"
              >
                <X className="w-4 h-4" /> Hủy
              </button>
              <button
                onClick={handleEdit}
                disabled={editSaving || !editContent.trim()}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm bg-primary text-white hover:brightness-110 disabled:opacity-60 transition-all"
              >
                <Check className="w-4 h-4" /> Lưu
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-on-surface-variant leading-relaxed mb-5 whitespace-pre-wrap">
              {renderContentWithHashtags(post.content ?? '', onHashtagClick, onUserClick)}
            </p>
            {deleteConfirm && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm">
                <p className="text-red-700 font-medium mb-3">Bạn có chắc muốn xóa bài viết này không? Hành động này không thể hoàn tác.</p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    disabled={deleting}
                    className="px-4 py-1.5 rounded-lg text-outline hover:bg-surface-container text-sm transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-1 px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-60 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> {deleting ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {post.imageUrl && (
        <div className="px-2">
          <div className="rounded-lg overflow-hidden bg-surface-container-low/30 cursor-pointer" onClick={() => onImageClick?.(post)}>
            <img 
              alt="Post content" 
              className="w-full max-h-[700px] object-contain mx-auto transition-transform hover:scale-[1.01]" 
              src={post.imageUrl} 
              referrerPolicy="no-referrer" 
            />
          </div>
        </div>
      )}

      {post.videoUrl && (
        <div className="px-2">
          <div className="rounded-lg overflow-hidden bg-black cursor-pointer" onClick={() => onImageClick?.(post)}>
            <video
              src={post.videoUrl}
              className="w-full max-h-[700px] object-contain mx-auto transition-transform hover:scale-[1.01]"
              controls={false}
              playsInline
              preload="metadata"
            />
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Stats row */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-container-low">
          <div className="flex items-center -space-x-1">
            {topReactions.length > 0 ? topReactions.map(([type]) => (
              <div key={type} className={`w-6 h-6 rounded-full ${REACTION_BG_MAP[type] ?? 'bg-primary'} flex items-center justify-center ring-2 ring-white text-xs`}>
                {REACTION_EMOJI_MAP[type] ?? '👍'}
              </div>
            )) : (
              <>
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center ring-2 ring-white text-xs">👍</div>
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-white text-xs">❤️</div>
              </>
            )}
            <span className="pl-3 text-xs font-medium text-outline">
              {formatCount(likesCount)} reactions
            </span>
          </div>
          <div className="flex gap-4 text-xs font-medium text-outline">
            <button onClick={handleCommentToggle} className="hover:underline">
              {formatCount(commentsCount)} Comments
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mb-6">
          {/* Like button + Reaction Picker — wrapper xử lý mouseLeave cho cả 2 */}
          <div
            className="flex-1 relative"
            onMouseEnter={() => {
              reactionTimerRef.current = setTimeout(() => setShowReactions(true), 400);
            }}
            onMouseLeave={() => {
              if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
              setShowReactions(false);
            }}
          >
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-full left-0 mb-2 bg-surface-container-lowest rounded-full shadow-xl border border-outline-variant/20 p-1.5 flex gap-1 z-10"
                >
                  {REACTIONS.map(r => (
                    <motion.button
                      key={r.type}
                      whileHover={{ scale: 1.4, y: -8 }}
                      onClick={() => handleReaction(r.type)}
                      className="relative p-2 hover:bg-surface-container rounded-full transition-colors group"
                      title={r.label}
                    >
                      <span className="text-xl">{r.emoji}</span>
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] font-medium px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {r.label}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => handleReaction(myReaction || 'Like')}
              disabled={likeLoading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-full transition-all font-medium text-sm disabled:opacity-60 ${
                isLiked
                  ? `bg-primary/10 ${REACTIONS.find(r => r.type === myReaction)?.color ?? 'text-primary'}`
                  : 'bg-secondary-container/30 text-on-secondary-container hover:bg-secondary-container/60'
              }`}
            >
              {isLiked && myReaction ? (
                <span className="text-base">{REACTION_EMOJI_MAP[myReaction] ?? '👍'}</span>
              ) : (
                <ThumbsUp className="w-4 h-4" />
              )}
              {isLiked && myReaction ? (REACTIONS.find(r => r.type === myReaction)?.label ?? 'Thích') : 'Thích'}
            </button>
          </div>

          <button
            onClick={handleCommentToggle}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full transition-colors font-medium text-sm ${
              showComments ? 'bg-surface-container text-primary' : 'text-outline hover:bg-surface-container hover:text-primary'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Comment
          </button>

          <button
            onClick={() => {
              const url = `${window.location.origin}/post/${post.id}`;
              navigator.clipboard.writeText(url).then(() => toast.success('Đã sao chép liên kết!')).catch(() => toast.error('Không thể sao chép.'));
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full hover:bg-surface-container transition-colors font-medium text-sm text-outline hover:text-primary"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Inline comment input (mobile/tablet) */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden lg:hidden"
            >
              <InlineMobileComment postId={Number(post.id)} currentUser={currentUser} onCommentAdded={() => {
                setCommentsCount(c => c + 1);
              }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>

    {showReportModal && (
      <ReportModal
        targetPostId={Number(post.id)}
        onClose={() => setShowReportModal(false)}
      />
    )}
  </>
  );
};

export default PostCard;
