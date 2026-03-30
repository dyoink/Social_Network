import { useState, useEffect } from 'react';
import { Users, FileText, MessageSquare, Flag, TrendingUp, RefreshCw } from 'lucide-react';
import { getSocialNetworkApiV1, type AdminStatsDto } from '../../../api/api-generated';
import StatCard from '../../admin/StatCard';

const AdminDashboardView = () => {
  const api = getSocialNetworkApiV1();
  const [stats, setStats]     = useState<AdminStatsDto | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    api.getApiAdminStats()
      .then(res => { if (res.success && res.data) setStats(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-gray-900">Tổng quan</h1>
          <p className="text-gray-500 text-sm mt-1">Thống kê toàn bộ nền tảng</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {loading && !stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              label="Tổng người dùng"
              value={stats.totalUsers ?? 0}
              sub={`+${stats.newUsersToday ?? 0} hôm nay`}
              color="primary"
              icon={<Users className="w-6 h-6" />}
            />
            <StatCard
              label="Tổng bài viết"
              value={stats.totalPosts ?? 0}
              sub={`+${stats.newPostsToday ?? 0} hôm nay`}
              color="green"
              icon={<FileText className="w-6 h-6" />}
            />
            <StatCard
              label="Tổng bình luận"
              value={stats.totalComments ?? 0}
              color="primary"
              icon={<MessageSquare className="w-6 h-6" />}
            />
            <StatCard
              label="Báo cáo chờ xử lý"
              value={stats.pendingReports ?? 0}
              sub={stats.pendingReports ? 'Cần kiểm tra ngay' : 'Không có báo cáo mới'}
              color={(Number(stats.pendingReports ?? 0)) > 0 ? 'red' : 'green'}
              icon={<Flag className="w-6 h-6" />}
            />
            <StatCard
              label="Người dùng mới hôm nay"
              value={stats.newUsersToday ?? 0}
              color="green"
              icon={<TrendingUp className="w-6 h-6" />}
            />
            <StatCard
              label="Bài viết mới hôm nay"
              value={stats.newPostsToday ?? 0}
              color="orange"
              icon={<TrendingUp className="w-6 h-6" />}
            />
          </div>

          {/* Quick info cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">Hoạt động hôm nay</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Người dùng mới</span>
                  <span className="font-semibold text-gray-800">{stats.newUsersToday ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bài viết mới</span>
                  <span className="font-semibold text-gray-800">{stats.newPostsToday ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Báo cáo chờ</span>
                  <span className={`font-semibold ${(Number(stats.pendingReports ?? 0)) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {stats.pendingReports ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">Tỉ lệ tổng quan</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bình luận / Bài viết</span>
                  <span className="font-semibold text-gray-800">
                    {(Number(stats.totalPosts ?? 0)) > 0 ? ((Number(stats.totalComments ?? 0)) / (Number(stats.totalPosts ?? 1))).toFixed(1) : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Báo cáo / 100 bài</span>
                  <span className="font-semibold text-gray-800">
                    {(Number(stats.totalPosts ?? 0)) > 0 ? (((Number(stats.pendingReports ?? 0)) / (Number(stats.totalPosts ?? 1))) * 100).toFixed(2) : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-400 text-center py-12">Không tải được thống kê.</p>
      )}
    </div>
  );
};

export default AdminDashboardView;
