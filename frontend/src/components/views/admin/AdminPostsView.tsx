import React, { useState, useEffect } from 'react';
import { Search, Trash2, Loader, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { getSocialNetworkApiV1, type AdminPostDto } from '../../../api/api-generated';
import { timeAgo } from '../../../utils/time';

const AdminPostsView = () => {
  const api = getSocialNetworkApiV1();
  const [posts,    setPosts]    = useState<AdminPostDto[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [q,        setQ]        = useState('');
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [actionId, setActionId] = useState<number | null>(null);
  const pageSize = 20;

  const fetchPosts = (searchQ = q, p = page) => {
    setLoading(true);
    api.getApiAdminPosts({ q: searchQ || undefined, page: p, pageSize })
      .then(res => {
        if (res.success && res.data) {
          setPosts(res.data.items ?? []);
          setTotal(Number(res.data.totalCount ?? 0));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => { setPage(1); fetchPosts(q, 1); };

  const handleDelete = async (post: AdminPostDto) => {
    if (!confirm(`Xóa bài viết của @${post.authorUsername}? Hành động không thể hoàn tác.`)) return;
    setActionId(Number(post.id!));
    try {
      await api.deleteApiAdminPostsId(post.id!);
      setPosts(prev => prev.filter(p => p.id !== post.id));
      setTotal(t => t - 1);
    } catch { /* ignore */ } finally { setActionId(null); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold font-headline text-gray-900">Bài viết</h1>
        <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} bài viết</p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/50"
            placeholder="Tìm nội dung hoặc tên tác giả..."
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
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
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tác giả</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nội dung</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Like</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bình luận</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Báo cáo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày đăng</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts.map(post => (
                <React.Fragment key={post.id}>
                  <tr className={`hover:bg-gray-50 transition-colors ${(Number(post.reportCount ?? 0)) > 0 ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={post.authorAvatarUrl || `https://picsum.photos/seed/${post.id}/32/32`}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="font-medium text-gray-800">@{post.authorUsername}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-xs">
                      <p className="text-gray-700 line-clamp-2">{post.content}</p>
                      {post.imageUrl && <span className="text-xs text-primary mt-1 block">📷 Có ảnh</span>}
                    </td>
                    <td className="px-4 py-4 text-center text-gray-600">{post.likesCount ?? 0}</td>
                    <td className="px-4 py-4 text-center text-gray-600">{post.commentsCount ?? 0}</td>
                    <td className="px-4 py-4 text-center">
                      {(Number(post.reportCount ?? 0)) > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          <Flag className="w-3 h-3" /> {post.reportCount}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">{timeAgo(post.createdAt?.toString())}</td>
                    <td className="px-6 py-4 text-right">
                      {actionId === post.id ? (
                        <Loader className="w-4 h-4 animate-spin text-gray-400 ml-auto" />
                      ) : (
                        <button
                          onClick={() => handleDelete(post)}
                          title="Xóa bài viết"
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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

export default AdminPostsView;
