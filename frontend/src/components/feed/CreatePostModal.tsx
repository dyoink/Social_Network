import { useState, useRef, useEffect } from 'react';
import { X, Globe, Plus, Camera, Video, UserPlus, Smile, MapPin, MoreHorizontal, Loader, AlertCircle, Search, Users, Lock, Sparkles, Settings, RotateCcw, Check } from 'lucide-react';
import { generatePostContent, getGeminiApiKey, getGeminiModel, setGeminiModel, GEMINI_MODELS, type GeminiModelId } from '../../api/gemini';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { getSocialNetworkApiV1, type PostDto } from '../../api/api-generated';
import useAuthStore from '../../store/authStore';
import ImageUpload from '../ui/ImageUpload';
import { uploadVideo } from '../../api/storyApi';

const EMOJI_LIST = [
  '😀','😂','😍','🥰','😎','🤩','😢','😡','🥺','😲','🤔','😴',
  '👍','👎','❤️','🔥','💯','🎉','🙏','💪','👏','🤝','✨','⭐',
  '🌟','💖','💔','🎵','🎶','📸','🏠','🌍','🍕','☕','🎮','⚽',
];

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Callback nhận bài vừa tạo để prepend vào feed mà không cần refresh */
  onPostCreated?: (post: PostDto) => void;
  /** Điều hướng sang trang Cài đặt (để nhập API Key) */
  onNavigateSettings?: () => void;
}

