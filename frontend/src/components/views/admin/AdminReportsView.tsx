import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { getSocialNetworkApiV1, type ReportDto } from '../../../api/api-generated';
import { timeAgo } from '../../../utils/time';

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
    } catch { /* ignore */ } finally { setActionId(null); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold font-headline text-gray-900">Báo cáo vi phạm</h1>
        <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} báo cáo</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {[{ key: 'Pending', label: 'Chờ xử lý' }, { key: 'Resolved', label: 'Đã xử lý' }, { key: '', label: 'Tất cả' }].map(item => (
          <button
            key={item.key}
            onClick={() => handleStatusChange(item.key)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all
              ${status === item.key ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader className="w-6 h-6 animate-spin text-primary" /></div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Không có báo cáo nào</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Người báo cáo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Đối tượng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lý do</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mô tả</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời gian</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reports.map(report => (
                <React.Fragment key={report.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">@{report.reporterUsername}</td>
                    <td className="px-4 py-4">
                      {report.targetUsername ? (
                        <span className="text-blue-600">@{report.targetUsername}</span>
                      ) : report.targetPostId ? (
                        <div>
                          <span className="text-xs text-gray-400 block">Bài viết #{report.targetPostId}</span>
                          <p className="text-gray-700 text-xs line-clamp-2 mt-0.5">{report.targetPostContent}</p>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                        {reasonLabel[report.reason ?? ''] ?? report.reason}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-xs max-w-[180px]">
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
                    <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">{timeAgo(report.createdAt?.toString())}</td>
                    <td className="px-6 py-4 text-right">
                      {report.status !== 'Resolved' && (
                        actionId === report.id ? (
                          <Loader className="w-4 h-4 animate-spin text-gray-400 ml-auto" />
                        ) : (
                          <button
                            onClick={() => handleResolve(report)}
                            className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                          >
                            Đánh dấu đã xử lý
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}

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

export default AdminReportsView;
