import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign, ShoppingCart, Ticket, Clock,
  TrendingUp, TrendingDown, ArrowUpRight, CalendarDays, Users
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Cell
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { bookingService } from '../../services/bookingService';
import { useUserAuth } from '../../contexts/useUserAuth';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function AdminDashboard() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useUserAuth();
  const isEventAdmin = user?.role === 'event_admin';
  const isStaff = user?.role === 'staff';
  const routePrefix = isEventAdmin ? '/event-admin' : '/admin';
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic role theme for UI visual separation
  const roleTheme = isStaff
    ? {
        name: 'Nhân viên',
        welcomePrefix: 'Nhân viên',
        accentGradient: 'from-teal-500 to-emerald-600',
        accentShadow: 'shadow-teal-500/25',
        accentText: 'text-teal-500',
        textColor: 'text-teal-500 hover:text-emerald-600',
        hoverText: 'group-hover:text-teal-500',
        spinnerBorder: 'border-teal-500',
        chartColor: '#14b8a6', // Teal
        bannerGradient: 'from-[#060c0d] to-[#0b1416]',
        orbGradient: 'from-teal-500/20 to-emerald-500/10',
      }
    : isEventAdmin
      ? {
          name: 'Organizer',
          welcomePrefix: 'Event Admin',
          accentGradient: 'from-orange-500 to-rose-600',
          accentShadow: 'shadow-orange-500/25',
          accentText: 'text-orange-500',
          textColor: 'text-orange-500 hover:text-rose-600',
          hoverText: 'group-hover:text-orange-500',
          spinnerBorder: 'border-orange-500',
          chartColor: '#f97316', // Orange
          bannerGradient: 'from-[#110e15] to-[#181320]',
          orbGradient: 'from-orange-500/20 to-rose-500/10',
        }
      : {
          name: 'System Admin',
          welcomePrefix: 'Admin',
          accentGradient: 'from-indigo-600 to-violet-600',
          accentShadow: 'shadow-indigo-500/25',
          accentText: 'text-indigo-500',
          textColor: 'text-indigo-600 hover:text-violet-600',
          hoverText: 'group-hover:text-indigo-500',
          spinnerBorder: 'border-indigo-600',
          chartColor: '#6366f1', // Indigo
          bannerGradient: 'from-[#080a15] to-[#0e1122]',
          orbGradient: 'from-indigo-500/20 to-purple-500/10',
        };

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/system-stats', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          bookingService.getStats(),
          bookingService.getAllBookings({ page: 1 }),
        ]);
        setStats(statsRes.data);
        setRecentOrders(ordersRes.data.slice(0, 5));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const card = isDark
    ? 'bg-[#151929]/80 border border-white/[0.06] backdrop-blur'
    : 'bg-white border border-gray-200/60 shadow-sm';

  const getTrendData = (val: number | undefined) => {
    const num = val ?? 0;
    return {
      trend: num >= 0 ? `+${num}%` : `${num}%`,
      trendUp: num >= 0
    };
  };

  const statCards = [
    {
      label: 'Tổng doanh thu',
      value: stats ? (stats.totalRevenue >= 1000000 ? `${(stats.totalRevenue / 1000000).toFixed(2)}M` : `${(stats.totalRevenue / 1000).toFixed(0)}K`) : '—',
      unit: 'VND',
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20',
      trend: getTrendData(stats?.trends?.revenueTrend).trend,
      trendUp: getTrendData(stats?.trends?.revenueTrend).trendUp,
    },
    {
      label: 'Tổng đơn hàng',
      value: stats?.totalBookings ?? '—',
      unit: 'đơn',
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/20',
      trend: getTrendData(stats?.trends?.bookingsTrend).trend,
      trendUp: getTrendData(stats?.trends?.bookingsTrend).trendUp,
    },
    {
      label: 'Đã thanh toán',
      value: stats?.confirmedBookings ?? '—',
      unit: 'đơn',
      icon: Ticket,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/20',
      trend: getTrendData(stats?.trends?.confirmedTrend).trend,
      trendUp: getTrendData(stats?.trends?.confirmedTrend).trendUp,
    },
    {
      label: 'Đang chờ xử lý',
      value: stats?.pendingBookings ?? '—',
      unit: 'đơn',
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/20',
      trend: getTrendData(stats?.trends?.pendingTrend).trend,
      trendUp: getTrendData(stats?.trends?.pendingTrend).trendUp,
    },
  ];

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    successful: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Đã TT' },
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Chờ TT' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Thất bại' },
    refunded: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Hoàn tiền' },
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ── Welcome banner ── */}
      <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
        <div className={`rounded-2xl p-6 md:p-8 relative overflow-hidden ${isDark ? `bg-gradient-to-br ${roleTheme.bannerGradient}` : 'bg-gradient-to-br from-gray-50 to-white'} border ${isDark ? 'border-white/[0.06]' : 'border-gray-200/60'}`}>
          {/* Decorative gradient orbs */}
          <div className={`absolute top-0 right-0 w-72 h-72 bg-gradient-to-br ${roleTheme.orbGradient} rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none`} />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-500/10 to-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

          <div className="relative">
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className={`text-2xl md:text-3xl font-bold mt-1 bg-gradient-to-r ${roleTheme.accentGradient} bg-clip-text text-transparent`}>
              Xin chào, {roleTheme.welcomePrefix}! 👋
            </h1>
            <p className={`mt-2 text-sm max-w-lg ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {isEventAdmin
                ? 'Tổng quan hoạt động của các sự kiện bạn đang quản lý.'
                : 'Tổng quan hoạt động kinh doanh hôm nay. Theo dõi đơn hàng, sự kiện và vé một cách dễ dàng.'
              }
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
        {statCards.map((s, i) => (
          <motion.div
            key={i}
            {...fadeUp}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className={`${card} rounded-2xl p-5 group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} ${s.shadow} shadow-lg flex items-center justify-center text-white`}>
                <s.icon size={20} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                s.trendUp
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-red-500/10 text-red-500'
              }`}>
                {s.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {s.trend}
              </div>
            </div>
            <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="text-2xl font-bold tracking-tight">
                {loading ? (
                  <span className={`inline-block w-16 h-7 rounded-md animate-pulse ${isDark ? 'bg-white/[0.06]' : 'bg-gray-100'}`} />
                ) : s.value}
              </p>
              {!loading && <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{s.unit}</span>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Charts Section ── */}
      <motion.div
        {...fadeUp}
        transition={{ delay: 0.28, duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5"
      >
        {/* Daily Sales Area Chart */}
        <div className={`lg:col-span-2 ${card} rounded-2xl p-5`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Doanh thu & Đơn hàng (7 ngày)</h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Thống kê doanh thu thực tế và lượt đặt vé hàng ngày
              </p>
            </div>
          </div>
          <div className="h-64 w-full text-[11px]">
            {stats?.dailyStats?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.dailyStats} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={roleTheme.chartColor} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={roleTheme.chartColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"} />
                  <XAxis dataKey="dayLabel" stroke={isDark ? "#9CA3AF" : "#4B5563"} />
                  <YAxis yAxisId="left" stroke={roleTheme.chartColor} tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v} />
                  <YAxis yAxisId="right" orientation="right" stroke="#FF69B4" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#111528' : '#ffffff',
                      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
                      borderRadius: '12px',
                      color: isDark ? '#f3f4f6' : '#1f2937'
                    }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu (₫)" stroke={roleTheme.chartColor} strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area yAxisId="right" type="monotone" dataKey="bookings" name="Đơn hàng" stroke="#FF69B4" strokeWidth={2} fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">Chưa có dữ liệu thống kê</div>
            )}
          </div>
        </div>

        {/* Top Performing Events Bar Chart */}
        <div className={`${card} rounded-2xl p-5`}>
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Top sự kiện nổi bật</h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Xếp hạng theo tổng doanh thu bán vé thành công
            </p>
          </div>
          <div className="h-64 w-full text-[11px]">
            {stats?.eventStats?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.eventStats} layout="vertical" margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"} />
                  <XAxis type="number" stroke={isDark ? "#9CA3AF" : "#4B5563"} tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v} />
                  <YAxis dataKey="title" type="category" stroke={isDark ? "#9CA3AF" : "#4B5563"} tickFormatter={(v) => v.length > 8 ? `${v.slice(0, 8)}...` : v} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#111528' : '#ffffff',
                      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
                      borderRadius: '12px',
                      color: isDark ? '#f3f4f6' : '#1f2937'
                    }}
                  />
                  <Bar dataKey="revenue" name="Doanh thu" radius={[0, 4, 4, 0]}>
                    {stats.eventStats.map((_entry: any, index: number) => {
                      const colors = [roleTheme.chartColor, '#FF69B4', '#D4AF37', '#3B82F6', '#10B981'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">Chưa có doanh thu bán vé</div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Quick Actions + Recent Orders ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/* Quick Actions */}
        <motion.div {...fadeUp} transition={{ delay: 0.35, duration: 0.4 }}>
          <div className={`${card} rounded-2xl p-5 h-full`}>
            <h3 className="text-sm font-semibold mb-4">Thao tác nhanh</h3>
            <div className="space-y-2.5">
              {[
                ...(!isEventAdmin ? [{ icon: CalendarDays, label: 'Tạo sự kiện mới', color: 'from-blue-500 to-indigo-600', path: `${routePrefix}/events/create` }] : []),
                { icon: ShoppingCart, label: 'Xem đơn hàng', color: 'from-emerald-500 to-teal-600', path: `${routePrefix}/orders` },
                { icon: Ticket, label: 'Quản lý vé', color: 'from-violet-500 to-purple-600', path: `${routePrefix}/tickets` },
                { icon: Users, label: 'Sự kiện hoạt động', color: 'from-amber-500 to-orange-600', path: `${routePrefix}/events` },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left
                    transition-all duration-200 group
                    ${isDark
                      ? 'hover:bg-white/[0.04] active:bg-white/[0.08]'
                      : 'hover:bg-gray-50 active:bg-gray-100'
                    }
                  `}
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                    <action.icon size={16} />
                  </div>
                  <span className="text-[13px] font-medium flex-1">{action.label}</span>
                  <ArrowUpRight size={14} className={`${isDark ? 'text-gray-600' : 'text-gray-300'} ${roleTheme.hoverText} transition-colors`} />
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div {...fadeUp} transition={{ delay: 0.4, duration: 0.4 }} className="lg:col-span-2">
          <div className={`${card} rounded-2xl overflow-hidden h-full`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-inherit">
              <h3 className="text-sm font-semibold">Đơn hàng gần đây</h3>
              <button
                onClick={() => navigate(`${routePrefix}/orders`)}
                className={`text-xs ${roleTheme.textColor} font-semibold transition-colors flex items-center gap-1`}
              >
                Xem tất cả <ArrowUpRight size={12} />
              </button>
            </div>

            {loading ? (
              <div className="p-8 flex justify-center">
                <div className={`w-8 h-8 border-3 ${roleTheme.spinnerBorder} border-t-transparent rounded-full animate-spin`} />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-12 text-center">
                <ShoppingCart size={32} className={`mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Chưa có đơn hàng nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                      <th className={`text-left py-3 px-5 font-medium text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Mã đơn</th>
                      <th className={`text-left py-3 px-5 font-medium text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Khách hàng</th>
                      <th className={`text-left py-3 px-5 font-medium text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} hidden md:table-cell`}>Sự kiện</th>
                      <th className={`text-right py-3 px-5 font-medium text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Số tiền</th>
                      <th className={`text-center py-3 px-5 font-medium text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => {
                      const status = statusConfig[order.paymentStatus] || statusConfig.pending;
                      return (
                        <tr
                          key={order._id}
                          onClick={() => navigate(`${routePrefix}/orders`)}
                          className={`
                            border-b cursor-pointer transition-colors
                            ${isDark
                              ? 'border-white/[0.04] hover:bg-white/[0.03]'
                              : 'border-gray-50 hover:bg-gray-50/60'
                            }
                          `}
                        >
                          <td className={`py-3.5 px-5 font-mono font-bold ${roleTheme.accentText} text-xs`}>{order.bookingCode}</td>
                          <td className="py-3.5 px-5">{order.passengerInfo?.name || order.userId?.name || '—'}</td>
                          <td className="py-3.5 px-5 truncate max-w-[180px] hidden md:table-cell">{order.eventId?.title || '—'}</td>
                          <td className="py-3.5 px-5 text-right font-semibold tabular-nums">{order.totalPrice?.toLocaleString('vi-VN')}₫</td>
                          <td className="py-3.5 px-5 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${status.bg} ${status.text}`}>
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
