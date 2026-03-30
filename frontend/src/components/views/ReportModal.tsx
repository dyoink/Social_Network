import { useState } from 'react';
import { X, Flag, Loader, CheckCircle2 } from 'lucide-react';
import { getSocialNetworkApiV1 } from '../../api/api-generated';

interface ReportModalProps {
  targetPostId?: number;
  targetUserId?: number;
  onClose: () => void;
}

const reasons = [
  { key: 'spam',     label: 'Spam' },
  { key: 'hate',     label: 'Ngôn từ thù địch / quấy rối' },
  { key: 'nude',     label: 'Nội dung khiêu dâm / nhạy cảm' },
  { key: 'violence', label: 'Bạo lực / đe dọa' },
  { key: 'other',    label: 'Khác' },
];

const ReportModal = ({ targetPostId, targetUserId, onClose }: ReportModalProps) => {
  const api = getSocialNetworkApiV1();
  const [reason,    setReason]    = useState('');
  const [detail,    setDetail]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      await api.postApiReports({ targetPostId, targetUserId, reason, detail: detail.trim() || undefined });
      setSubmitted(true);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            <h2 className="font-bold text-lg text-on-surface">Báo cáo vi phạm</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-container rounded-lg transition-colors">
            <X className="w-5 h-5 text-outline" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h3 className="font-bold text-on-surface text-lg">Đã gửi báo cáo!</h3>
              <p className="text-outline text-sm mt-2">Cảm ơn bạn. Chúng tôi sẽ xem xét và xử lý sớm nhất có thể.</p>
              <button onClick={onClose} className="mt-6 px-6 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90">
                Đóng
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-outline mb-5">
                Chọn lý do báo cáo {targetPostId ? 'bài viết' : 'tài khoản'} này. Thông tin báo cáo sẽ được bảo mật.
              </p>

              {/* Reason selection */}
              <div className="space-y-2 mb-5">
                {reasons.map(r => (
                  <label key={r.key} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${reason === r.key ? 'border-primary bg-primary/5' : 'border-outline-variant/20 hover:border-outline-variant/40'}`}>
                    <input
                      type="radio"
                      name="reason"
                      value={r.key}
                      checked={reason === r.key}
                      onChange={() => setReason(r.key)}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium text-on-surface-variant">{r.label}</span>
                  </label>
                ))}
              </div>

              {/* Detail */}
              <textarea
                placeholder="Mô tả thêm (tùy chọn)..."
                className="w-full border border-outline-variant/20 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-primary/50 text-on-surface-variant placeholder:text-outline bg-surface-container-low"
                rows={3}
                value={detail}
                onChange={e => setDetail(e.target.value)}
                maxLength={500}
              />

              <button
                disabled={!reason || loading}
                onClick={handleSubmit}
                className="mt-4 w-full py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
