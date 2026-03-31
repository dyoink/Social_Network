import { useState, useEffect } from 'react';
import { Loader, Plus, Pencil, Trash2, X, Check, Award, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSocialNetworkApiV1, type BadgeDto, type CreateBadgeDto, type UpdateBadgeDto } from '../../api/api-generated';

const CONDITION_TYPES = [
  { value: 'PostCount', label: 'Số bài viết' },
  { value: 'LikesReceived', label: 'Lượt thích nhận được' },
  { value: 'CommentsCount', label: 'Số bình luận' },
  { value: 'FollowersCount', label: 'Số followers' },
  { value: 'DaysActive', label: 'Số ngày hoạt động' },
  { value: 'PokesSent', label: 'Số lần chọc' },
  { value: 'Manual', label: 'Thủ công (Admin cấp)' },
];

const AdminBadgesView = () => {
  const api = getSocialNetworkApiV1();
  const [badges, setBadges] = useState<BadgeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeDto | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIcon, setFormIcon] = useState('🏆');
  const [formColor, setFormColor] = useState('#f59e0b');
  const [formConditionType, setFormConditionType] = useState('Manual');
  const [formConditionValue, setFormConditionValue] = useState<number | ''>('');
  const [formIsManualOnly, setFormIsManualOnly] = useState(false);
  const [saving, setSaving] = useState(false);

  // Manual award state
  const [awardUserId, setAwardUserId] = useState('');
  const [awardBadgeId, setAwardBadgeId] = useState<number | null>(null);
  const [awarding, setAwarding] = useState(false);

  const fetchBadges = async () => {
    try {
      const res = await api.getApiAdminBadges();
      if (res.success && res.data) setBadges(res.data as BadgeDto[]);
    } catch { toast.error('Lỗi tải danh sách badge.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBadges(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditingBadge(null);
    setFormName(''); setFormDesc(''); setFormIcon('🏆'); setFormColor('#f59e0b');
    setFormConditionType('Manual'); setFormConditionValue(''); setFormIsManualOnly(false);
    setShowForm(true);
  };

  const openEdit = (b: BadgeDto) => {
    setEditingBadge(b);
    setFormName(b.name ?? ''); setFormDesc(b.description ?? ''); setFormIcon(b.icon ?? '🏆'); setFormColor(b.color ?? '#f59e0b');
    setFormConditionType(b.conditionType ?? 'Manual'); setFormConditionValue(b.conditionValue ? Number(b.conditionValue) : ''); setFormIsManualOnly(b.isManualOnly ?? false);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('Tên badge không được để trống.'); return; }
    setSaving(true);
    try {
      if (editingBadge) {
        const dto: UpdateBadgeDto = {
          name: formName, description: formDesc, icon: formIcon, color: formColor,
          conditionType: formConditionType, conditionValue: formConditionValue || undefined,
          isManualOnly: formIsManualOnly,
        };
        await api.putApiAdminBadgesId(Number(editingBadge.id), dto);
        toast.success('Đã cập nhật badge.');
      } else {
        const dto: CreateBadgeDto = {
          name: formName, description: formDesc, icon: formIcon, color: formColor,
          conditionType: formConditionType, conditionValue: formConditionValue || undefined,
          isManualOnly: formIsManualOnly,
        };
        await api.postApiAdminBadges(dto);
        toast.success('Đã tạo badge mới.');
      }
      setShowForm(false);
      fetchBadges();
    } catch { toast.error('Lỗi lưu badge.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa badge này?')) return;
    try {
      await api.deleteApiAdminBadgesId(id);
      toast.success('Đã xóa badge.');
      fetchBadges();
    } catch { toast.error('Lỗi xóa badge.'); }
  };

  const handleAward = async () => {
    if (!awardUserId || !awardBadgeId) { toast.error('Nhập User ID và chọn badge.'); return; }
    setAwarding(true);
    try {
      await api.postApiAdminUsersUserIdBadgesBadgeId(Number(awardUserId), awardBadgeId);
      toast.success(`Đã cấp badge cho User #${awardUserId}.`);
      setAwardUserId(''); setAwardBadgeId(null);
      fetchBadges();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Lỗi cấp badge.');
    } finally { setAwarding(false); }
  };

  const handleRevoke = async () => {
    if (!awardUserId || !awardBadgeId) { toast.error('Nhập User ID và chọn badge.'); return; }
    setAwarding(true);
    try {
      await api.deleteApiAdminUsersUserIdBadgesBadgeId(Number(awardUserId), awardBadgeId);
      toast.success(`Đã thu hồi badge từ User #${awardUserId}.`);
      setAwardUserId(''); setAwardBadgeId(null);
      fetchBadges();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Lỗi thu hồi badge.');
    } finally { setAwarding(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline text-2xl font-extrabold text-on-surface">Quản lý Danh hiệu</h2>
          <p className="text-sm text-outline mt-1">{badges.length} badge</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Tạo badge
        </button>
      </div>

      {/* Badges table */}
      <div className="bg-surface-container-lowest rounded-2xl surface-elevation-tonal overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/10">
              <th className="text-left px-6 py-4 font-bold text-outline text-xs uppercase tracking-wider">Badge</th>
              <th className="text-left px-6 py-4 font-bold text-outline text-xs uppercase tracking-wider hidden sm:table-cell">Điều kiện</th>
              <th className="text-center px-6 py-4 font-bold text-outline text-xs uppercase tracking-wider">Users</th>
              <th className="text-right px-6 py-4 font-bold text-outline text-xs uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {badges.map(b => (
              <tr key={b.id} className="border-b border-outline-variant/5 hover:bg-surface-container-low/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${b.color}20` }}
                    >
                      {b.icon}
                    </span>
                    <div>
                      <span className="font-bold text-on-surface">{b.name}</span>
                      <span className="block text-xs text-outline mt-0.5 max-w-[200px] truncate">{b.description}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <span className="text-xs bg-surface-container-high px-2 py-1 rounded-md text-on-surface-variant">
                    {CONDITION_TYPES.find(c => c.value === b.conditionType)?.label ?? b.conditionType}
                    {b.conditionValue ? ` ≥ ${b.conditionValue}` : ''}
                  </span>
                </td>
                <td className="px-6 py-4 text-center font-bold text-on-surface">{b.usersCount ?? 0}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(b)} className="p-2 hover:bg-surface-container rounded-lg transition-colors text-outline hover:text-primary">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(Number(b.id))} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-outline hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manual Award/Revoke */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 surface-elevation-tonal">
        <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> Cấp/Thu hồi badge thủ công</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">User ID</label>
            <input
              type="number"
              value={awardUserId}
              onChange={e => setAwardUserId(e.target.value)}
              className="w-28 bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none"
              placeholder="ID"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">Badge</label>
            <select
              value={awardBadgeId ?? ''}
              onChange={e => setAwardBadgeId(e.target.value ? Number(e.target.value) : null)}
              className="w-48 bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none"
            >
              <option value="">-- Chọn badge --</option>
              {badges.map(b => (
                <option key={b.id} value={Number(b.id)}>{b.icon} {b.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAward}
            disabled={awarding}
            className="px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {awarding ? 'Đang xử lý...' : 'Cấp badge'}
          </button>
          <button
            onClick={handleRevoke}
            disabled={awarding}
            className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {awarding ? 'Đang xử lý...' : 'Thu hồi'}
          </button>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-surface-container">
              <h2 className="font-headline font-bold text-lg text-on-surface">{editingBadge ? 'Sửa badge' : 'Tạo badge mới'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-surface-container transition-colors">
                <X className="w-5 h-5 text-outline" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">Tên badge *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none" placeholder="Blogger kỳ cựu" />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">Mô tả</label>
                <input type="text" value={formDesc} onChange={e => setFormDesc(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none" placeholder="Đăng 50 bài viết" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">Icon (emoji)</label>
                  <input type="text" value={formIcon} onChange={e => setFormIcon(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none text-center text-2xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">Màu</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
                    <input type="text" value={formColor} onChange={e => setFormColor(e.target.value)}
                      className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none font-mono" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">Điều kiện</label>
                <select value={formConditionType} onChange={e => { setFormConditionType(e.target.value); if (e.target.value === 'Manual') { setFormIsManualOnly(true); setFormConditionValue(''); } }}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none">
                  {CONDITION_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              {formConditionType !== 'Manual' && (
                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">Giá trị cần đạt</label>
                  <input type="number" value={formConditionValue} onChange={e => setFormConditionValue(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/30 focus:outline-none" placeholder="10" min={1} />
                </div>
              )}
              <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                <input type="checkbox" checked={formIsManualOnly} onChange={e => setFormIsManualOnly(e.target.checked)} className="rounded" />
                Chỉ cấp thủ công (không tự động trao)
              </label>

              {/* Preview */}
              <div className="border-t border-outline-variant/10 pt-4">
                <span className="text-xs font-bold text-outline uppercase tracking-wider">Preview</span>
                <div className="flex items-center gap-2 mt-2 p-3 bg-surface-container-low rounded-xl">
                  <span className="text-2xl">{formIcon}</span>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: `${formColor}20`, color: formColor, border: `1px solid ${formColor}40` }}
                  >
                    {formIcon} {formName || 'Badge'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-surface-container">
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm font-bold text-outline hover:text-on-surface transition-colors">Hủy</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2">
                {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingBadge ? 'Cập nhật' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBadgesView;
