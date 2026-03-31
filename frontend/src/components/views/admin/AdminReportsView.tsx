import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader, ChevronLeft, ChevronRight, Clock, Trash2, AlertTriangle } from 'lucide-react';
import { getSocialNetworkApiV1, type ReportDto } from '../../../api/api-generated';
import { timeAgo } from '../../../utils/time';
import toast from 'react-hot-toast';

const reasonLabel: Record<string, string> = {
  spam:     'Spam',
  hate:     'Ngôn từ thù địch',
  nude:     'Nội dung khiêu dâm',
  violence: 'Bạo lực',
  other:    'Khác',
};

const AdminReportsView = () => {
  const api = getSocialNetworkApiV1();
  const [reports,  setReports]  = useState<ReportDto[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [status,   setStatus]   = useState('Pending');
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [actionId, setActionId] = useState<number | null>(null);
  const pageSize = 20;

  const fetchReports = (s = status, p = page) => {
    setLoading(true);
    api.getApiAdminReports({ status: s || undefined, page: p, pageSize })
      .then(res => {
        if (res.success && res.data) {
          setReports(res.data.items ?? []);
          setTotal(Number(res.data.totalCount ?? 0));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = (s: string) => { setStatus(s); setPage(1); fetchReports(s, 1); };

  const handleResolve = async (report: ReportDto) => {
    setActionId(Number(report.id!));
    try {
      await api.putApiAdminReportsIdResolve(report.id!);
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'Resolved', resolvedAt: new Date().toISOString() } : r));
      toast.success('Đã đánh dấu đã xử lý');
    } catch { toast.error('Thao tác thất bại'); } finally { setActionId(null); }
  };

  const handleDelete = async (report: ReportDto) => {
    if (!confirm(`Xóa báo cáo #${report.id}?`)) return;
    setActionId(Number(report.id!));
    try {
      await api.deleteApiAdminReportsId(report.id!);
      setReports(prev => prev.filter(r => r.id !== report.id));
      setTotal(t => t - 1);
      toast.success('Đã xóa báo cáo');
    } catch { toast.error('Xóa thất bại'); } finally { setActionId(null); }
  };

  const handleDeletePost = async (report: ReportDto) => {
    if (!report.targetPostId) return;
    if (!confirm(`Xóa bài viết #${report.targetPostId} vi phạm và đánh dấu báo cáo đã xử lý?`)) return;
    setActionId(Number(report.id!));
    try {
      await api.deleteApiAdminPostsId(report.targetPostId);
      await api.putApiAdminReportsIdResolve(report.id!);
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'Resolved', resolvedAt: new Date().toISOString() } : r));
      toast.success('Đã xóa bài viết vi phạm và xử lý báo cáo.');
    } catch { toast.error('Thao tác thất bại.'); } finally { setActionId(null); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold font-headline text-on-surface">Báo cáo vi phạm</h1>
        <p className="text-outline text-sm mt-1">{total.toLocaleString()} báo cáo</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {[{ key: 'Pending', label: 'Chờ xử lý' }, { key: 'Resolved', label: 'Đã xử lý' }, { key: '', label: 'Tất cả' }].map(item => (
          <button
            key={item.key}
            onClick={() => handleStatusChange(item.key)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all
              ${status === item.key ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-lowest text-outline border border-outline-variant/20 hover:bg-surface-container-low'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Loader className="w-6 h-6 animate-spin text-primary" /></div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-outline">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Không có báo cáo nào</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant/10">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Người báo cáo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Đối tượng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Lý do</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Mô tả</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Trạng thái</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Thời gian</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-outline uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {reports.map(report => (
                <React.Fragment key={report.id}>
                  <tr className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-on-surface-variant">@{report.reporterUsername}</td>
                    <td className="px-4 py-4">
                      {report.targetUsername ? (
                        <span className="text-blue-600">@{report.targetUsername}</span>
                      ) : report.targetPostId ? (
                        <div>
                          <span className="text-xs text-outline block">Bài viết #{report.targetPostId}</span>
                          <p className="text-on-surface-variant text-xs line-clamp-2 mt-0.5">{report.targetPostContent}</p>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                        {reasonLabel[report.reason ?? ''] ?? report.reason}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-outline text-xs max-w-[180px]">
                      <p className="line-clamp-2">{report.detail || '—'}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {report.status === 'Resolved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3" /> Đã xử lý
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                          <Clock className="w-3 h-3" /> Chờ xử lý
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-outline text-xs whitespace-nowrap">{timeAgo(report.createdAt?.toString())}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {report.status !== 'Resolved' && (
                          actionId === report.id ? (
                            <Loader className="w-4 h-4 animate-spin text-outline" />
                          ) : (
                            <>
                              <button
                                onClick={() => handleResolve(report)}
                                className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                              >
                                Đánh dấu đã xử lý
                              </button>
                              {report.targetPostId && (
                                <button
                                  onClick={() => handleDeletePost(report)}
                                  className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
                                  title="Xóa bài viết vi phạm"
                                >
                                  <AlertTriangle className="w-3 h-3" /> Xóa bài
                                </button>
                              )}
                            </>
                          )
                        )}
                        {actionId !== report.id && (
                          <button onClick={() => handleDelete(report)} title="Xóa báo cáo"
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10">
            <p className="text-sm text-outline">Trang {page} / {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg hover:bg-surface-container disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg hover:bg-surface-container disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportsView;
