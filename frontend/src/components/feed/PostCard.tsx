import { useState, FC } from 'react';
import { ThumbsUp, Heart, Smile, Info, MoreHorizontal, Globe, MessageCircle, Share2, Camera, Flag, Pencil, Trash2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { getSocialNetworkApiV1, type PostDto } from '../../api/api-generated';
import useAuthStore from '../../store/authStore';
import { timeAgo, formatCount } from '../../utils/time';
import ReportModal from '../views/ReportModal';

interface PostCardProps {
  post: PostDto;
  onCommentClick?: (post: PostDto) => void;
  /** Callback khi toggle like thành công — dùng để cập nhật state ngoài */
  onLikeToggle?: (postId: number, isLiked: boolean, likesCount: number) => void;
  /** Callback khi chủ bài xóa bài */
  onPostDeleted?: (postId: number) => void;
  /** Callback khi chủ bài chỉnh sửa bài */
  onPostUpdated?: (postId: number, updates: Partial<PostDto>) => void;
}

const PostCard: FC<PostCardProps> = ({ post, onCommentClick, onLikeToggle, onPostDeleted, onPostUpdated }) => {
  const api = getSocialNetworkApiV1();
  const { user: currentUser } = useAuthStore();

  // Optimistic like state — khởi tạo từ dữ liệu server
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(Number(post.likesCount ?? 0));
  const [likeLoading, setLikeLoading] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content ?? '');
  const [editSaving, setEditSaving] = useState(false);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = currentUser && post.user && Number(currentUser.id) === Number(post.user.id);

  const reactions = [
    { icon: <ThumbsUp className="w-5 h-5 text-blue-500 fill-current" />, label: 'Like' },
    { icon: <Heart className="w-5 h-5 text-red-500 fill-current" />, label: 'Love' },
    { icon: <Smile className="w-5 h-5 text-yellow-500 fill-current" />, label: 'Haha' },
    { icon: <Info className="w-5 h-5 text-purple-500 fill-current" />, label: 'Wow' },
  ];

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

  const handleLike = async () => {
    if (likeLoading || !currentUser) return;

    // Optimistic update
    const newIsLiked = !isLiked;
    const newCount   = newIsLiked ? likesCount + 1 : likesCount - 1;
    setIsLiked(newIsLiked);
    setLikesCount(newCount);
    onLikeToggle?.(Number(post.id), newIsLiked, newCount);

    setLikeLoading(true);
    try {
      const res = await api.postApiPostsIdLike(Number(post.id));
      // Đồng bộ lại với kết quả thực từ server
      if (res.success && res.data) {
        setIsLiked(res.data.isLiked ?? newIsLiked);
        setLikesCount(Number(res.data.likesCount ?? newCount));
        onLikeToggle?.(Number(post.id), res.data.isLiked ?? newIsLiked, Number(res.data.likesCount ?? newCount));
      }
    } catch {
      // Rollback nếu lỗi
      setIsLiked(!newIsLiked);
      setLikesCount(likesCount);
      onLikeToggle?.(Number(post.id), !newIsLiked, likesCount);
    } finally {
      setLikeLoading(false);
    }
  };

  // Thông tin tác giả
  const authorName   = post.user?.fullName || post.user?.username || 'Unknown';
  const authorAvatar = post.user?.avatarUrl
    || `https://picsum.photos/seed/${post.user?.username ?? 'user'}/100/100`;

  return (
    <>
    <article className="bg-surface-container-lowest rounded-xl surface-elevation-tonal overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/5 flex-shrink-0">
              <img alt={authorName} src={authorAvatar} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-headline font-bold text-on-surface leading-tight">{authorName}</h4>
              <p className="text-xs text-outline flex items-center gap-1">
                {timeAgo(post.createdAt)} <Globe className="w-3 h-3" />
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
              <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-outline-variant/20 py-1 z-20 min-w-[180px]">
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
              {post.content}
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
          <div className="rounded-lg overflow-hidden max-h-[500px]">
            <img alt="Post" className="w-full h-full object-cover" src={post.imageUrl} referrerPolicy="no-referrer" />
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Stats row */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-container-low">
          <div className="flex items-center -space-x-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center ring-2 ring-white">
              <ThumbsUp className="w-3 h-3 text-white fill-current" />
            </div>
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-white">
              <Heart className="w-3 h-3 text-white fill-current" />
            </div>
            <span className="pl-4 text-xs font-medium text-outline">
              {formatCount(likesCount)} reactions
            </span>
          </div>
          <div className="flex gap-4 text-xs font-medium text-outline">
            <button onClick={handleCommentToggle} className="hover:underline">
              {formatCount(post.commentsCount)} Comments
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mb-6 relative">
          {/* Reaction Picker */}
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-xl border border-outline-variant/20 p-1.5 flex gap-1 z-10"
                onMouseLeave={() => setShowReactions(false)}
              >
                {reactions.map(r => (
                  <motion.button
                    key={r.label}
                    whileHover={{ scale: 1.3, y: -5 }}
                    onClick={() => { handleLike(); setShowReactions(false); }}
                    className="p-2 hover:bg-surface-container rounded-full transition-colors"
                  >
                    {r.icon}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onMouseEnter={() => setShowReactions(true)}
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full transition-all font-medium text-sm disabled:opacity-60 ${
              isLiked
                ? 'bg-primary/10 text-primary'
                : 'bg-secondary-container/30 text-on-secondary-container hover:bg-secondary-container/60'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            {isLiked ? 'Liked' : 'Like'}
          </button>

          <button
            onClick={handleCommentToggle}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full transition-colors font-medium text-sm ${
              showComments ? 'bg-surface-container text-primary' : 'text-outline hover:bg-surface-container hover:text-primary'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Comment
          </button>

          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full hover:bg-surface-container transition-colors font-medium text-sm text-outline hover:text-primary">
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
                    className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary/30 rounded-2xl py-2 px-4 text-sm text-on-surface placeholder:text-outline"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button className="p-1 text-outline hover:text-primary transition-colors"><Smile className="w-4 h-4" /></button>
                    <button className="p-1 text-outline hover:text-primary transition-colors"><Camera className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
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
