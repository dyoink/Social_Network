import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Loader, RefreshCw, Plus, Play, Pause, Send, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getReels, uploadVideo, type ReelPostDto } from '../../api/storyApi';
import { getSocialNetworkApiV1, type CommentDto } from '../../api/api-generated';
import toast from 'react-hot-toast';
import { timeAgo } from '../../utils/time';

const ReelView = () => {
  const api = getSocialNetworkApiV1();
  const [reels, setReels] = useState<ReelPostDto[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadContent, setUploadContent] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const loadReels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReels(10);
      setReels(data);
      setCurrentIdx(0);
    } catch {
      toast.error('Không tải được reels.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReels(); }, [loadReels]);

  // Load comments for current reel
  useEffect(() => {
    if (showComments && reels[currentIdx]) {
      const loadComments = async () => {
        setLoadingComments(true);
        try {
          const res = await api.getApiCommentsPostPostId(Number(reels[currentIdx].id), { page: 1, pageSize: 50 });
          if (res.success && res.data) setComments(res.data.items || []);
        } catch {
          toast.error('Không tải được bình luận.');
        } finally {
          setLoadingComments(false);
        }
      };
      loadComments();
    }
  }, [showComments, currentIdx, reels]);

  // Scroll/swipe handler
  useEffect(() => {
    const el = containerRef.current;
    if (!el || showComments) return;

    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = startY - e.changedTouches[0].clientY;
      if (diff > 50 && currentIdx < reels.length - 1) setCurrentIdx(i => i + 1);
      else if (diff < -50 && currentIdx > 0) setCurrentIdx(i => i - 1);
    };
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 30 && currentIdx < reels.length - 1) setCurrentIdx(i => i + 1);
      else if (e.deltaY < -30 && currentIdx > 0) setCurrentIdx(i => i - 1);
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('wheel', handleWheel);
    };
  }, [currentIdx, reels.length, showComments]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showComments) return;
      if (e.key === 'ArrowDown' && currentIdx < reels.length - 1) setCurrentIdx(i => i + 1);
      else if (e.key === 'ArrowUp' && currentIdx > 0) setCurrentIdx(i => i - 1);
      else if (e.key === 'm') setMuted(m => !m);
      else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIdx, reels.length, showComments]);

  // Play current video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [currentIdx]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      setShowPlayIcon(true);
      setTimeout(() => setShowPlayIcon(false), 500);
    }
  };

  const currentReel = reels[currentIdx];

  // Like handler cho reel
  const handleLikeReel = async () => {
    if (!currentReel) return;
    try {
      const res = await api.postApiPostsIdLike(currentReel.id, { reactionType: 'Like' });
      if (res.success && res.data) {
        setReels(prev => prev.map((r, i) => i === currentIdx
          ? { ...r, isLiked: res.data!.isLiked ?? !r.isLiked, likesCount: Number(res.data!.likesCount ?? r.likesCount) }
          : r
        ));
      }
    } catch {
      toast.error('Không thể thả tim.');
    }
  };

  // Comment submission handler
  const handleCommentSubmit = async () => {
    const content = newComment.trim();
    if (!content || submittingComment || !currentReel) return;
    setSubmittingComment(true);
    try {
      const res = await api.postApiComments({
        postId: Number(currentReel.id),
        content,
      });
      if (res.success && res.data) {
        setComments(prev => [res.data!, ...prev]);
        setNewComment('');
        setReels(prev => prev.map((r, i) => i === currentIdx ? { ...r, commentsCount: (r.commentsCount || 0) + 1 } : r));
        toast.success('Đã đăng bình luận!');
      }
    } catch {
      toast.error('Không thể gửi bình luận.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Share handler
  const handleShareReel = () => {
    if (!currentReel) return;
    const url = `${window.location.origin}/post/${currentReel.id}`;
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Đã sao chép liên kết!'))
      .catch(() => toast.error('Không thể sao chép.'));
  };

  // Upload reel handler
  const handleUploadReel = async (file: File) => {
    setUploading(true);
    try {
      const uploadRes = await uploadVideo(file);
      if (!uploadRes.success || !uploadRes.data?.url) {
        toast.error('Upload video thất bại.');
        return;
      }
      const postRes = await api.postApiPosts({
        content: uploadContent.trim() || '🎬',
        videoUrl: uploadRes.data.url,
        visibility: 'Public',
      });
      if (postRes.success) {
        toast.success('Đã đăng Reel!');
        setShowUpload(false);
        setUploadContent('');
        loadReels();
      }
    } catch {
      toast.error('Không thể đăng Reel.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-outline">
        <p className="text-lg font-headline">Chưa có Reels nào</p>
        <p className="text-sm">Hãy đăng bài có video để tạo Reel đầu tiên!</p>
        <button onClick={loadReels} className="flex items-center gap-2 text-primary text-sm font-semibold">
          <RefreshCw className="w-4 h-4" /> Thử lại
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md mx-auto"
      style={{ height: 'calc(100vh - 160px)' }}
    >
      <AnimatePresence mode="wait">
        {currentReel && (
          <motion.div
            key={currentReel.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 rounded-xl overflow-hidden bg-black"
          >
            {/* Video player */}
            <video
              ref={videoRef}
              src={currentReel.videoUrl}
              className="w-full h-full object-cover cursor-pointer"
              autoPlay
              loop
              playsInline
              muted={muted}
              onClick={togglePlay}
            />

            {/* Play/Pause Overlay Icon */}
            <AnimatePresence>
              {showPlayIcon && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                >
                  <div className="p-5 rounded-full bg-black/40 backdrop-blur-sm">
                    {isPlaying ? <Play className="w-12 h-12 text-white fill-current" /> : <Pause className="w-12 h-12 text-white fill-current" />}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Actions sidebar */}
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-10">
              <button onClick={handleLikeReel} className="flex flex-col items-center gap-1">
                <div className={`p-2.5 rounded-full ${currentReel.isLiked ? 'bg-red-500/20' : 'bg-black/30'} backdrop-blur-sm`}>
                  <Heart className={`w-6 h-6 ${currentReel.isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                </div>
                <span className="text-white text-xs font-semibold">{currentReel.likesCount}</span>
              </button>
              <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
                <div className="p-2.5 rounded-full bg-black/30 backdrop-blur-sm">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">{currentReel.commentsCount}</span>
              </button>
              <button onClick={handleShareReel} className="flex flex-col items-center gap-1">
                <div className="p-2.5 rounded-full bg-black/30 backdrop-blur-sm">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
              </button>
              <button
                onClick={() => setMuted(!muted)}
                className="p-2.5 rounded-full bg-black/30 backdrop-blur-sm"
              >
                {muted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </button>
            </div>

            {/* Author info + caption */}
            <div className="absolute bottom-4 left-4 right-16 z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-white/30">
                  <img
                    src={currentReel.user.avatarUrl || `https://picsum.photos/seed/${currentReel.user.username}/100/100`}
                    alt={currentReel.user.username}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-white font-bold text-sm">{currentReel.user.fullName || currentReel.user.username}</span>
              </div>
              {currentReel.content && (
                <p className="text-white/90 text-sm line-clamp-3">{currentReel.content}</p>
              )}
            </div>

            {/* Reel counter */}
            <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 z-10">
              <span className="text-white/80 text-xs font-semibold">{currentIdx + 1}/{reels.length}</span>
            </div>

            {/* Comments Drawer Overlay */}
            <AnimatePresence>
              {showComments && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowComments(false)}
                    className="absolute inset-0 bg-black/40 z-[30]"
                  />
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest rounded-t-2xl z-[40] flex flex-col max-h-[70%]"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-outline-variant/10">
                      <span className="font-bold text-on-surface">{currentReel.commentsCount} bình luận</span>
                      <button onClick={() => setShowComments(false)} className="p-1 hover:bg-surface-container rounded-full transition-colors">
                        <ChevronDown className="w-6 h-6 text-outline" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-[200px]">
                      {loadingComments ? (
                        <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-primary" /></div>
                      ) : comments.length === 0 ? (
                        <p className="text-center text-outline text-sm py-12 italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                      ) : (
                        comments.map(comment => (
                          <div key={comment.id} className="flex gap-3">
                            <img 
                              src={comment.user?.avatarUrl || `https://picsum.photos/seed/${comment.user?.id}/50/50`} 
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1">
                              <div className="bg-surface-container-low rounded-2xl p-3">
                                <h5 className="text-xs font-bold text-on-surface mb-0.5">{comment.user?.fullName || comment.user?.username}</h5>
                                <p className="text-sm text-on-surface-variant leading-snug">{comment.content}</p>
                              </div>
                              <span className="text-[10px] text-outline ml-2">{timeAgo(comment.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-4 bg-surface-container-low/30 border-t border-outline-variant/10 shrink-0">
                      <div className="bg-surface-container-low rounded-2xl p-2 flex items-center gap-2">
                        <input 
                          className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 text-on-surface placeholder:text-outline"
                          placeholder="Thêm bình luận..."
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleCommentSubmit(); }}
                        />
                        <button 
                          onClick={handleCommentSubmit} 
                          disabled={submittingComment || !newComment.trim()} 
                          className="p-2 text-primary disabled:opacity-50"
                        >
                          {submittingComment ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Load more button */}
      {currentIdx === reels.length - 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={loadReels}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
          >
            <RefreshCw className="w-4 h-4" /> Tải thêm
          </button>
        </div>
      )}

      {/* Upload Reel button (FAB) */}
      <button
        onClick={() => setShowUpload(true)}
        className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg hover:brightness-110 transition-all"
      >
        <Plus className="w-4 h-4" /> Đăng Reel
      </button>

      {/* Upload Reel Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-on-surface mb-4">Đăng Reel mới</h2>
            <textarea
              className="w-full bg-surface-container-low border border-outline-variant/30 focus:ring-2 focus:ring-primary/30 rounded-xl py-3 px-4 text-sm text-on-surface placeholder:text-outline resize-none min-h-[80px] mb-3"
              placeholder="Viết mô tả cho Reel..."
              value={uploadContent}
              onChange={e => setUploadContent(e.target.value)}
            />
            <input
              ref={uploadInputRef}
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleUploadReel(file);
                e.target.value = '';
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => uploadInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {uploading ? 'Đang tải lên...' : 'Chọn video'}
              </button>
              <button
                onClick={() => { setShowUpload(false); setUploadContent(''); }}
                disabled={uploading}
                className="px-4 py-3 rounded-xl text-sm text-outline hover:bg-surface-container transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReelView;
