import { useState, useRef } from 'react';
import { X, Globe, Plus, Camera, UserPlus, Smile, MapPin, MoreHorizontal, Loader, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSocialNetworkApiV1, type PostDto } from '../../api/api-generated';
import useAuthStore from '../../store/authStore';
import ImageUpload from '../ui/ImageUpload';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Callback nhận bài vừa tạo để prepend vào feed mà không cần refresh */
  onPostCreated?: (post: PostDto) => void;
}

const CreatePostModal = ({ isOpen, onClose, onPostCreated }: CreatePostModalProps) => {
  const api = getSocialNetworkApiV1();
  const { user } = useAuthStore();

  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [showImageInput, setShowImageInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleClose = () => {
    setContent('');
    setImageUrl(undefined);
    setShowImageInput(false);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.postApiPosts({
        content: content.trim(),
        imageUrl: imageUrl?.trim() || undefined,
      });
      if (!res.success || !res.data) throw new Error(res.message ?? 'Không tạo được bài viết.');

      onPostCreated?.(res.data);
      handleClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        ?? (err as Error).message
        ?? 'Có lỗi xảy ra.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const avatarUrl   = user?.avatarUrl || `https://picsum.photos/seed/${user?.username}/100/100`;
  const displayName = user?.fullName || user?.username || 'Bạn';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-surface-container-lowest w-full max-w-xl rounded-xl surface-elevation-tonal overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-surface-container-low">
              <h2 className="text-xl font-bold tracking-tight text-on-surface font-headline">Tạo bài viết</h2>
              <button onClick={handleClose} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
                <X className="w-5 h-5 text-outline" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Author info */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-full overflow-hidden border border-primary/10">
                  <img alt="User" src={avatarUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="font-bold text-on-surface text-sm">{displayName}</span>
                  <button className="flex items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded-lg text-[11px] font-semibold text-secondary hover:bg-surface-container-high transition-colors">
                    <Globe className="w-3 h-3" />
                    Công khai
                    <Plus className="w-3 h-3 rotate-45" />
                  </button>
                </div>
              </div>

              {/* Content textarea */}
              <textarea
                ref={textareaRef}
                className="w-full border-none focus:ring-0 text-lg md:text-xl text-on-surface placeholder:text-outline/50 resize-none min-h-[140px] leading-relaxed p-0 bg-transparent"
                placeholder="Bạn đang nghĩ gì?"
                value={content}
                onChange={e => setContent(e.target.value)}
                autoFocus
              />

              {/* Image upload */}
              {showImageInput && (
                <div className="mt-3 mb-2">
                  <ImageUpload
                    value={imageUrl}
                    onChange={setImageUrl}
                    placeholder="Nhấn hoặc kéo thả ảnh vào đây..."
                    variant="banner"
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 mt-3 text-error text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Add to post bar */}
              <div className="rounded-xl border border-outline-variant/30 p-4 mt-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-secondary px-1">Thêm vào bài viết</span>
                  <div className="flex items-center gap-1">
                    <button
                      className={`p-2.5 hover:bg-surface-container-low rounded-full transition-colors ${showImageInput ? 'text-primary' : 'text-primary/60'}`}
                      onClick={() => setShowImageInput(!showImageInput)}
                      title="URL ảnh"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 hover:bg-surface-container-low rounded-full transition-colors text-tertiary"><UserPlus className="w-5 h-5" /></button>
                    <button className="p-2.5 hover:bg-surface-container-low rounded-full transition-colors text-orange-500"><Smile className="w-5 h-5" /></button>
                    <button className="p-2.5 hover:bg-surface-container-low rounded-full transition-colors text-red-500"><MapPin className="w-5 h-5" /></button>
                    <button className="p-2.5 hover:bg-surface-container-low rounded-full transition-colors text-outline"><MoreHorizontal className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
                disabled={!content.trim() || loading}
                onClick={handleSubmit}
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Đang đăng...' : 'Đăng'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
