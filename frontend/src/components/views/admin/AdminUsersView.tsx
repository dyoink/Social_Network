import React, { useState, useEffect } from 'react';
import { Search, Ban, CheckCircle, Shield, Trash2, Loader, ChevronLeft, ChevronRight, KeyRound, Eye, X } from 'lucide-react';
import { getSocialNetworkApiV1, type AdminUserDto } from '../../../api/api-generated';
import toast from 'react-hot-toast';
import { timeAgo } from '../../../utils/time';

const AdminUsersView = () => {
  const api = getSocialNetworkApiV1();
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionId, setActionId] = useState<number | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUserDto | null>(null);
  const [resetPwUser, setResetPwUser] = useState<AdminUserDto | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const pageSize = 20;

  const fetchUsers = (searchQ = q, role = roleFilter, status = statusFilter, p = page) => {
    setLoading(true);
    api.getApiAdminUsers({ q: searchQ || undefined, role: role || undefined, status: status || undefined, page: p, pageSize })
      .then(res => {
        if (res.success && res.data) {
          setUsers(res.data.items ?? []);
          setTotal(Number(res.data.totalCount ?? 0));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => { setPage(1); fetchUsers(q, roleFilter, statusFilter, 1); };

  const handleBan = async (user: AdminUserDto) => {
    setActionId(Number(user.id!));
    try {
      await api.putApiAdminUsersIdBan(user.id!, { ban: user.isActive });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
      toast.success(user.isActive ? `Đã ban @${user.username}` : `Đã mở ban @${user.username}`);
    } catch { toast.error('Thao tác thất bại'); } finally { setActionId(null); }
  };

  const handleChangeRole = async (user: AdminUserDto) => {
    const newRole = user.role === 'Admin' ? 'Member' : 'Admin';
    if (!confirm(`Đổi role của @${user.username} thành ${newRole}?`)) return;
    setActionId(Number(user.id!));
    try {
      await api.putApiAdminUsersIdRole(user.id!, { role: newRole });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      toast.success(`Đã đổi role @${user.username} thành ${newRole}`);
    } catch { toast.error('Đổi role thất bại'); } finally { setActionId(null); }
  };

  const handleDelete = async (user: AdminUserDto) => {
    if (!confirm(`Xóa vĩnh viễn @${user.username}? Hành động này không thể hoàn tác.`)) return;
    setActionId(Number(user.id!));
    try {
      await api.deleteApiAdminUsersId(user.id!);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setTotal(t => t - 1);
      toast.success(`Đã xóa @${user.username}`);
    } catch { toast.error('Xóa thất bại'); } finally { setActionId(null); }
  };

  const handleResetPassword = async () => {
    if (!resetPwUser || newPassword.length < 6) return;
    try {
      await api.putApiAdminUsersIdResetPassword(resetPwUser.id!, { newPassword });
      toast.success(`Đã đặt lại mật khẩu cho @${resetPwUser.username}`);
      setResetPwUser(null);
      setNewPassword('');
    } catch { toast.error('Đặt lại mật khẩu thất bại'); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold font-headline text-on-surface">Người dùng</h1>
        <p className="text-outline text-sm mt-1">{total.toLocaleString()} tài khoản</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input
            className="w-full pl-9 pr-4 py-2.5 border border-outline-variant/20 rounded-xl text-sm focus:outline-none focus:border-primary/50 bg-surface-container-lowest text-on-surface"
            placeholder="Tìm username, email, tên..."
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <select className="px-4 py-2.5 border border-outline-variant/20 rounded-xl text-sm focus:outline-none bg-surface-container-lowest text-on-surface"
          value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); fetchUsers(q, e.target.value, statusFilter, 1); }}>
          <option value="">Tất cả role</option>
          <option value="Member">Member</option>
          <option value="Admin">Admin</option>
        </select>
        <select className="px-4 py-2.5 border border-outline-variant/20 rounded-xl text-sm focus:outline-none bg-surface-container-lowest text-on-surface"
          value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); fetchUsers(q, roleFilter, e.target.value, 1); }}>
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="banned">Bị ban</option>
        </select>
        <button onClick={handleSearch} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90">
          Tìm kiếm
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Loader className="w-6 h-6 animate-spin text-primary" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-outline">Không tìm thấy người dùng nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant/10">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Người dùng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Email</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Role</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Trạng thái</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Bài viết</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Followers</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Ngày tạo</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/40/40`} alt="" className="w-9 h-9 rounded-full object-cover" referrerPolicy="no-referrer" />
                      <div>
                        <p className="font-semibold text-on-surface">{user.fullName || user.username}</p>
                        <p className="text-xs text-outline">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-on-surface-variant">{user.email}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.role === 'Admin' ? 'bg-primary/10 text-primary' : 'bg-surface-container text-outline'}`}>{user.role}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.isActive ? 'Hoạt động' : 'Bị ban'}</span>
                  </td>
                  <td className="px-4 py-4 text-center text-on-surface-variant">{user.postCount ?? 0}</td>
                  <td className="px-4 py-4 text-center text-on-surface-variant">{user.followerCount ?? 0}</td>
                  <td className="px-4 py-4 text-outline text-xs whitespace-nowrap">{timeAgo(user.createdAt?.toString())}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {actionId === user.id ? (
                        <Loader className="w-4 h-4 animate-spin text-outline" />
                      ) : (
                        <>
                          <button onClick={() => setDetailUser(user)} title="Xem chi tiết" className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => { setResetPwUser(user); setNewPassword(''); }} title="Đặt lại mật khẩu" className="p-2 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors"><KeyRound className="w-4 h-4" /></button>
                          <button onClick={() => handleBan(user)} title={user.isActive ? 'Ban' : 'Mở ban'} className={`p-2 rounded-lg transition-colors ${user.isActive ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10'}`}>
                            {user.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleChangeRole(user)} title={user.role === 'Admin' ? 'Đổi Member' : 'Đổi Admin'} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"><Shield className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(user)} title="Xóa vĩnh viễn" className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10">
            <p className="text-sm text-outline">Trang {page} / {totalPages} ({total} kết quả)</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg hover:bg-surface-container disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg hover:bg-surface-container disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDetailUser(null)}>
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 flex items-center justify-between border-b border-outline-variant/10">
              <h2 className="font-bold text-lg text-on-surface">Chi tiết người dùng</h2>
              <button onClick={() => setDetailUser(null)} className="p-1.5 hover:bg-surface-container rounded-lg"><X className="w-5 h-5 text-outline" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <img src={detailUser.avatarUrl || `https://picsum.photos/seed/${detailUser.id}/80/80`} alt="" className="w-16 h-16 rounded-full object-cover" referrerPolicy="no-referrer" />
                <div>
                  <h3 className="font-bold text-on-surface text-lg">{detailUser.fullName || detailUser.username}</h3>
                  <p className="text-outline text-sm">@{detailUser.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-outline">Email:</span><p className="font-medium text-on-surface-variant">{detailUser.email}</p></div>
                <div><span className="text-outline">Role:</span><p className="font-medium text-on-surface-variant">{detailUser.role}</p></div>
                <div><span className="text-outline">Trạng thái:</span><p className={`font-medium ${detailUser.isActive ? 'text-green-600' : 'text-red-600'}`}>{detailUser.isActive ? 'Hoạt động' : 'Bị ban'}</p></div>
                <div><span className="text-outline">Ngày tạo:</span><p className="font-medium text-on-surface-variant">{timeAgo(detailUser.createdAt?.toString())}</p></div>
                <div><span className="text-outline">Bài viết:</span><p className="font-medium text-on-surface-variant">{detailUser.postCount ?? 0}</p></div>
                <div><span className="text-outline">Followers:</span><p className="font-medium text-on-surface-variant">{detailUser.followerCount ?? 0}</p></div>
                <div><span className="text-outline">Following:</span><p className="font-medium text-on-surface-variant">{detailUser.followingCount ?? 0}</p></div>
                <div><span className="text-outline">Bình luận:</span><p className="font-medium text-on-surface-variant">{detailUser.commentCount ?? 0}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetPwUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setResetPwUser(null)}>
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 flex items-center justify-between border-b border-outline-variant/10">
              <h2 className="font-bold text-on-surface">Đặt lại mật khẩu</h2>
              <button onClick={() => setResetPwUser(null)} className="p-1.5 hover:bg-surface-container rounded-lg"><X className="w-5 h-5 text-outline" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-outline">Đặt mật khẩu mới cho <span className="font-bold text-on-surface">@{resetPwUser.username}</span></p>
              <input
                type="password"
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                className="w-full px-4 py-3 border border-outline-variant/20 rounded-xl text-sm focus:outline-none focus:border-primary/50 bg-surface-container-low text-on-surface"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                minLength={6}
              />
              <button
                onClick={handleResetPassword}
                disabled={newPassword.length < 6}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                Đặt lại mật khẩu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersView;
