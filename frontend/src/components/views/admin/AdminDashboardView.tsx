import { useState, useEffect } from 'react';
import { Users, FileText, MessageSquare, Flag, TrendingUp, RefreshCw, Heart, UserPlus, Activity } from 'lucide-react';
import { getSocialNetworkApiV1, type AdminStatsDto, type GrowthChartDto } from '../../../api/api-generated';
import StatCard from '../../admin/StatCard';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AdminDashboardView = () => {
  const api = getSocialNetworkApiV1();
  const [stats, setStats] = useState<AdminStatsDto | null>(null);
  const [chart, setChart] = useState<GrowthChartDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartDays, setChartDays] = useState(30);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.getApiAdminStats(),
      api.getApiAdminGrowthChart({ days: chartDays }),
    ])
      .then(([statsRes, chartRes]) => {
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (chartRes.success && chartRes.data) setChart(chartRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, [chartDays]); // eslint-disable-line react-hooks/exhaustive-deps

  const mergedChartData = chart
    ? chart.users?.map((u, i) => ({
        date: u.date?.slice(5) ?? '',
        'Người dùng': u.count ?? 0,
        'Bài viết': chart.posts?.[i]?.count ?? 0,
        'Bình luận': chart.comments?.[i]?.count ?? 0,
      })) ?? []
    : [];

  const pieData = stats
    ? [
        { name: 'Bài viết', value: Number(stats.totalPosts ?? 0) },
        { name: 'Bình luận', value: Number(stats.totalComments ?? 0) },
        { name: 'Tin nhắn', value: Number(stats.totalMessages ?? 0) },
        { name: 'Follows', value: Number(stats.totalFollows ?? 0) },
      ].filter(d => d.value > 0)
    : [];

  const todayBarData = stats
    ? [
        { name: 'Users mới', value: stats.newUsersToday ?? 0 },
        { name: 'Bài viết', value: stats.newPostsToday ?? 0 },
        { name: 'Bình luận', value: stats.newCommentsToday ?? 0 },
        { name: 'Báo cáo', value: stats.pendingReports ?? 0 },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-on-surface">Tổng quan</h1>
          <p className="text-outline text-sm mt-1">Thống kê toàn bộ nền tảng</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-outline bg-surface-container-lowest border border-outline-variant/20 rounded-xl hover:bg-surface-container-low transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {loading && !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-28 bg-surface-container animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatCard label="Tổng người dùng" value={stats.totalUsers ?? 0} sub={`+${stats.newUsersToday ?? 0} hôm nay`} color="primary" icon={<Users className="w-6 h-6" />} />
            <StatCard label="Tổng bài viết" value={stats.totalPosts ?? 0} sub={`+${stats.newPostsToday ?? 0} hôm nay`} color="green" icon={<FileText className="w-6 h-6" />} />
            <StatCard label="Tổng bình luận" value={stats.totalComments ?? 0} sub={`+${stats.newCommentsToday ?? 0} hôm nay`} color="primary" icon={<MessageSquare className="w-6 h-6" />} />
            <StatCard label="Tổng tin nhắn" value={stats.totalMessages ?? 0} color="orange" icon={<Heart className="w-6 h-6" />} />
            <StatCard label="Tổng follows" value={stats.totalFollows ?? 0} color="green" icon={<UserPlus className="w-6 h-6" />} />
            <StatCard label="Báo cáo chờ" value={stats.pendingReports ?? 0} sub={Number(stats.pendingReports ?? 0) > 0 ? 'Cần kiểm tra' : 'Ổn định'} color={Number(stats.pendingReports ?? 0) > 0 ? 'red' : 'green'} icon={<Flag className="w-6 h-6" />} />
            <StatCard label="User mới hôm nay" value={stats.newUsersToday ?? 0} color="green" icon={<TrendingUp className="w-6 h-6" />} />
            <StatCard label="Bài viết mới hôm nay" value={stats.newPostsToday ?? 0} color="orange" icon={<TrendingUp className="w-6 h-6" />} />
            <StatCard label="B.luận mới hôm nay" value={stats.newCommentsToday ?? 0} color="primary" icon={<MessageSquare className="w-6 h-6" />} />
            <StatCard label="User hoạt động (7d)" value={stats.activeUsersWeek ?? 0} color="primary" icon={<Activity className="w-6 h-6" />} />
          </div>

          {/* Growth area chart */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h3 className="font-bold text-on-surface text-lg">Biểu đồ tăng trưởng</h3>
              <div className="flex gap-2">
                {[7, 14, 30, 60].map(d => (
                  <button key={d} onClick={() => setChartDays(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${chartDays === d ? 'bg-primary text-white' : 'bg-surface-container text-outline hover:bg-surface-container-high'}`}
                  >{d} ngày</button>
                ))}
              </div>
            </div>
            <div className="h-72 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mergedChartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                    <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                    <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-outline)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-outline)' }} tickLine={false} axisLine={false} width={35} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)', borderRadius: 12, fontSize: 12, color: 'var(--color-on-surface)' }} itemStyle={{ color: 'var(--color-on-surface)' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Người dùng" stroke="#3b82f6" strokeWidth={2} fill="url(#colorUsers)" />
                  <Area type="monotone" dataKey="Bài viết" stroke="#10b981" strokeWidth={2} fill="url(#colorPosts)" />
                  <Area type="monotone" dataKey="Bình luận" stroke="#f59e0b" strokeWidth={2} fill="url(#colorComments)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar + Pie charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10">
              <h3 className="font-bold text-on-surface-variant mb-4">Hoạt động hôm nay</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={todayBarData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-outline)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-outline)' }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)', borderRadius: 12, fontSize: 12, color: 'var(--color-on-surface)' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {todayBarData.map((_, idx) => (<Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10">
              <h3 className="font-bold text-on-surface-variant mb-4">Phân bố nội dung</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 11 }}
                    >
                      {pieData.map((_, idx) => (<Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)', borderRadius: 12, fontSize: 12, color: 'var(--color-on-surface)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Ratios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10">
              <h3 className="font-bold text-on-surface-variant mb-3">Tỉ lệ tương tác</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-outline">Bình luận / Bài viết</span><span className="font-semibold text-on-surface-variant">{Number(stats.totalPosts ?? 0) > 0 ? (Number(stats.totalComments ?? 0) / Number(stats.totalPosts ?? 1)).toFixed(1) : '—'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-outline">Tin nhắn / User</span><span className="font-semibold text-on-surface-variant">{Number(stats.totalUsers ?? 0) > 0 ? (Number(stats.totalMessages ?? 0) / Number(stats.totalUsers ?? 1)).toFixed(1) : '—'}</span></div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10">
              <h3 className="font-bold text-on-surface-variant mb-3">Tỉ lệ follow</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-outline">Follow / User</span><span className="font-semibold text-on-surface-variant">{Number(stats.totalUsers ?? 0) > 0 ? (Number(stats.totalFollows ?? 0) / Number(stats.totalUsers ?? 1)).toFixed(1) : '—'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-outline">Active / Total</span><span className="font-semibold text-on-surface-variant">{Number(stats.totalUsers ?? 0) > 0 ? ((Number(stats.activeUsersWeek ?? 0) / Number(stats.totalUsers ?? 1)) * 100).toFixed(1) + '%' : '—'}</span></div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10">
              <h3 className="font-bold text-on-surface-variant mb-3">Báo cáo</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-outline">Báo cáo / 100 bài</span><span className="font-semibold text-on-surface-variant">{Number(stats.totalPosts ?? 0) > 0 ? ((Number(stats.pendingReports ?? 0) / Number(stats.totalPosts ?? 1)) * 100).toFixed(2) : '—'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-outline">Chờ xử lý</span><span className={`font-semibold ${Number(stats.pendingReports ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>{stats.pendingReports ?? 0}</span></div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-outline text-center py-12">Không tải được thống kê.</p>
      )}
    </div>
  );
};

export default AdminDashboardView;
