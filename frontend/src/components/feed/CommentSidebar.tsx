import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { X, ArrowRight, Loader, AlertCircle, CornerDownRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSocialNetworkApiV1, type PostDto, type CommentDto, type UserSummaryDto, type UserDto } from '../../api/api-generated';
import useAuthStore from '../../store/authStore';
import { timeAgo } from '../../utils/time';
import BadgeChip from '../ui/BadgeChip';
import { UserProfile } from '../../types';

interface CommentItemProps {
  comment: CommentDto;
  onReply: (comment: CommentDto) => void;
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
    isFollowing: false,
    displayedBadge: u.displayedBadge,
  };
}

// Helper for UserDto (from post author)
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

// Một comment đơn (có thể là reply)
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
    } catch {
      // ignore
    } finally {
      setLoadingReplies(false);
      setShowReplies(true);
    }
  };

  const handleUserClick = () => {
    if (comment.user && onUserClick) {
      onUserClick(summaryToProfile(comment.user));
    }
  };

  return (
    <div className="flex gap-3">
      <img
        alt={authorName}
        src={authorAvatar}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        referrerPolicy="no-referrer"
        onClick={handleUserClick}
      />
      <div className="flex-1">
        <div className="bg-surface-container-low rounded-2xl p-3">
          <h5 className="text-xs font-bold text-on-surface mb-1 cursor-pointer hover:text-primary transition-colors" onClick={handleUserClick}>
            {authorName}
            {comment.user?.displayedBadge && (
              <span className="ml-1 align-middle"><BadgeChip badge={comment.user.displayedBadge} /></span>
            )}
          </h5>
          <p className="text-sm text-on-surface-variant leading-snug">{comment.content}</p>
        </div>
        <div className="flex items-center gap-4 mt-1 ml-2">
          <button
            className="text-[10px] font-bold text-outline hover:text-primary transition-colors"
            onClick={() => onReply(comment)}
          >
            Trả lời
          </button>
          <span className="text-[10px] text-outline">{timeAgo(comment.createdAt)}</span>
          {repliesCount > 0 && (
            <button
              className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
              onClick={handleLoadReplies}
            >
              {loadingReplies ? (
                <Loader className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <CornerDownRight className="w-3 h-3" />
                  {showReplies ? 'Ẩn' : `Xem ${repliesCount} trả lời`}
                </>
              )}
            </button>
          )}
        </div>

        {/* Replies indented */}
        {showReplies && replies.length > 0 && (
          <div className="mt-3 ml-4 space-y-3 border-l-2 border-surface-container pl-3">
            {replies.map(reply => {
              const replyAuthor = reply.user?.fullName || reply.user?.username || 'Someone';
              const replyAvatar = reply.user?.avatarUrl || `https://picsum.photos/seed/${reply.user?.id}/50/50`;
              
              const handleReplyUserClick = () => {
                if (reply.user && onUserClick) {
                  onUserClick(summaryToProfile(reply.user));
                }
              };

              return (
                <div key={String(reply.id)} className="flex gap-2">
                  <img 
                    src={replyAvatar} 
                    alt={replyAuthor} 
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
                    referrerPolicy="no-referrer" 
                    onClick={handleReplyUserClick}
                  />
                  <div className="flex-1">
                    <div className="bg-surface-container-low rounded-2xl p-2.5">
                      <h5 className="text-[11px] font-bold text-on-surface mb-0.5 cursor-pointer hover:text-primary transition-colors" onClick={handleReplyUserClick}>
                        {replyAuthor}
                      </h5>
                      <p className="text-xs text-on-surface-variant leading-snug">{reply.content}</p>
                    </div>
                    <span className="text-[10px] text-outline ml-2">{timeAgo(reply.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

interface CommentSidebarProps {
  post: PostDto;
  onClose: () => void;
  /** Gọi khi thêm comment/reply mới để cập nhật commentsCount ở feed */
  onCommentAdded?: () => void;
  onUserClick?: (user: UserProfile) => void;
}

const CommentSidebar = ({ post, onClose, onCommentAdded, onUserClick }: CommentSidebarProps) => {
  const api = getSocialNetworkApiV1();
  const { user: currentUser } = useAuthStore();

  const [comments, setComments] = useState<CommentDto[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply target — khi user click "Trả lời" trên một comment
  const [replyTarget, setReplyTarget] = useState<CommentDto | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const postId   = Number(post.id);

  // Load comments khi sidebar mở hoặc post thay đổi
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setComments([]);

    const load = async () => {
      try {
        const res = await api.getApiCommentsPostPostId(postId, { page: 1, pageSize: 20 });
        if (cancelled) return;
        if (!res.success || !res.data) throw new Error(res.message ?? 'Lỗi tải bình luận');
        setComments(res.data.items as CommentDto[] ?? []);
      } catch (e: unknown) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    return () => { cancelled = true; };
  }, [postId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    const content = newComment.trim();
    if (!content || submitting) return;

    setSubmitting(true);
    try {
      const res = await api.postApiComments({
        postId,
        content,
        parentId: replyTarget ? Number(replyTarget.id) : undefined,
      });
      if (!res.success || !res.data) throw new Error(res.message ?? 'Gửi thất bại');
      if (replyTarget) {
        // Tăng repliesCount trên comment cha (optimistic)
        setComments(prev => prev.map(c =>
          Number(c.id) === Number(replyTarget.id)
            ? { ...c, repliesCount: (Number(c.repliesCount ?? 0) + 1) }
            : c
        ));
        setReplyTarget(null);
      } else {
        // Prepend comment mới vào đầu danh sách
        setComments(prev => [res.data!, ...prev]);
      }
      setNewComment('');
      onCommentAdded?.();
      inputRef.current?.focus();
    } catch (e: unknown) {
      toast.error('Gửi bình luận thất bại, vui lòng thử lại.');
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (comment: CommentDto) => {
    setReplyTarget(comment);
    setNewComment('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleAuthorClick = () => {
    if (post.user && onUserClick) {
      onUserClick(userDtoToProfile(post.user));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const authorAvatar = post.user?.avatarUrl || `https://picsum.photos/seed/${post.user?.id}/50/50`;
  const authorName   = post.user?.fullName || post.user?.username || '';
  const currentAvatar = currentUser?.avatarUrl || `https://picsum.photos/seed/${currentUser?.username}/50/50`;

  return (
    <aside className="hidden lg:flex flex-col gap-4 sticky top-24 h-[calc(100vh-120px)] overflow-hidden bg-surface-container-lowest rounded-xl surface-elevation-tonal border border-outline-variant/10">
      {/* Header */}
      <div className="p-6 border-b border-surface-container flex items-center justify-between">
        <h3 className="font-headline font-bold text-on-surface">Bình luận</h3>
        <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
          <X className="w-5 h-5 text-outline" />
        </button>
      </div>

      {/* Post snippet */}
      <div className="px-6 pb-2 border-b border-surface-container">
        <div className="flex items-center gap-3 mb-2">
          <img 
            alt={authorName} 
            src={authorAvatar} 
            className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80 transition-opacity" 
            referrerPolicy="no-referrer" 
            onClick={handleAuthorClick}
          />
          <p className="text-xs font-bold text-on-surface cursor-pointer hover:text-primary transition-colors" onClick={handleAuthorClick}>
            {authorName}
          </p>
        </div>
        <p className="text-sm text-on-surface-variant line-clamp-2">{post.content}</p>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-error text-xs p-3 rounded-lg bg-error/10">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && comments.length === 0 && (
          <p className="text-center text-sm text-outline py-8">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        )}

        {comments.map((comment: CommentDto) => (
          <React.Fragment key={String(comment.id)}>
            <CommentItem comment={comment} onReply={handleReply} onUserClick={onUserClick} />
          </React.Fragment>
        ))}
      </div>

      {/* Input area */}
      <div className="p-6 bg-surface-container-low/50 backdrop-blur-md border-t border-surface-container">
        {replyTarget && (
          <div className="flex items-center gap-2 mb-2 text-xs text-primary bg-primary/5 rounded-lg px-3 py-1.5">
            <CornerDownRight className="w-3 h-3 shrink-0" />
            <span>Đang trả lời <strong>{replyTarget.user?.fullName || replyTarget.user?.username}</strong></span>
            <button onClick={() => setReplyTarget(null)} className="ml-auto text-outline hover:text-on-surface">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="bg-surface-container-low rounded-xl p-2 flex items-center gap-2">
          <img
            alt="You"
            src={currentAvatar}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            referrerPolicy="no-referrer"
          />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2 text-on-surface placeholder:text-outline"
            placeholder={replyTarget ? `Trả lời ${replyTarget.user?.username ?? ''}...` : 'Viết bình luận...'}
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={submitting}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
            className="p-2 text-primary hover:scale-110 transition-transform disabled:opacity-40 disabled:hover:scale-100"
          >
            {submitting ? <Loader className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default CommentSidebar;
