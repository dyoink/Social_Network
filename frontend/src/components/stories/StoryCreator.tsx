import { useState, useRef } from 'react';
import { X, Image, Film, Loader, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { createStory, uploadVideo } from '../../api/storyApi';
import { uploadImage } from '../../api/axios';
import toast from 'react-hot-toast';

interface StoryCreatorProps {
  onClose: () => void;
  onCreated: () => void;
}

const StoryCreator = ({ onClose, onCreated }: StoryCreatorProps) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'Image' | 'Video'>('Image');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      toast.error('Chỉ chấp nhận ảnh hoặc video.');
      return;
    }

    if (isImage && file.size > 10 * 1024 * 1024) {
      toast.error('Ảnh tối đa 10 MB.');
      return;
    }

    if (isVideo && file.size > 50 * 1024 * 1024) {
      toast.error('Video tối đa 50 MB.');
      return;
    }

    setUploading(true);
    try {
      if (isVideo) {
        const res = await uploadVideo(file);
        setMediaUrl(res.data?.url || null);
        setMediaType('Video');
      } else {
        const res = await uploadImage(file);
        setMediaUrl(res.data?.url || null);
        setMediaType('Image');
      }
    } catch {
      toast.error('Upload thất bại.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!mediaUrl) return;
    setSubmitting(true);
    try {
      await createStory({ mediaUrl, mediaType, caption: caption.trim() || undefined });
      toast.success('Đã đăng story!');
      onCreated();
    } catch {
      toast.error('Không thể tạo story.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface-container-lowest w-full max-w-md rounded-xl surface-elevation-tonal overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-surface-container-low">
          <h2 className="text-lg font-bold text-on-surface font-headline">Tạo Story</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
            <X className="w-5 h-5 text-outline" />
          </button>
        </div>

        <div className="p-5">
          {/* Media picker / preview */}
          {!mediaUrl ? (
            <div className="space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/mp4,video/webm"
                onChange={handleFileChange}
                className="hidden"
              />
              {uploading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-outline">Đang upload...</p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => { fileRef.current?.setAttribute('accept', 'image/*'); fileRef.current?.click(); }}
                    className="flex-1 flex flex-col items-center gap-2 p-8 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all"
                  >
                    <Image className="w-10 h-10 text-primary" />
                    <span className="text-sm font-semibold text-primary">Chọn ảnh</span>
                  </button>
                  <button
                    onClick={() => { fileRef.current?.setAttribute('accept', 'video/mp4,video/webm'); fileRef.current?.click(); }}
                    className="flex-1 flex flex-col items-center gap-2 p-8 rounded-xl border-2 border-dashed border-tertiary/30 hover:border-tertiary/60 hover:bg-tertiary/5 transition-all"
                  >
                    <Film className="w-10 h-10 text-tertiary" />
                    <span className="text-sm font-semibold text-tertiary">Chọn video</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[400px] mx-auto">
                {mediaType === 'Video' ? (
                  <video src={mediaUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                ) : (
                  <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => setMediaUrl(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Caption */}
              <input
                className="w-full px-4 py-3 border border-outline-variant/20 rounded-xl text-sm bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary/50"
                placeholder="Thêm caption (tuỳ chọn)..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
                maxLength={200}
              />

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Đang đăng...' : 'Đăng Story'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StoryCreator;
