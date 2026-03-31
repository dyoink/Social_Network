import { useEffect, useRef } from 'react';
import { Camera, Smile, MapPin, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { type PostDto } from '../../api/api-generated';
import useAuthStore from '../../store/authStore';
import { useFeed } from '../../hooks/useFeed';
import PostCard from '../feed/PostCard';
import PostCardSkeleton from '../ui/PostCardSkeleton';
import StoriesRow from '../stories/StoriesRow';

interface NewsfeedViewProps {
  onOpenCreate: () => void;
  onCommentClick?: (post: PostDto) => void;
  refreshKey?: number;
  onHashtagClick?: (tag: string) => void;
}

const NewsfeedView = ({ onOpenCreate, onCommentClick, refreshKey, onHashtagClick }: NewsfeedViewProps) => {
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
        onClick={onOpenCreate}
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
            <span className="flex items-center gap-2 text-outline text-sm font-medium">
              <Camera className="w-4 h-4 text-primary" /> Ảnh
            </span>
            <span className="flex items-center gap-2 text-outline text-sm font-medium">
              <Smile className="w-4 h-4 text-orange-400" /> Cảm xúc
            </span>
            <span className="flex items-center gap-2 text-outline text-sm font-medium">
              <MapPin className="w-4 h-4 text-emerald-500" /> Vị trí
            </span>
          </div>
          <button
            className="bg-primary/10 text-primary px-6 py-2 rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-all"
            onClick={(e) => { e.stopPropagation(); onOpenCreate(); }}
          >
            Đăng
          </button>
        </div>
      </div>

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
              onLikeToggle={(id, liked, count) => updatePostLike(id, liked, count)}
              onPostDeleted={(id) => { removePost(id); toast.success('Đã xóa bài viết.'); }}
              onPostUpdated={(id, updates) => updatePost(id, updates)}
              onHashtagClick={onHashtagClick}
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
