import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Loader, RefreshCw, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getReels, uploadVideo, type ReelPostDto } from '../../api/storyApi';
import { getSocialNetworkApiV1 } from '../../api/api-generated';
import toast from 'react-hot-toast';

const ReelView = () => {
  const api = getSocialNetworkApiV1();
  const [reels, setReels] = useState<ReelPostDto[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
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

  // Scroll/swipe handler
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

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
  }, [currentIdx, reels.length]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && currentIdx < reels.length - 1) setCurrentIdx(i => i + 1);
      else if (e.key === 'ArrowUp' && currentIdx > 0) setCurrentIdx(i => i - 1);
      else if (e.key === 'm') setMuted(m => !m);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIdx, reels.length]);

  // Play current video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentIdx]);

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
              className="w-full h-full object-cover"
              autoPlay
              loop
              playsInline
              muted={muted}
              onClick={() => setMuted(!muted)}
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Actions sidebar */}
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
              <button onClick={handleLikeReel} className="flex flex-col items-center gap-1">
                <div className={`p-2.5 rounded-full ${currentReel.isLiked ? 'bg-red-500/20' : 'bg-black/30'} backdrop-blur-sm`}>
                  <Heart className={`w-6 h-6 ${currentReel.isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                </div>
                <span className="text-white text-xs font-semibold">{currentReel.likesCount}</span>
              </button>
              <button onClick={() => toast('Bình luận sẽ hiện trong bài viết chi tiết.', { icon: '💬' })} className="flex flex-col items-center gap-1">
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
            <div className="absolute bottom-4 left-4 right-16">
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
            <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="text-white/80 text-xs font-semibold">{currentIdx + 1}/{reels.length}</span>
            </div>
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
