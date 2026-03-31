import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Trash2, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { markStoryViewed, deleteStory, getStoryViewers, type StoryGroupDto, type StoryViewerDto } from '../../api/storyApi';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

interface StoryViewerProps {
  groups: StoryGroupDto[];
  initialGroupIndex: number;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 giây mỗi story

const StoryViewer = ({ groups, initialGroupIndex, onClose }: StoryViewerProps) => {
  const { user } = useAuthStore();
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<StoryViewerDto[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  const currentGroup = groupIdx >= 0 && groupIdx < groups.length ? groups[groupIdx] : null;
  const currentStory = currentGroup && storyIdx >= 0 && storyIdx < currentGroup.stories.length ? currentGroup.stories[storyIdx] : null;
  const isOwner = Number(user?.id ?? 0) === (currentGroup?.userId ?? -1);

  // Đánh dấu đã xem
  useEffect(() => {
    if (currentStory && !currentStory.isViewed && !isOwner) {
      markStoryViewed(currentStory.id).catch(() => {});
    }
  }, [currentStory, isOwner]);

  // Auto-advance timer
  const advance = useCallback(() => {
    if (!currentGroup) { onClose(); return; }
    if (storyIdx < currentGroup.stories.length - 1) {
      setStoryIdx(i => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(i => i + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
    setProgress(0);
    setShowViewers(false);
  }, [storyIdx, groupIdx, currentGroup, groups.length, onClose]);

  useEffect(() => {
    if (paused) return;
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / STORY_DURATION, 1);
      setProgress(pct);
      if (pct >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        advance();
      }
    }, 50);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [groupIdx, storyIdx, paused, advance]);

  const goPrev = () => {
    if (storyIdx > 0) {
      setStoryIdx(i => i - 1);
    } else if (groupIdx > 0) {
      const prevGroup = groups[groupIdx - 1];
      setGroupIdx(i => i - 1);
      setStoryIdx(prevGroup ? prevGroup.stories.length - 1 : 0);
    }
    setProgress(0);
    setShowViewers(false);
  };

  const goNext = () => advance();

  const handleDelete = async () => {
    if (!currentStory) return;
    try {
      await deleteStory(currentStory.id);
      toast.success('Đã xóa story.');
      // Nếu hết story trong group thì chuyển group hoặc đóng
      const remaining = currentGroup?.stories.filter(s => s.id !== currentStory.id) ?? [];
      if (remaining.length === 0) {
        if (groupIdx < groups.length - 1) {
          setGroupIdx(i => i + 1);
          setStoryIdx(0);
        } else {
          onClose();
        }
      } else {
        setStoryIdx(Math.min(storyIdx, remaining.length - 1));
      }
    } catch {
      toast.error('Không thể xóa story.');
    }
  };

  const loadViewers = async () => {
    if (!currentStory || !isOwner) return;
    try {
      const data = await getStoryViewers(currentStory.id);
      setViewers(data);
      setShowViewers(true);
      setPaused(true);
    } catch {
      toast.error('Không lấy được danh sách viewers.');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [groupIdx, storyIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentStory) return null;

  const timeAgo = getTimeAgo(currentStory.createdAt);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md h-full max-h-[90vh] mx-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
            {currentGroup.stories.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{
                    width: i < storyIdx ? '100%' : i === storyIdx ? `${progress * 100}%` : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-white/30">
                <img
                  src={currentGroup.avatarUrl || `https://picsum.photos/seed/${currentGroup.username}/100/100`}
                  alt={currentGroup.username}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="text-white text-sm font-semibold">{currentGroup.fullName || currentGroup.username}</span>
                <span className="text-white/60 text-xs ml-2">{timeAgo}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPaused(!paused)} className="text-white/80 hover:text-white p-1">
                {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              {isOwner && (
                <button onClick={handleDelete} className="text-white/80 hover:text-red-400 p-1">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button onClick={onClose} className="text-white/80 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Media */}
          <div className="w-full h-full rounded-xl overflow-hidden">
            {currentStory.mediaType === 'Video' ? (
              <video
                key={currentStory.id}
                src={currentStory.mediaUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                loop
              />
            ) : (
              <img
                key={currentStory.id}
                src={currentStory.mediaUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Caption */}
          {currentStory.caption && (
            <div className="absolute bottom-16 left-0 right-0 z-20 px-4">
              <p className="text-white text-sm bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2">
                {currentStory.caption}
              </p>
            </div>
          )}

          {/* Bottom: View count (owner only) */}
          {isOwner && (
            <button
              onClick={loadViewers}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 text-white/80 text-sm bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-black/50 transition-colors"
            >
              <Eye className="w-4 h-4" />
              {currentStory.viewCount} lượt xem
            </button>
          )}

          {/* Nav buttons */}
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/20 rounded-full text-white/80 hover:text-white hover:bg-black/40 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/20 rounded-full text-white/80 hover:text-white hover:bg-black/40 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Viewers list overlay */}
          {showViewers && (
            <div className="absolute bottom-0 left-0 right-0 z-30 bg-surface-container-lowest rounded-t-2xl max-h-[50vh] overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-on-surface font-bold text-sm">Người đã xem ({viewers.length})</h3>
                <button onClick={() => { setShowViewers(false); setPaused(false); }} className="text-outline hover:text-on-surface">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {viewers.length === 0 ? (
                <p className="text-outline text-sm text-center py-4">Chưa có ai xem</p>
              ) : (
                <div className="space-y-2">
                  {viewers.map(v => (
                    <div key={v.userId} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden">
                        <img src={v.avatarUrl || `https://picsum.photos/seed/${v.username}/100/100`} alt={v.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{v.fullName || v.username}</p>
                        <p className="text-xs text-outline">@{v.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  return `${hours} giờ`;
}

export default StoryViewer;
