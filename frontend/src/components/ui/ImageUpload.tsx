import React, { useRef, useState } from 'react';
import { Camera, X, Loader, AlertCircle } from 'lucide-react';
import { uploadImage } from '../../api/axios';

interface ImageUploadProps {
  /** URL hiện tại (nếu có) */
  value?: string;
  onChange: (url: string | undefined) => void;
  /** Placeholder text hiện trong vùng drop */
  placeholder?: string;
  /** Kích thước khung preview — 'avatar' (tròn) hoặc 'banner' (chữ nhật) */
  variant?: 'avatar' | 'banner';
  className?: string;
}

const ImageUpload = ({ value, onChange, placeholder = 'Chọn ảnh', variant = 'banner', className = '' }: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const res = await uploadImage(file);
      if (res.success && res.data?.url) {
        onChange(res.data.url);
      } else {
        setError(res.message ?? 'Upload thất bại.');
      }
    } catch {
      setError('Không thể upload ảnh. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const isAvatar  = variant === 'avatar';
  const wrapClass = isAvatar
    ? `relative w-24 h-24 rounded-full overflow-hidden ${className}`
    : `relative w-full rounded-xl overflow-hidden ${className}`;
  const previewClass = isAvatar
    ? 'w-full h-full object-cover'
    : 'w-full max-h-[500px] object-contain bg-surface-container-low/30';
  const emptyClass = isAvatar
    ? 'flex items-center justify-center w-full h-full bg-surface-container'
    : 'flex flex-col items-center justify-center gap-2 w-full h-48 bg-surface-container-low border-2 border-dashed border-outline-variant hover:border-primary/50 transition-colors';

  return (
    <div className={wrapClass}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleInput}
      />

      <div
        className={emptyClass + ' cursor-pointer'}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        {value && !uploading ? (
          <img alt="preview" src={value} className={previewClass} referrerPolicy="no-referrer" />
        ) : uploading ? (
          <Loader className="w-6 h-6 animate-spin text-primary" />
        ) : (
          <>
            <Camera className={`text-outline ${isAvatar ? 'w-6 h-6' : 'w-8 h-8'}`} />
            {!isAvatar && <p className="text-sm text-outline">{placeholder}</p>}
          </>
        )}
      </div>

      {/* Nút xóa ảnh */}
      {value && !uploading && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onChange(undefined); }}
          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-error/90 text-white text-[10px] px-2 py-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
