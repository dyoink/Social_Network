import React, { useState, useEffect } from 'react';
import { Search, Ban, CheckCircle, Shield, Trash2, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSocialNetworkApiV1, type AdminUserDto } from '../../../api/api-generated';

const AdminUsersView = () => {
  const api = getSocialNetworkApiV1();
  const [users,    setUsers]    = useState<AdminUserDto[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [q,        setQ]        = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [actionId, setActionId] = useState<number | null>(null);
  const pageSize = 20;

  const fetchUsers = (searchQ = q, role = roleFilter, p = page) => {
    setLoading(true);
    api.getApiAdminUsers({ q: searchQ || undefined, role: role || undefined, page: p, pageSize })
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

  const handleSearch = () => { setPage(1); fetchUsers(q, roleFilter, 1); };

  const handleBan = async (user: AdminUserDto) => {
    setActionId(Number(user.id!));
    try {
      await api.putApiAdminUsersIdBan(user.id!, { ban: user.isActive });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
    } catch { /* ignore */ } finally { setActionId(null); }
  };

  const handleChangeRole = async (user: AdminUserDto) => {
    const newRole = user.role === 'Admin' ? 'Member' : 'Admin';
    if (!confirm(`Đổi role của @${user.username} thành ${newRole}?`)) return;
    setActionId(Number(user.id!));
    try {
      await api.putApiAdminUsersIdRole(user.id!, { role: newRole });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch { /* ignore */ } finally { setActionId(null); }
  };

  const handleDelete = async (user: AdminUserDto) => {
    if (!confirm(`Xóa vĩnh viễn @${user.username}? Hành động này không thể hoàn tác.`)) return;
    setActionId(Number(user.id!));
    try {
      await api.deleteApiAdminUsersId(user.id!);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setTotal(t => t - 1);
    } catch { /* ignore */ } finally { setActionId(null); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold font-headline text-gray-900">Người dùng</h1>
        <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} tài khoản</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/50"
            placeholder="Tìm username, email, tên..."
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <select
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); fetchUsers(q, e.target.value, 1); }}
        >
          <option value="">Tất cả role</option>
          <option value="Member">Member</option>
          <option value="Admin">Admin</option>
        </select>
        <button onClick={handleSearch} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90">
          Tìm kiếm
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Người dùng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bài viết</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => (
                <React.Fragment key={user.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/40/40`}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{user.fullName || user.username}</p>
                          <p className="text-xs text-gray-400">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{user.email}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.role === 'Admin' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.isActive ? 'Hoạt động' : 'Bị ban'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-600">{user.postCount ?? 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {actionId === user.id ? (
                          <Loader className="w-4 h-4 animate-spin text-gray-400" />
                        ) : (
                          <>
                            <button
                              onClick={() => handleBan(user)}
                              title={user.isActive ? 'Ban user' : 'Mở ban'}
                              className={`p-2 rounded-lg transition-colors ${user.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                            >
                              {user.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleChangeRole(user)}
                              title={user.role === 'Admin' ? 'Đổi thành Member' : 'Đổi thành Admin'}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              title="Xóa vĩnh viễn"
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Trang {page} / {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersView;
