import { useEffect, useRef } from 'react';
import { Camera, Smile, MapPin, AlertCircle, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { type PostDto } from '../../api/api-generated';
import useAuthStore from '../../store/authStore';
import { useFeed } from '../../hooks/useFeed';
import PostCard from '../feed/PostCard';
import PostCardSkeleton from '../ui/PostCardSkeleton';
import StoriesRow from '../stories/StoriesRow';
import SuggestionsRow from '../feed/SuggestionsRow';
import { UserProfile } from '../../types';

interface NewsfeedViewProps {
  onOpenCreate: (action?: 'image' | 'video' | 'location' | 'emoji') => void;
  onCommentClick?: (post: PostDto) => void;
  onImageClick?: (post: PostDto) => void;
  refreshKey?: number;
  onHashtagClick?: (tag: string) => void;
  onUserClick?: (user: UserProfile) => void;
}

const NewsfeedView = ({ onOpenCreate, onCommentClick, onImageClick, refreshKey, onHashtagClick, onUserClick }: NewsfeedViewProps) => {
  const { user } = useAuthStore();
  const { posts, loading, error, hasMore, loadMore, updatePostLike, refresh, removePost, updatePost } = useFeed();

  // Khi App.tsx tăng refreshKey (sau khi đăng bài mới) → reload feed
  useEffect(() => {
    if (refreshKey && refreshKey > 0) refresh();
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // IntersectionObserver — trigger loadMore khi scroll đến sentinel element
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const avatarUrl = user?.avatarUrl || `https://picsum.photos/seed/${user?.username}/100/100`;
  const displayName = user?.fullName || user?.username || 'Bạn';

  return (
    <div className="flex flex-col gap-10">
      {/* Stories row (Instagram-style) */}
      <StoriesRow refreshKey={refreshKey} />

      {/* Create post prompt */}
      <div
        className="bg-surface-container-lowest p-6 rounded-xl surface-elevation-tonal transition-all hover:bg-surface-bright group cursor-pointer"
        onClick={() => onOpenCreate()}
      >
        <div className="flex gap-4 mb-6">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/5">
            <img alt="User" src={avatarUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 bg-surface-container-low rounded-xl px-5 py-3 border border-transparent group-hover:border-primary/20 transition-all">
            <p className="text-outline font-headline">Bạn đang nghĩ gì, {displayName}?</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-surface-container-low">
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); onOpenCreate('image'); }}
              className="flex items-center gap-2 text-outline text-sm font-medium hover:text-primary transition-colors"
            >
              <Camera className="w-4 h-4 text-primary" /> Ảnh
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenCreate('video'); }}
              className="flex items-center gap-2 text-outline text-sm font-medium hover:text-green-500 transition-colors"
            >
              <Video className="w-4 h-4 text-green-500" /> Video
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenCreate('emoji'); }}
              className="flex items-center gap-2 text-outline text-sm font-medium hover:text-orange-400 transition-colors"
            >
              <Smile className="w-4 h-4 text-orange-400" /> Cảm xúc
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenCreate('location'); }}
              className="flex items-center gap-2 text-outline text-sm font-medium hover:text-emerald-500 transition-colors"
            >
              <MapPin className="w-4 h-4 text-emerald-500" /> Vị trí
            </button>
          </div>
          <button
            className="bg-primary/10 text-primary px-6 py-2 rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-all"
            onClick={(e) => { e.stopPropagation(); onOpenCreate(); }}
          >
            Đăng
          </button>
        </div>
      </div>

      {/* Suggested for you (Horizontal row) */}
      <SuggestionsRow onUserClick={onUserClick!} />

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-error/10 text-error text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading skeleton (lần đầu) */}
      {loading && posts.length === 0 && (
        <div className="flex flex-col gap-12">
          {[1, 2, 3].map(i => <PostCardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-20 text-outline">
          <p className="text-lg font-headline mb-2">Feed đang trống</p>
          <p className="text-sm">Follow người khác để xem bài viết của họ!</p>
        </div>
      )}

      {/* Posts list */}
      {posts.length > 0 && (
        <div className="flex flex-col gap-12">
          {posts.map(post => (
            <PostCard
              key={Number(post.id)}
              post={post}
              onCommentClick={onCommentClick}
              onImageClick={onImageClick}
              onLikeToggle={(id, liked, count) => updatePostLike(id, liked, count)}
              onPostDeleted={(id) => { removePost(id); toast.success('Đã xóa bài viết.'); }}
              onPostUpdated={(id, updates) => updatePost(id, updates)}
              onHashtagClick={onHashtagClick}
              onUserClick={onUserClick}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel — IntersectionObserver sẽ trigger loadMore */}
      {hasMore && <div ref={sentinelRef} className="h-4" />}

      {/* Spinner khi load thêm */}
      {loading && posts.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default NewsfeedView;
