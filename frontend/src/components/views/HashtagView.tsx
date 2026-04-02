import { useState, useEffect, useRef, useCallback } from 'react';
import { Hash, ArrowLeft, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSocialNetworkApiV1, type PostDto } from '../../api/api-generated';
import PostCard from '../feed/PostCard';
import PostCardSkeleton from '../ui/PostCardSkeleton';
import { UserProfile } from '../../types';

interface HashtagViewProps {
  tag: string;
  onBack: () => void;
  onCommentClick: (post: PostDto) => void;
  onImageClick?: (post: PostDto) => void;
  onHashtagClick?: (tag: string) => void;
  onUserClick?: (user: UserProfile) => void;
}

const HashtagView = ({ tag, onBack, onCommentClick, onImageClick, onHashtagClick, onUserClick }: HashtagViewProps) => {
  const api = getSocialNetworkApiV1();
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [trending, setTrending] = useState<TrendingHashtagDto[]>([]);

  const fetchPosts = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.getApiPostsHashtagTag(tag, { page: p, pageSize: 10 });
      if (res.success && res.data) {
        const items = res.data.items ?? [];
        if (p === 1) {
          setPosts(items);
        } else {
          setPosts(prev => [...prev, ...items]);
        }
        setHasMore(res.data.hasNextPage ?? false);
        setPage(p);
      }
    } catch {
      toast.error('Không thể tải bài viết.');
    } finally {
      setLoading(false);
    }
  }, [tag]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load trending hashtags
  useEffect(() => {
    api.getApiPostsTrendingHashtags({ limit: 10 }).then(res => {
      if (res.success && res.data) setTrending(res.data);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload khi tag thay đổi
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(1);
  }, [tag, fetchPosts]);

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) fetchPosts(page + 1);
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchPosts]);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-xl surface-elevation-tonal p-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-surface-container transition-colors text-outline hover:text-on-surface"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Hash className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-headline font-bold text-xl text-on-surface">#{tag}</h1>
            <p className="text-sm text-outline">
              {!loading && posts.length > 0
                ? `${posts.length}${hasMore ? '+' : ''} bài viết`
                : loading ? 'Đang tải...' : 'Không có bài viết'}
            </p>
          </div>
        </div>

        {/* Trending hashtags */}
        {trending.length > 0 && (
          <div className="mt-4 pt-4 border-t border-outline-variant/20">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-headline font-bold text-on-surface">Trending</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trending.map(h => (
                <button
                  key={h.tag}
                  onClick={() => onHashtagClick(h.tag!)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    h.tag === tag
                      ? 'bg-primary text-white'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  #{h.tag} <span className="text-xs opacity-70">({h.postCount})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && posts.length === 0 && (
        <div className="flex flex-col gap-6">
          {[1, 2, 3].map(i => <PostCardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-20 text-outline">
          <Hash className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-headline mb-2">Không tìm thấy bài viết</p>
          <p className="text-sm">Chưa có bài viết nào với hashtag #{tag}</p>
        </div>
      )}

      {/* Posts */}
      {posts.length > 0 && (
        <div className="flex flex-col gap-8">
          {posts.map(post => (
            <PostCard
              key={Number(post.id)}
              post={post}
              onCommentClick={onCommentClick}
              onImageClick={onImageClick}
              onHashtagClick={onHashtagClick}
              onUserClick={onUserClick}
              onPostDeleted={(id) => setPosts(prev => prev.filter(p => Number(p.id) !== id))}
              onPostUpdated={(id, updates) => setPosts(prev => prev.map(p => Number(p.id) === id ? { ...p, ...updates } : p))}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && <div ref={sentinelRef} className="h-4" />}

      {/* Loading more */}
      {loading && posts.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default HashtagView;
