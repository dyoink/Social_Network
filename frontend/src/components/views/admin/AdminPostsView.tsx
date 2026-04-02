import React, { useState, useEffect } from 'react';
import { Search, Trash2, Loader, Flag, Eye, X, Image } from 'lucide-react';
import { getSocialNetworkApiV1, type AdminPostDto } from '../../../api/api-generated';
import { timeAgo } from '../../../utils/time';
import toast from 'react-hot-toast';
import Pagination from '../../ui/Pagination';

const AdminPostsView = () => {
  const api = getSocialNetworkApiV1();
  const [posts, setPosts] = useState<AdminPostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [detailPost, setDetailPost] = useState<AdminPostDto | null>(null);
  const pageSize = 20;
  const [sortBy, setSortBy] = useState('createdat');
  const [isDescending, setIsDescending] = useState(true);

  const fetchPosts = (searchQ = q, sort = sortBy, desc = isDescending, p = page) => {
    setLoading(true);
    api.getApiAdminPosts({ 
      q: searchQ || undefined, 
      sortBy: sort,
      isDescending: desc ? 'true' : 'false',
      page: p, 
      pageSize 
    })
      .then(res => {
        if (res.success && res.data) {
          setPosts(res.data.items ?? []);
          setTotal(Number(res.data.totalCount ?? 0));
          setSelectedIds([]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, [page, sortBy, isDescending]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => { setPage(1); fetchPosts(q, sortBy, isDescending, 1); };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setIsDescending(!isDescending);
    } else {
      setSortBy(field);
      setIsDescending(true);
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="ml-1 opacity-20">↕</span>;
    return <span className="ml-1">{isDescending ? '↓' : '↑'}</span>;
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === posts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(posts.map(p => p.id!).filter(Boolean));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Xóa vĩnh viễn ${selectedIds.length} bài viết đã chọn? Hành động này không thể hoàn tác.`)) return;
    setIsBulkLoading(true);
    try {
      await api.deleteApiAdminPostsBulkDelete(selectedIds);
      setPosts(prev => prev.filter(p => !selectedIds.includes(p.id!)));
      setTotal(t => t - selectedIds.length);
      toast.success(`Đã xóa ${selectedIds.length} bài viết`);
      setSelectedIds([]);
    } catch {
      toast.error('Xóa hàng loạt thất bại');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleDelete = async (post: AdminPostDto) => {
    if (!confirm(`Xóa bài viết của @${post.authorUsername}? Hành động không thể hoàn tác.`)) return;
    setActionId(Number(post.id!));
    try {
      await api.deleteApiAdminPostsId(post.id!);
      setPosts(prev => prev.filter(p => p.id !== post.id));
      setTotal(t => t - 1);
      toast.success('Đã xóa bài viết');
      if (detailPost?.id === post.id) setDetailPost(null);
    } catch { toast.error('Xóa thất bại'); } finally { setActionId(null); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold font-headline text-on-surface">Bài viết</h1>
        <p className="text-outline text-sm mt-1">{total.toLocaleString()} bài viết</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input className="w-full pl-9 pr-4 py-2.5 border border-outline-variant/20 rounded-xl text-sm focus:outline-none focus:border-primary/50 bg-surface-container-lowest text-on-surface"
            placeholder="Tìm nội dung hoặc tên tác giả..." value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        </div>
        <button onClick={handleSearch} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90">Tìm kiếm</button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 bg-primary/5 border border-primary/20 rounded-2xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-primary">Đã chọn {selectedIds.length} bài viết</span>
            <button onClick={() => setSelectedIds([])} className="text-xs text-outline hover:underline">Hủy chọn</button>
          </div>
          <div className="flex items-center gap-2">
            {isBulkLoading ? (
              <Loader className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa vĩnh viễn
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Loader className="w-6 h-6 animate-spin text-primary" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-outline">Không tìm thấy bài viết nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant/10">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="checkbox-custom"
                    checked={posts.length > 0 && selectedIds.length === posts.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th 
                  className="text-left px-2 py-3 text-xs font-semibold text-outline uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('username')}
                >
                  Tác giả <SortIcon field="username" />
                </th>
                <th 
                  className="text-left px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('content')}
                >
                  Nội dung <SortIcon field="content" />
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Ảnh</th>
                <th 
                  className="text-center px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('likescount')}
                >
                  Like <SortIcon field="likescount" />
                </th>
                <th 
                  className="text-center px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('commentscount')}
                >
                  Bình luận <SortIcon field="commentscount" />
                </th>
                <th 
                  className="text-center px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('reportcount')}
                >
                  Báo cáo <SortIcon field="reportcount" />
                </th>
                <th 
                  className="text-left px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('createdat')}
                >
                  Ngày đăng <SortIcon field="createdat" />
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {posts.map(post => (
                <tr 
                  key={post.id} 
                  className={`hover:bg-surface-container-low/50 transition-colors cursor-pointer ${selectedIds.includes(post.id!) ? 'bg-primary/5' : ''} ${Number(post.reportCount ?? 0) > 0 ? 'bg-red-50/30 dark:bg-red-500/5' : ''}`}
                  onClick={() => toggleSelect(post.id!)}
                >
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="checkbox-custom"
                      checked={selectedIds.includes(post.id!)}
                      onChange={() => toggleSelect(post.id!)}
                    />
                  </td>
                  <td className="px-2 py-4">
                    <div className="flex items-center gap-2">
                      <img src={post.authorAvatarUrl || `https://picsum.photos/seed/${post.id}/32/32`} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                      <span className="font-medium text-on-surface-variant">@{post.authorUsername}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 max-w-xs"><p className="text-on-surface-variant line-clamp-2">{post.content}</p></td>
                  <td className="px-4 py-4 text-center">{post.imageUrl ? <Image className="w-4 h-4 text-primary mx-auto" /> : <span className="text-outline">—</span>}</td>
                  <td className="px-4 py-4 text-center text-on-surface-variant">{post.likesCount ?? 0}</td>
                  <td className="px-4 py-4 text-center text-on-surface-variant">{post.commentsCount ?? 0}</td>
                  <td className="px-4 py-4 text-center">
                    {Number(post.reportCount ?? 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700"><Flag className="w-3 h-3" /> {post.reportCount}</span>
                    ) : <span className="text-outline">—</span>}
                  </td>
                  <td className="px-4 py-4 text-outline text-xs whitespace-nowrap">{timeAgo(post.createdAt?.toString())}</td>
                  <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {actionId === post.id ? <Loader className="w-4 h-4 animate-spin text-outline" /> : (
                        <>
                          <button onClick={() => setDetailPost(post)} title="Xem chi tiết" className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(post)} title="Xóa bài viết" className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={total}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Detail modal */}
      {detailPost && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDetailPost(null)}>
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 flex items-center justify-between border-b border-outline-variant/10">
              <h2 className="font-bold text-lg text-on-surface">Chi tiết bài viết</h2>
              <button onClick={() => setDetailPost(null)} className="p-1.5 hover:bg-surface-container rounded-lg"><X className="w-5 h-5 text-outline" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-3">
                <img src={detailPost.authorAvatarUrl || `https://picsum.photos/seed/${detailPost.id}/40/40`} alt="" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                <div>
                  <p className="font-semibold text-on-surface">@{detailPost.authorUsername}</p>
                  <p className="text-xs text-outline">{timeAgo(detailPost.createdAt?.toString())}</p>
                </div>
              </div>
              <p className="text-on-surface-variant whitespace-pre-wrap">{detailPost.content}</p>
              {detailPost.imageUrl && <img src={detailPost.imageUrl} alt="" className="w-full rounded-xl object-cover max-h-80" referrerPolicy="no-referrer" />}
              <div className="flex gap-6 text-sm text-outline">
                <span>❤️ {detailPost.likesCount ?? 0} likes</span>
                <span>💬 {detailPost.commentsCount ?? 0} comments</span>
                {Number(detailPost.reportCount ?? 0) > 0 && <span className="text-red-600">🚩 {detailPost.reportCount} báo cáo</span>}
              </div>
              <button onClick={() => handleDelete(detailPost)} className="w-full py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all text-sm">Xóa bài viết</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPostsView;
