import { useState, useEffect, useMemo } from 'react';
import { Sprout, Trash2, Loader, AlertTriangle, CheckCircle, Info, Users, FileText, MessageSquare, Heart, UserPlus, BookOpen } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

interface SeedOptions {
  userCount: number;
  postsPerUser: number;
  commentsPerPost: number;
  followsPerUser: number;
  reactionsPerPost: number;
  includeMessages: boolean;
  includeStories: boolean;
}

interface SeedResult {
  usersCreated: number;
  postsCreated: number;
  commentsCreated: number;
  followsCreated: number;
  reactionsCreated: number;
  messagesCreated: number;
  storiesCreated: number;
  durationMs: number;
}

interface SeedStatus {
  seededUsers: number;
  seededPosts: number;
  seededComments: number;
  seededFollows: number;
  seededReactions: number;
  seededMessages: number;
  seededStories: number;
}

const DEFAULT_OPTIONS: SeedOptions = {
  userCount: 20,
  postsPerUser: 5,
  commentsPerPost: 3,
  followsPerUser: 10,
  reactionsPerPost: 15,
  includeMessages: true,
  includeStories: true,
};

const SliderField = ({ label, icon, value, min, max, onChange }: {
  label: string; icon: React.ReactNode; value: number; min: number; max: number; onChange: (v: number) => void;
}) => (
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2 w-44 shrink-0">
      {icon}
      <span className="text-sm font-medium text-on-surface">{label}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="flex-1 h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
    />
    <span className="w-12 text-right text-sm font-bold text-primary tabular-nums">{value}</span>
  </div>
);

