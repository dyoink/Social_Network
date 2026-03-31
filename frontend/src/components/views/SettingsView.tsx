import { useState } from 'react';
import { Moon, Sun, Lock, LogOut, Bug, KeyRound, Loader, Check, AlertCircle, Sparkles, Eye, EyeOff, Trash2, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSocialNetworkApiV1 } from '../../api/api-generated';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import { getGeminiApiKey, setGeminiApiKey, removeGeminiApiKey } from '../../api/gemini';

interface SettingsViewProps {
  onLogout: () => void;
}

// ─── Gemini API Key Management ────────────────────────────────────────────
const GeminiKeySection = () => {
  const [apiKey, setApiKey] = useState(getGeminiApiKey() ?? '');
  const [showKey, setShowKey] = useState(false);
  const hasKey = !!getGeminiApiKey();

  const handleSave = () => {
    if (!apiKey.trim()) { toast.error('Vui lòng nhập API Key.'); return; }
    setGeminiApiKey(apiKey.trim());
    toast.success('Đã lưu Gemini API Key.');
  };

  const handleRemove = () => {
    removeGeminiApiKey();
    setApiKey('');
    toast.success('Đã xóa API Key.');
  };

  return (
    <section className="bg-surface-container-lowest rounded-2xl surface-elevation-tonal p-6">
      <h2 className="font-headline font-bold text-lg text-on-surface mb-2 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        AI Viết bài (Gemini)
      </h2>
      <p className="text-xs text-outline mb-4">
        Thêm Google Gemini API Key để dùng tính năng ✨ Viết bằng AI khi tạo bài viết.
        Key được lưu trên trình duyệt của bạn, không gửi lên server.
        Lấy key tại{' '}
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
          aistudio.google.com/apikey
        </a>
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-4 pr-10 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none font-mono"
          />
          <button
            type="button"
            onClick={() => setShowKey(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all flex items-center gap-1.5"
        >
          <Check className="w-4 h-4" /> Lưu
        </button>
        {hasKey && (
          <button
            onClick={handleRemove}
            className="px-3 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {hasKey && (
        <p className="mt-2 text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
          <Check className="w-3 h-3" /> API Key đã được cấu hình
        </p>
      )}
    </section>
  );
};

const SettingsView = ({ onLogout }: SettingsViewProps) => {
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const api = getSocialNetworkApiV1();

  // Change password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');

  // Notification preferences (localStorage)
  const NOTIF_PREFS_KEY = 'social_notif_prefs';
  const NOTIF_TYPES = [
    { key: 'like', label: 'Lượt thích', desc: 'Khi ai đó thích bài viết của bạn' },
    { key: 'comment', label: 'Bình luận', desc: 'Khi ai đó bình luận bài viết của bạn' },
    { key: 'reply', label: 'Trả lời', desc: 'Khi ai đó trả lời bình luận của bạn' },
    { key: 'follow', label: 'Theo dõi', desc: 'Khi ai đó theo dõi bạn' },
    { key: 'message', label: 'Tin nhắn', desc: 'Khi nhận tin nhắn mới' },
    { key: 'poke', label: 'Chọc', desc: 'Khi ai đó chọc bạn' },
  ] as const;

  const getNotifPrefs = (): Record<string, boolean> => {
    try { return JSON.parse(localStorage.getItem(NOTIF_PREFS_KEY) || '{}'); } catch { return {}; }
  };
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(() => getNotifPrefs());

  const toggleNotifPref = (key: string) => {
    const updated = { ...notifPrefs, [key]: !(notifPrefs[key] ?? true) };
    setNotifPrefs(updated);
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(updated));
    toast.success('Đã cập nhật cài đặt thông báo.');
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (!currentPw || !newPw) { setPwError('Vui lòng nhập đầy đủ.'); return; }
    if (newPw.length < 6) { setPwError('Mật khẩu mới tối thiểu 6 ký tự.'); return; }
    if (newPw !== confirmPw) { setPwError('Mật khẩu xác nhận không khớp.'); return; }

    setPwLoading(true);
    try {
      await api.putApiUsersMePassword({ currentPassword: currentPw, newPassword: newPw });
      toast.success('Đổi mật khẩu thành công!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch {
      setPwError('Mật khẩu hiện tại không đúng.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="font-headline font-bold text-2xl text-on-surface">Cài đặt</h1>

      {/* Theme */}
      <section className="bg-surface-container-lowest rounded-2xl surface-elevation-tonal p-6">
        <h2 className="font-headline font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
          {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
          Giao diện
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-on-surface">Chế độ tối</p>
            <p className="text-xs text-outline">Chuyển giữa giao diện sáng và tối</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-surface-container-high'
              }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
                }`}
            />
          </button>
        </div>
      </section>

      {/* Change Password */}
      <section className="bg-surface-container-lowest rounded-2xl surface-elevation-tonal p-6">
        <h2 className="font-headline font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" />
          Đổi mật khẩu
        </h2>
        <div className="space-y-3">
          <input
            type="password"
            placeholder="Mật khẩu hiện tại"
            value={currentPw}
            onChange={e => setCurrentPw(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none"
          />
          {pwError && (
            <div className="flex items-center gap-2 text-error text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {pwError}
            </div>
          )}
          <button
            onClick={handleChangePassword}
            disabled={pwLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:brightness-110 disabled:opacity-60 transition-all"
          >
            {pwLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Đổi mật khẩu
          </button>
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-surface-container-lowest rounded-2xl surface-elevation-tonal p-6">
        <h2 className="font-headline font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          Quyền riêng tư
        </h2>
        <p className="text-sm text-on-surface-variant">
          Mỗi bài đăng có thể chọn mức hiển thị riêng: 🌍 Công khai, 👥 Người theo dõi, 🔒 Riêng tư.
          Bạn có thể chỉnh visibility khi tạo hoặc chỉnh sửa bài viết.
        </p>
      </section>

      {/* Gemini AI */}
      <GeminiKeySection />

      {/* Notification Preferences */}
      <section className="bg-surface-container-lowest rounded-2xl surface-elevation-tonal p-6">
        <h2 className="font-headline font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Thông báo
        </h2>
        <p className="text-xs text-outline mb-4">Bật/tắt từng loại thông báo. Cài đặt được lưu trên trình duyệt.</p>
        <div className="space-y-3">
          {NOTIF_TYPES.map(({ key, label, desc }) => {
            const enabled = notifPrefs[key] ?? true;
            return (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">{label}</p>
                  <p className="text-xs text-outline">{desc}</p>
                </div>
                <button
                  onClick={() => toggleNotifPref(key)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-surface-container-high'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${enabled ? 'translate-x-7' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Report bug */}
      <section className="bg-surface-container-lowest rounded-2xl surface-elevation-tonal p-6">
        <h2 className="font-headline font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
          <Bug className="w-5 h-5 text-primary" />
          Báo cáo sự cố
        </h2>
        <p className="text-sm text-on-surface-variant mb-3">
          Phát hiện lỗi? Gửi email tới <span className="text-primary font-medium">support@socialnetwork.dev</span> kèm mô tả chi tiết.
        </p>
      </section>

      {/* Account info */}
      <section className="bg-surface-container-lowest rounded-2xl surface-elevation-tonal p-6">
        <h2 className="font-headline font-bold text-lg text-on-surface mb-4">Tài khoản</h2>
        <div className="space-y-2 text-sm text-on-surface-variant">
          <p>Username: <span className="font-medium text-on-surface">@{user?.username}</span></p>
          <p>Email: <span className="font-medium text-on-surface">{user?.email}</span></p>
          <p>Role: <span className="font-medium text-on-surface">{user?.role}</span></p>
        </div>
      </section>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Đăng xuất
      </button>
    </div>
  );
};

export default SettingsView;