const CreatePostModal = ({ isOpen, onClose, onPostCreated, onNavigateSettings }: CreatePostModalProps) => {
  const api = getSocialNetworkApiV1();
  const { user } = useAuthStore();

  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [showImageInput, setShowImageInput] = useState(false);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [showTagPeople, setShowTagPeople] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const [tagResults, setTagResults] = useState<{ id: number; username: string; fullName?: string | null }[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<{ id: number; username: string }[]>([]);
  const [visibility, setVisibility] = useState<'Public' | 'FollowersOnly' | 'Private'>('Public');
  const [showVisibility, setShowVisibility] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiMood, setAiMood] = useState('');
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModel, setAiModel] = useState<GeminiModelId>(getGeminiModel());
  const [aiTemperature, setAiTemperature] = useState(0.9);
  const [aiMaxTokens, setAiMaxTokens] = useState(500);
  const [aiShowAdvanced, setAiShowAdvanced] = useState(false);
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleClose = () => {
    setContent('');
    setImageUrl(undefined);
    setVideoUrl(undefined);
    setShowImageInput(false);
    setShowVideoInput(false);
    setShowEmoji(false);
    setShowLocation(false);
    setLocationText('');
    setShowTagPeople(false);
    setTaggedUsers([]);
    setVisibility('Public');
    setShowVisibility(false);
    setShowAi(false);
    setAiTopic('');
    setAiMood('');
    setAiKeywords('');
    setAiPreview(null);
    setAiShowAdvanced(false);
    setError(null);
    onClose();
  };

  // Emoji — insert tại cursor
  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + emoji.length; ta.focus(); }, 0);
    } else {
      setContent(prev => prev + emoji);
    }
  };

  // Location — reverse geocode qua Nominatim (free, no key)
  const detectLocation = () => {
    if (!navigator.geolocation) { setLocationText('Trình duyệt không hỗ trợ vị trí'); return; }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=vi`);
          const data = await res.json();
          const loc = data.address?.city || data.address?.town || data.address?.county || data.display_name?.split(',')[0] || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          setLocationText(loc);
          setShowLocation(true);
        } catch { setLocationText('Không lấy được vị trí'); }
        finally { setLocationLoading(false); }
      },
      () => { setLocationText('Bạn đã từ chối chia sẻ vị trí'); setLocationLoading(false); },
      { timeout: 10000 }
    );
  };

  // Tag people — search users
  useEffect(() => {
    if (!showTagPeople || tagQuery.length < 2) { setTagResults([]); return; }
    const timer = setTimeout(() => {
      api.getApiUsersSearch({ q: tagQuery })
        .then(res => { if (res.success && res.data) setTagResults((res.data ?? []).map(u => ({ id: Number(u.id), username: u.username ?? '', fullName: u.fullName }))); })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [tagQuery, showTagPeople]); // eslint-disable-line react-hooks/exhaustive-deps

  const addTag = (u: { id: number; username: string }) => {
    if (taggedUsers.some(t => t.id === u.id)) return;
    setTaggedUsers(prev => [...prev, u]);
    setContent(prev => prev + (prev.endsWith(' ') || !prev ? '' : ' ') + `@${u.username} `);
    setTagQuery('');
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.postApiPosts({
        content: content.trim(),
        imageUrl: imageUrl?.trim() || undefined,
        videoUrl: videoUrl?.trim() || undefined,
        visibility,
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
                  <div className="relative">
                    <button
                      onClick={() => setShowVisibility(v => !v)}
                      className="flex items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded-lg text-[11px] font-semibold text-secondary hover:bg-surface-container-high transition-colors"
                    >
                      {visibility === 'Public' && <><Globe className="w-3 h-3" /> Công khai</>}
                      {visibility === 'FollowersOnly' && <><Users className="w-3 h-3" /> Người theo dõi</>}
                      {visibility === 'Private' && <><Lock className="w-3 h-3" /> Riêng tư</>}
                      <Plus className="w-3 h-3 rotate-45" />
                    </button>
                    {showVisibility && (
                      <div className="absolute top-full left-0 mt-1 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/20 py-1 z-20 min-w-[160px]">
                        {([
                          { val: 'Public' as const, icon: <Globe className="w-4 h-4" />, label: '🌍 Công khai' },
                          { val: 'FollowersOnly' as const, icon: <Users className="w-4 h-4" />, label: '👥 Người theo dõi' },
                          { val: 'Private' as const, icon: <Lock className="w-4 h-4" />, label: '🔒 Riêng tư' },
                        ]).map(opt => (
                          <button
                            key={opt.val}
                            onClick={() => { setVisibility(opt.val); setShowVisibility(false); }}
                            className={`flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors ${
                              visibility === opt.val ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-surface-container-low'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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

              {/* Video upload */}
              {showVideoInput && (
                <div className="mt-3 mb-2">
                  {videoUrl ? (
                    <div className="relative rounded-xl overflow-hidden bg-black">
                      <video src={videoUrl} className="w-full max-h-64 object-contain" controls />
                      <button
                        type="button"
                        onClick={() => setVideoUrl(undefined)}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 w-full h-48 bg-surface-container-low border-2 border-dashed border-outline-variant hover:border-primary/50 rounded-xl cursor-pointer transition-colors">
                      {videoUploading ? (
                        <Loader className="w-8 h-8 animate-spin text-primary" />
                      ) : (
                        <>
                          <Video className="w-8 h-8 text-outline" />
                          <p className="text-sm text-outline">Nhấn để chọn video (MP4, WebM, tối đa 50MB)</p>
                        </>
                      )}
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        className="hidden"
                        disabled={videoUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          e.target.value = '';
                          setVideoUploading(true);
                          try {
                            const res = await uploadVideo(file);
                            if (res.success && res.data?.url) {
                              setVideoUrl(res.data.url);
                            } else {
                              toast.error(res.message ?? 'Upload video thất bại.');
                            }
                          } catch {
                            toast.error('Không thể upload video. Vui lòng thử lại.');
                          } finally {
                            setVideoUploading(false);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 mt-3 text-error text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Location + Tagged users indicator */}
              {(locationText || taggedUsers.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-outline">
                  {locationText && (
                    <span className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-500/10 text-red-600 px-2.5 py-1 rounded-full font-semibold">
                      <MapPin className="w-3 h-3" /> {locationText}
                      <button onClick={() => { setLocationText(''); setShowLocation(false); }} className="ml-1 hover:text-red-800"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {taggedUsers.map(u => (
                    <span key={u.id} className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 px-2.5 py-1 rounded-full font-semibold">
                      @{u.username}
                      <button onClick={() => setTaggedUsers(prev => prev.filter(t => t.id !== u.id))} className="ml-0.5 hover:text-blue-800"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}

              {/* AI Generate panel */}
              {showAi && (
                <div className="mt-3 p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-500/10 dark:to-blue-500/10 rounded-xl border border-purple-200/40 dark:border-purple-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-bold text-purple-700 dark:text-purple-300">Viết bằng AI</span>
                    </div>
                    <button
                      onClick={() => setAiShowAdvanced(v => !v)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-purple-500 hover:text-purple-700 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      {aiShowAdvanced ? 'Ẩn nâng cao' : 'Nâng cao'}
                    </button>
                  </div>

                  {/* Kiểm tra API Key */}
                  {!getGeminiApiKey() ? (
                    <div className="text-center py-3">
                      <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-sm text-on-surface font-medium mb-1">Chưa cấu hình Gemini API Key</p>
                      <p className="text-xs text-outline mb-3">
                        Bạn cần có Google Gemini API Key để dùng tính năng này.
                        Lấy key miễn phí tại{' '}
                        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                          aistudio.google.com
                        </a>
                      </p>
                      <button
                        onClick={() => {
                          handleClose();
                          onNavigateSettings?.();
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-600 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Đi đến Cài đặt để nhập Key
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Topic input */}
                      <input
                        className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary/50 mb-2"
                        placeholder="Chủ đề bài viết (bắt buộc)..."
                        value={aiTopic}
                        onChange={e => setAiTopic(e.target.value)}
                      />

                      {/* Mood + Keywords */}
                      <div className="flex gap-2 mb-2">
                        <select
                          className="flex-1 px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary/50"
                          value={aiMood}
                          onChange={e => setAiMood(e.target.value)}
                        >
                          <option value="">Giọng văn (tuỳ chọn)</option>
                          <option value="Vui vẻ">😊 Vui vẻ</option>
                          <option value="Buồn">😢 Buồn</option>
                          <option value="Chuyên nghiệp">💼 Chuyên nghiệp</option>
                          <option value="Hài hước">😂 Hài hước</option>
                          <option value="Lãng mạn">💖 Lãng mạn</option>
                          <option value="Truyền cảm hứng">✨ Truyền cảm hứng</option>
                        </select>
                        <input
                          className="flex-1 px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary/50"
                          placeholder="Từ khoá (tuỳ chọn)..."
                          value={aiKeywords}
                          onChange={e => setAiKeywords(e.target.value)}
                        />
                      </div>

                      {/* Advanced settings */}
                      {aiShowAdvanced && (
                        <div className="mb-3 p-3 bg-white/50 dark:bg-white/5 rounded-lg border border-purple-200/30 dark:border-purple-500/10 space-y-3">
                          {/* Model selection */}
                          <div>
                            <label className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1 block">Model</label>
                            <select
                              className="w-full px-3 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary/50"
                              value={aiModel}
                              onChange={e => { const m = e.target.value as GeminiModelId; setAiModel(m); setGeminiModel(m); }}
                            >
                              {GEMINI_MODELS.map(m => (
                                <option key={m.id} value={m.id}>{m.name} — {m.desc}</option>
                              ))}
                            </select>
                          </div>

                          {/* Temperature */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Sáng tạo (Temperature)</label>
                              <span className="text-xs font-mono text-outline">{aiTemperature.toFixed(1)}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="2"
                              step="0.1"
                              value={aiTemperature}
                              onChange={e => setAiTemperature(Number(e.target.value))}
                              className="w-full accent-purple-500 h-1.5"
                            />
                            <div className="flex justify-between text-[10px] text-outline mt-0.5">
                              <span>Chính xác (0)</span>
                              <span>Cân bằng (1)</span>
                              <span>Sáng tạo (2)</span>
                            </div>
                          </div>

                          {/* Max tokens */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Độ dài tối đa</label>
                              <span className="text-xs font-mono text-outline">{aiMaxTokens} tokens</span>
                            </div>
                            <input
                              type="range"
                              min="100"
                              max="2000"
                              step="100"
                              value={aiMaxTokens}
                              onChange={e => setAiMaxTokens(Number(e.target.value))}
                              className="w-full accent-purple-500 h-1.5"
                            />
                            <div className="flex justify-between text-[10px] text-outline mt-0.5">
                              <span>Ngắn (100)</span>
                              <span>Dài (2000)</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Preview kết quả AI */}
                      {aiPreview && (
                        <div className="mb-3 p-3 bg-white/70 dark:bg-white/5 rounded-lg border border-green-200/50 dark:border-green-500/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Kết quả AI</span>
                            <span className="text-[10px] text-outline">{aiPreview.length} ký tự</span>
                          </div>
                          <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto mb-2">{aiPreview}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setContent(aiPreview);
                                setAiPreview(null);
                                toast.success('Đã áp dụng nội dung AI!');
                                textareaRef.current?.focus();
                              }}
                              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-green-500 hover:bg-green-600 flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Check className="w-4 h-4" /> Áp dụng
                            </button>
                            <button
                              onClick={() => {
                                setContent(prev => prev ? prev + '\n\n' + aiPreview : aiPreview);
                                setAiPreview(null);
                                toast.success('Đã thêm vào cuối bài!');
                                textareaRef.current?.focus();
                              }}
                              className="py-2 px-3 rounded-lg text-sm font-semibold text-purple-600 bg-purple-100 dark:bg-purple-500/20 hover:bg-purple-200 dark:hover:bg-purple-500/30 transition-colors"
                            >
                              + Nối thêm
                            </button>
                            <button
                              onClick={() => setAiPreview(null)}
                              className="py-2 px-3 rounded-lg text-sm text-outline hover:bg-surface-container transition-colors"
                            >
                              Bỏ
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Generate button */}
                      <button
                        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                        disabled={!aiTopic.trim() || aiLoading}
                        onClick={async () => {
                          setAiLoading(true);
                          setAiPreview(null);
                          try {
                            const result = await generatePostContent({
                              topic: aiTopic.trim(),
                              mood: aiMood || undefined,
                              keywords: aiKeywords.trim() || undefined,
                              model: aiModel,
                              temperature: aiTemperature,
                              maxTokens: aiMaxTokens,
                            });
                            // Hiện preview thay vì ghi đè trực tiếp vào content
                            setAiPreview(result);
                          } catch (err) {
                            const msg = (err as Error).message;
                            if (msg === 'NO_API_KEY') {
                              toast.error('API Key bị xóa. Vui lòng nhập lại trong Cài đặt.');
                            } else {
                              toast.error(msg || 'Lỗi khi tạo nội dung AI.');
                            }
                          } finally {
                            setAiLoading(false);
                          }
                        }}
                      >
                        {aiLoading ? <Loader className="w-4 h-4 animate-spin" /> : aiPreview ? <RotateCcw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                        {aiLoading ? 'Đang tạo...' : aiPreview ? 'Tạo lại' : 'Tạo nội dung'}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Emoji picker */}
              {showEmoji && (
                <div className="mt-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <div className="grid grid-cols-9 gap-1">
                    {EMOJI_LIST.map(e => (
                      <button key={e} onClick={() => insertEmoji(e)} className="p-1.5 hover:bg-surface-container rounded-lg text-xl transition-colors">{e}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tag people panel */}
              {showTagPeople && (
                <div className="mt-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                    <input className="w-full pl-9 pr-4 py-2 border border-outline-variant/20 rounded-lg text-sm bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary/50"
                      placeholder="Tìm người để gắn thẻ..." value={tagQuery} onChange={e => setTagQuery(e.target.value)} autoFocus />
                  </div>
                  {tagResults.length > 0 && (
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {tagResults.map(u => (
                        <button key={u.id} onClick={() => addTag(u)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container text-sm text-on-surface-variant transition-colors text-left">
                          <span className="font-semibold">@{u.username}</span>
                          {u.fullName && <span className="text-outline text-xs">{u.fullName}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Add to post bar */}
              <div className="rounded-xl border border-outline-variant/30 p-4 mt-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-secondary px-1">Thêm vào bài viết</span>
                  <div className="flex items-center gap-1">
                    <button
                      className={`p-2.5 hover:bg-surface-container-low rounded-full transition-colors ${showImageInput ? 'text-primary' : 'text-primary/60'}`}
                      onClick={() => { setShowImageInput(!showImageInput); setShowVideoInput(false); }}
                      title="Ảnh"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                    <button
                      className={`p-2.5 hover:bg-surface-container-low rounded-full transition-colors ${showVideoInput ? 'text-green-500' : 'text-green-500/60'}`}
                      onClick={() => { setShowVideoInput(!showVideoInput); setShowImageInput(false); }}
                      title="Video"
                    >
                      <Video className="w-5 h-5" />
                    </button>
                    <button
                      className={`p-2.5 hover:bg-surface-container-low rounded-full transition-colors ${showTagPeople ? 'text-tertiary' : 'text-tertiary/60'}`}
                      onClick={() => { setShowTagPeople(!showTagPeople); setShowEmoji(false); }}
                      title="Gắn thẻ bạn bè"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                    <button
                      className={`p-2.5 hover:bg-surface-container-low rounded-full transition-colors ${showEmoji ? 'text-orange-500' : 'text-orange-500/60'}`}
                      onClick={() => { setShowEmoji(!showEmoji); setShowTagPeople(false); }}
                      title="Biểu tượng cảm xúc"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    <button
                      className={`p-2.5 hover:bg-surface-container-low rounded-full transition-colors ${locationText ? 'text-red-500' : 'text-red-500/60'}`}
                      onClick={detectLocation}
                      title="Vị trí"
                      disabled={locationLoading}
                    >
                      {locationLoading ? <Loader className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                    </button>
                    <button
                      className={`p-2.5 hover:bg-surface-container-low rounded-full transition-colors ${showAi ? 'text-purple-500' : 'text-purple-500/60'}`}
                      onClick={() => { setShowAi(!showAi); setShowEmoji(false); setShowTagPeople(false); }}
                      title="Viết bằng AI"
                    >
                      <Sparkles className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 hover:bg-surface-container-low rounded-full transition-colors text-outline" title="Thêm">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
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