const AdminSeedView = () => {
  const [options, setOptions] = useState<SeedOptions>(DEFAULT_OPTIONS);
  const [status, setStatus] = useState<SeedStatus | null>(null);
  const [lastResult, setLastResult] = useState<SeedResult | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const fetchStatus = () => {
    api.get<{ success: boolean; data: SeedStatus }>('/api/admin/seed/status')
      .then(res => { if (res.data?.success) setStatus(res.data.data); })
      .catch(() => {});
  };

  useEffect(() => { fetchStatus(); }, []);

  const estimate = useMemo(() => {
    const { userCount, postsPerUser, commentsPerPost, followsPerUser, reactionsPerPost, includeMessages, includeStories } = options;
    const posts = userCount * postsPerUser;
    const comments = posts * commentsPerPost;
    const reactions = posts * Math.min(reactionsPerPost, userCount - 1);
    const follows = userCount * Math.min(followsPerUser, userCount - 1);
    const messages = includeMessages ? Math.min(20, userCount * (userCount - 1) / 2) * 10 : 0;
    const stories = includeStories ? Math.floor(userCount / 2) * 2 : 0;
    return { total: userCount + posts + comments + reactions + follows + messages + stories, posts, comments, reactions, follows, messages, stories };
  }, [options]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await api.post<{ success: boolean; data: SeedResult; message: string }>('/api/admin/seed', options);
      if (res.data?.success) {
        setLastResult(res.data.data);
        toast.success(res.data.message || 'Seed thành công!');
        fetchStatus();
      }
    } catch {
      toast.error('Lỗi khi seed dữ liệu.');
    } finally {
      setSeeding(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    setShowConfirmClear(false);
    try {
      const res = await api.delete<{ success: boolean; data: SeedResult; message: string }>('/api/admin/seed');
      if (res.data?.success) {
        setLastResult(null);
        toast.success(res.data.message || 'Đã xoá dữ liệu seed.');
        fetchStatus();
      }
    } catch {
      toast.error('Lỗi khi xoá dữ liệu seed.');
    } finally {
      setClearing(false);
    }
  };

  const set = <K extends keyof SeedOptions>(key: K, val: SeedOptions[K]) =>
    setOptions(prev => ({ ...prev, [key]: val }));

  const hasSeededData = status && status.seededUsers > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-on-surface font-headline tracking-tight flex items-center gap-2">
          <Sprout className="w-7 h-7 text-primary" />
          Seed Data ngẫu nhiên
        </h1>
        <p className="text-outline mt-1 text-sm">Tạo dữ liệu giả để test ứng dụng. Có thể xoá hàng loạt bất cứ lúc nào.</p>
      </div>

      {/* Status bar */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/20 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-full ${hasSeededData ? 'bg-yellow-500' : 'bg-green-500'}`} />
          <span className="text-outline font-medium">Trạng thái:</span>
          <span className="text-on-surface font-semibold">{hasSeededData ? 'Có dữ liệu seed' : 'Sạch'}</span>
        </div>
        {status && hasSeededData && (
          <>
            <span className="text-outline">👤 {status.seededUsers}</span>
            <span className="text-outline">📝 {status.seededPosts}</span>
            <span className="text-outline">💬 {status.seededComments}</span>
            <span className="text-outline">❤️ {status.seededReactions}</span>
            <span className="text-outline">👥 {status.seededFollows}</span>
            <span className="text-outline">✉️ {status.seededMessages}</span>
            <span className="text-outline">📷 {status.seededStories}</span>
          </>
        )}
      </div>

      {/* Options */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 space-y-5">
        <h2 className="font-headline font-bold text-lg text-on-surface">Tuỳ chỉnh</h2>

        <div className="space-y-4">
          <SliderField label="Số users" icon={<Users className="w-4 h-4 text-primary" />} value={options.userCount} min={1} max={200} onChange={v => set('userCount', v)} />
          <SliderField label="Posts / user" icon={<FileText className="w-4 h-4 text-primary" />} value={options.postsPerUser} min={0} max={20} onChange={v => set('postsPerUser', v)} />
          <SliderField label="Comments / post" icon={<MessageSquare className="w-4 h-4 text-primary" />} value={options.commentsPerPost} min={0} max={10} onChange={v => set('commentsPerPost', v)} />
          <SliderField label="Follows / user" icon={<UserPlus className="w-4 h-4 text-primary" />} value={options.followsPerUser} min={0} max={30} onChange={v => set('followsPerUser', v)} />
          <SliderField label="Reactions / post" icon={<Heart className="w-4 h-4 text-primary" />} value={options.reactionsPerPost} min={0} max={50} onChange={v => set('reactionsPerPost', v)} />
        </div>

        <div className="flex gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={options.includeMessages} onChange={e => set('includeMessages', e.target.checked)} className="w-4 h-4 accent-primary rounded" />
            <span className="text-sm text-on-surface">Tạo Conversations + Messages</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={options.includeStories} onChange={e => set('includeStories', e.target.checked)} className="w-4 h-4 accent-primary rounded" />
            <span className="text-sm text-on-surface">Tạo Stories</span>
          </label>
        </div>

        {/* Estimate */}
        <div className="flex items-center gap-2 text-sm text-outline bg-surface-container-low rounded-xl p-3">
          <Info className="w-4 h-4 shrink-0" />
          <span>Ước tính: <strong className="text-on-surface">~{estimate.total.toLocaleString()}</strong> records sẽ được tạo</span>
          {estimate.total > 5000 && <span className="text-yellow-600 font-semibold ml-2">⚠️ Có thể chậm</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSeed}
          disabled={seeding || clearing}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:brightness-110 disabled:opacity-60 transition-all"
        >
          {seeding ? <Loader className="w-4 h-4 animate-spin" /> : <Sprout className="w-4 h-4" />}
          {seeding ? 'Đang tạo dữ liệu...' : 'Bắt đầu Seed'}
        </button>

        {hasSeededData && !showConfirmClear && (
          <button
            onClick={() => setShowConfirmClear(true)}
            disabled={seeding || clearing}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Xoá toàn bộ Seeded Data
          </button>
        )}

        {showConfirmClear && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700 dark:text-red-400 font-medium">Xác nhận xoá?</span>
            <button
              onClick={handleClear}
              disabled={clearing}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-60"
            >
              {clearing ? <Loader className="w-3 h-3 animate-spin" /> : 'Xoá'}
            </button>
            <button
              onClick={() => setShowConfirmClear(false)}
              className="px-3 py-1.5 bg-surface-container text-on-surface rounded-lg text-xs font-semibold hover:bg-surface-container-high"
            >
              Huỷ
            </button>
          </div>
        )}
      </div>

      {/* Result */}
      {lastResult && (
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 space-y-3">
          <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Kết quả lần cuối
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Stat label="Users" value={lastResult.usersCreated} />
            <Stat label="Posts" value={lastResult.postsCreated} />
            <Stat label="Comments" value={lastResult.commentsCreated} />
            <Stat label="Reactions" value={lastResult.reactionsCreated} />
            <Stat label="Follows" value={lastResult.followsCreated} />
            <Stat label="Messages" value={lastResult.messagesCreated} />
            <Stat label="Stories" value={lastResult.storiesCreated} />
            <Stat label="Thời gian" value={`${(lastResult.durationMs / 1000).toFixed(1)}s`} />
          </div>
          <p className="text-xs text-outline flex items-center gap-1.5 mt-2">
            <BookOpen className="w-3.5 h-3.5" />
            Password tất cả seeded users: <code className="bg-surface-container-low px-2 py-0.5 rounded font-mono text-primary">Seed@1234</code>
          </p>
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number | string }) => (
  <div className="bg-surface-container-low rounded-xl p-3 text-center">
    <p className="text-xs text-outline">{label}</p>
    <p className="text-lg font-bold text-on-surface">{typeof value === 'number' ? value.toLocaleString() : value}</p>
  </div>
);

export default AdminSeedView;
