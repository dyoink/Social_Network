import React, { useState, useEffect } from 'react';
import { Search, Trash2, Loader, ChevronLeft, ChevronRight, Reply } from 'lucide-react';
import { getSocialNetworkApiV1, type AdminCommentDto } from '../../../api/api-generated';
import { timeAgo } from '../../../utils/time';
import toast from 'react-hot-toast';

const AdminCommentsView = () => {
  const api = getSocialNetworkApiV1();
  const [comments, setComments] = useState<AdminCommentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [postIdFilter, setPostIdFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionId, setActionId] = useState<number | null>(null);
  const pageSize = 20;

  const fetchComments = (searchQ = q, pId = postIdFilter, p = page) => {
    setLoading(true);
    api.getApiAdminComments({ q: searchQ || undefined, postId: pId ? Number(pId) : undefined, page: p, pageSize })
      .then(res => {
        if (res.success && res.data) {
          setComments(res.data.items ?? []);
          setTotal(Number(res.data.totalCount ?? 0));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComments(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => { setPage(1); fetchComments(q, postIdFilter, 1); };

  const handleDelete = async (comment: AdminCommentDto) => {
    if (!confirm(`Xóa bình luận của @${comment.authorUsername}?`)) return;
    setActionId(Number(comment.id!));
    try {
      await api.deleteApiAdminCommentsId(comment.id!);
      setComments(prev => prev.filter(c => c.id !== comment.id));
      setTotal(t => t - 1);
      toast.success('Đã xóa bình luận');
    } catch { toast.error('Xóa thất bại'); } finally { setActionId(null); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold font-headline text-on-surface">Bình luận</h1>
        <p className="text-outline text-sm mt-1">{total.toLocaleString()} bình luận</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input className="w-full pl-9 pr-4 py-2.5 border border-outline-variant/20 rounded-xl text-sm focus:outline-none focus:border-primary/50 bg-surface-container-lowest text-on-surface"
            placeholder="Tìm nội dung hoặc tên tác giả..." value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        </div>
        <input
          type="number"
          placeholder="Post ID"
          className="w-28 px-4 py-2.5 border border-outline-variant/20 rounded-xl text-sm focus:outline-none focus:border-primary/50 bg-surface-container-lowest text-on-surface"
          value={postIdFilter}
          onChange={e => setPostIdFilter(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90">Tìm kiếm</button>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Loader className="w-6 h-6 animate-spin text-primary" /></div>
        ) : comments.length === 0 ? (
          <div className="text-center py-16 text-outline">Không tìm thấy bình luận nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant/10">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Tác giả</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Nội dung</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Bài viết gốc</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Loại</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Thời gian</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {comments.map(comment => (
                <tr key={comment.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <img src={comment.authorAvatarUrl || `https://picsum.photos/seed/${comment.id}/32/32`} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                      <span className="font-medium text-on-surface-variant">@{comment.authorUsername}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 max-w-xs"><p className="text-on-surface-variant line-clamp-2">{comment.content}</p></td>
                  <td className="px-4 py-4 max-w-[180px]">
                    <p className="text-outline text-xs line-clamp-2">Post #{comment.postId}: {comment.postContentPreview}</p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {comment.parentId ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700"><Reply className="w-3 h-3" /> Reply</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-surface-container text-outline">Gốc</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-outline text-xs whitespace-nowrap">{timeAgo(comment.createdAt?.toString())}</td>
                  <td className="px-6 py-4 text-right">
                    {actionId === comment.id ? (
                      <Loader className="w-4 h-4 animate-spin text-outline ml-auto" />
                    ) : (
                      <button onClick={() => handleDelete(comment)} title="Xóa bình luận"
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
    </div>
  );
};

export default AdminCommentsView;
