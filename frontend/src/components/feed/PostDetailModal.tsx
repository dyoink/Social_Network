import { useState, useEffect, useRef, FC, useMemo } from 'react';
import React from 'react';
import { X, ArrowRight, Loader, AlertCircle, CornerDownRight, MessageSquare, ThumbsUp, Heart, Globe, Users, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { getSocialNetworkApiV1, type PostDto, type CommentDto, type UserSummaryDto, type UserDto } from '../../api/api-generated';
import useAuthStore from '../../store/authStore';
import { timeAgo, formatCount } from '../../utils/time';
import BadgeChip from '../ui/BadgeChip';
import { UserProfile } from '../../types';

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
    isFollowing: false,
    displayedBadge: u.displayedBadge,
  };
}

interface CommentItemProps {
  comment: CommentDto;
  onReply: (comment: CommentDto) => void;
  onUserClick?: (user: UserProfile) => void;
}

const CommentItem = ({ comment, onReply, onUserClick }: CommentItemProps) => {
  const api = getSocialNetworkApiV1();
  const authorName  = comment.user?.fullName || comment.user?.username || 'Someone';
  const authorAvatar = comment.user?.avatarUrl || `https://picsum.photos/seed/${comment.user?.id}/50/50`;

  const [replies, setReplies] = useState<CommentDto[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const repliesCount = Number(comment.repliesCount ?? 0);

  const handleLoadReplies = async () => {
    if (showReplies) { setShowReplies(false); return; }
    setLoadingReplies(true);
    try {
      const res = await api.getApiCommentsCommentIdReplies(Number(comment.id));
      if (res.success && res.data) {
        setReplies((res.data as CommentDto[]) ?? []);
      }
    } catch { /* ignore */ } finally {
      setLoadingReplies(false);
      setShowReplies(true);
    }
  };

  return (
    <div className="flex gap-3">
      <img
        alt={authorName}
        src={authorAvatar}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0 cursor-pointer"
        referrerPolicy="no-referrer"
        onClick={() => comment.user && onUserClick?.(summaryToProfile(comment.user))}
      />
      <div className="flex-1">
        <div className="bg-surface-container-low rounded-2xl p-3">
          <h5 className="text-xs font-bold text-on-surface mb-1">
            {authorName}
            {comment.user?.displayedBadge && (
              <span className="ml-1 align-middle"><BadgeChip badge={comment.user.displayedBadge} /></span>
            )}
          </h5>
          <p className="text-sm text-on-surface-variant leading-snug">{comment.content}</p>
        </div>
        <div className="flex items-center gap-4 mt-1 ml-2">
          <button className="text-[10px] font-bold text-outline hover:text-primary transition-colors" onClick={() => onReply(comment)}>Trả lời</button>
          <span className="text-[10px] text-outline">{timeAgo(comment.createdAt)}</span>
          {repliesCount > 0 && (
            <button className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5" onClick={handleLoadReplies}>
              {loadingReplies ? <Loader className="w-3 h-3 animate-spin" /> : <><CornerDownRight className="w-3 h-3" />{showReplies ? 'Ẩn' : `Xem ${repliesCount} trả lời`}</>}
            </button>
          )}
        </div>

        {showReplies && replies.length > 0 && (
          <div className="mt-3 ml-4 space-y-3 border-l-2 border-surface-container pl-3">
            {replies.map(reply => (
              <div key={String(reply.id)} className="flex gap-2">
                <img 
                  src={reply.user?.avatarUrl || `https://picsum.photos/seed/${reply.user?.id}/50/50`} 
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0" 
                  referrerPolicy="no-referrer" 
                />
                <div className="flex-1">
                  <div className="bg-surface-container-low rounded-2xl p-2.5">
                    <h5 className="text-[11px] font-bold text-on-surface mb-0.5">{reply.user?.fullName || reply.user?.username}</h5>
                    <p className="text-xs text-on-surface-variant leading-snug">{reply.content}</p>
                  </div>
                  <span className="text-[10px] text-outline ml-2">{timeAgo(reply.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface PostDetailModalProps {
  post: PostDto;
  onClose: () => void;
  onUserClick?: (user: UserProfile) => void;
}

const PostDetailModal: FC<PostDetailModalProps> = ({ post, onClose, onUserClick }) => {
  const api = useMemo(() => getSocialNetworkApiV1(), []);
  const { user: currentUser } = useAuthStore();
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTarget, setReplyTarget] = useState<CommentDto | null>(null);
  const [isRawView, setIsRawView] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getApiCommentsPostPostId(Number(post.id), { page: 1, pageSize: 50 });
        if (res.success && res.data) setComments(res.data.items as CommentDto[] ?? []);
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    load();
  }, [post.id, api]);

  const handleSubmit = async () => {
    const content = newComment.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.postApiComments({
        postId: Number(post.id),
        content,
        parentId: replyTarget ? Number(replyTarget.id) : undefined,
      });
      if (res.success && res.data) {
        if (replyTarget) {
          setComments(prev => prev.map(c => Number(c.id) === Number(replyTarget.id) ? { ...c, repliesCount: (Number(c.repliesCount ?? 0) + 1) } : c));
          setReplyTarget(null);
        } else {
          setComments(prev => [res.data!, ...prev]);
        }
        setNewComment('');
      }
    } catch { toast.error('Gửi thất bại'); } finally { setSubmitting(false); }
  };

  const authorName = post.user?.fullName || post.user?.username || 'Unknown';
  const authorAvatar = post.user?.avatarUrl || `https://picsum.photos/seed/${post.user?.id}/50/50`;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 md:p-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-[95vw] xl:max-w-7xl h-full max-h-[95vh] bg-surface-container-lowest rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"><X className="w-6 h-6" /></button>

        {/* Media Side (Larger space) */}
        <div 
          className="w-full md:w-[65%] lg:w-[70%] bg-black flex items-center justify-center overflow-hidden border-r border-outline-variant/10 relative group cursor-zoom-in"
          onDoubleClick={() => (post.imageUrl || post.videoUrl) && setIsRawView(true)}
          title="Nhấn đúp để xem kích thước chuẩn"
        >
          {post.videoUrl ? (
            <video src={post.videoUrl} controls autoPlay className="w-full h-full object-contain" />
          ) : post.imageUrl ? (
            <img src={post.imageUrl} alt="Post" className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]" referrerPolicy="no-referrer" />
          ) : (
            <div className="p-10 md:p-20 w-full overflow-y-auto max-h-full custom-scrollbar flex items-center justify-center bg-gradient-to-br from-surface-container-low to-black">
              <p className="text-2xl md:text-4xl text-white font-medium leading-relaxed italic text-center drop-shadow-lg">"{post.content}"</p>
            </div>
          )}
          
          {(post.imageUrl || post.videoUrl) && (
            <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-white/70 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Nhấn đúp để phóng đại
            </div>
          )}
        </div>

        {/* Comments Side (Fixed width on large screens) */}
        <div className="w-full md:w-[35%] lg:w-[30%] flex flex-col h-full bg-surface-container-lowest">
          {/* Header */}
          <div className="p-4 border-b border-surface-container flex items-center gap-3 shrink-0">
            <img src={authorAvatar} className="w-10 h-10 rounded-full object-cover" alt="" />
            <div>
              <h4 className="font-bold text-sm text-on-surface">{authorName}</h4>
              <p className="text-[10px] text-outline flex items-center gap-1">{timeAgo(post.createdAt)} • {post.visibility}</p>
            </div>
          </div>

          {/* Content (if media exists, content goes here too) */}
          {(post.imageUrl || post.videoUrl) && (
            <div className="p-4 border-b border-surface-container max-h-32 overflow-y-auto custom-scrollbar shrink-0">
              <p className="text-sm text-on-surface-variant leading-relaxed">{post.content}</p>
            </div>
          )}

          {/* Stats */}
          <div className="px-4 py-2 border-b border-surface-container flex items-center justify-between text-xs text-outline shrink-0">
            <div className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500 fill-current" /> {formatCount(post.likesCount)}</div>
            <div>{formatCount(comments.length)} bình luận</div>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {loading ? <div className="flex justify-center py-10"><Loader className="w-6 h-6 animate-spin text-primary" /></div> :
             comments.length === 0 ? <p className="text-center text-outline text-sm py-10 italic">Chưa có bình luận nào</p> :
             comments.map(c => <CommentItem key={String(c.id)} comment={c} onReply={setReplyTarget} onUserClick={onUserClick} />)}
          </div>

          {/* Input */}
          <div className="p-4 bg-surface-container-low/30 border-t border-surface-container shrink-0">
            {replyTarget && (
              <div className="flex items-center gap-2 mb-2 text-xs text-primary bg-primary/5 rounded-lg px-3 py-1.5">
                <CornerDownRight className="w-3 h-3" />
                <span>Trả lời <strong>{replyTarget.user?.username}</strong></span>
                <button onClick={() => setReplyTarget(null)} className="ml-auto text-outline"><X className="w-3 h-3" /></button>
              </div>
            )}
            <div className="bg-surface-container-low rounded-2xl p-2 flex items-center gap-2">
              <input 
                ref={inputRef}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 text-on-surface placeholder:text-outline"
                placeholder="Viết bình luận..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(); }}
                disabled={submitting}
              />
              <button onClick={handleSubmit} disabled={submitting || !newComment.trim()} className="p-2 text-primary">{submitting ? <Loader className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-5 h-5" />}</button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Raw Media View Overlay */}
      <AnimatePresence>
        {isRawView && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black flex items-center justify-center cursor-zoom-out"
            onClick={() => setIsRawView(false)}
          >
            <button className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 z-20"><X className="w-8 h-8" /></button>
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
              {post.videoUrl ? (
                <video src={post.videoUrl} controls autoPlay className="max-w-none w-full h-auto shadow-2xl" />
              ) : (
                <img src={post.imageUrl} alt="Raw" className="max-w-none w-auto h-auto shadow-2xl" referrerPolicy="no-referrer" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostDetailModal;
