import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocialNetworkApiV1, type PostDto } from '../api/api-generated';

const PAGE_SIZE = 10;

interface FeedState {
  posts: PostDto[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Hook quản lý feed (bài viết của following + bản thân).
 * Hỗ trợ load thêm (pagination) và refresh sau khi tạo bài mới.
 */
export function useFeed() {
  const api = getSocialNetworkApiV1();

  const [state, setState] = useState<FeedState>({
    posts: [],
    page: 0,
    hasMore: true,
    loading: false,
    error: null,
  });

  // Dùng ref để tránh duplicate fetch khi component re-render trong StrictMode
  const fetchingRef = useRef(false);

  const loadPage = useCallback(async (pageNum: number, replace = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await api.getApiPostsFeed({ page: pageNum, pageSize: PAGE_SIZE });
      if (!res.success || !res.data) throw new Error(res.message ?? 'Không tải được feed.');

      const { items = [], hasNextPage = false } = res.data;
      setState(prev => ({
        posts: replace ? items : [...prev.posts, ...items],
        page: pageNum,
        hasMore: hasNextPage,
        loading: false,
        error: null,
      }));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        .response?.data?.message ?? (err as Error).message ?? 'Lỗi không xác định';
      setState(prev => ({ ...prev, loading: false, error: msg }));
    } finally {
      fetchingRef.current = false;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load trang đầu khi mount
  useEffect(() => {
    loadPage(1, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Load thêm trang tiếp theo. */
  const loadMore = useCallback(() => {
    if (!state.loading && state.hasMore) {
      loadPage(state.page + 1);
    }
  }, [state.loading, state.hasMore, state.page, loadPage]);

  /** Refresh từ đầu (sau khi tạo/xóa bài). */
  const refresh = useCallback(() => loadPage(1, true), [loadPage]);

  /**
   * Cập nhật optimistic state khi toggle like — không cần fetch lại.
   */
  const updatePostLike = useCallback((postId: number | string, isLiked: boolean, likesCount: number) => {
    setState(prev => ({
      ...prev,
      posts: prev.posts.map(p =>
        Number(p.id) === Number(postId) ? { ...p, isLiked, likesCount } : p
      ),
    }));
  }, []);

  /**
   * Thêm bài mới lên đầu feed (sau CreatePost thành công).
   */
  const prependPost = useCallback((post: PostDto) => {
    setState(prev => ({ ...prev, posts: [post, ...prev.posts] }));
  }, []);

  /** Xóa bài khỏi feed khi owner xóa. */
  const removePost = useCallback((postId: number | string) => {
    setState(prev => ({
      ...prev,
      posts: prev.posts.filter(p => Number(p.id) !== Number(postId)),
    }));
  }, []);

  /** Cập nhật nội dung bài sau khi owner chỉnh sửa. */
  const updatePost = useCallback((postId: number | string, updates: Partial<PostDto>) => {
    setState(prev => ({
      ...prev,
      posts: prev.posts.map(p =>
        Number(p.id) === Number(postId) ? { ...p, ...updates } : p
      ),
    }));
  }, []);

  return { ...state, loadMore, refresh, updatePostLike, prependPost, removePost, updatePost };
}
