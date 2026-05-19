import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingCart, Ticket, Clock, TrendingUp } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { bookingService } from '../../services/bookingService';

export default function AdminDashboard() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
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
    fetch();
  }, []);

  const card = isDark ? 'bg-charcoal/80 border border-zinc-800' : 'bg-white border border-gray-200';

  const statCards = [
    { label: 'Tổng doanh thu', value: stats ? `${(stats.totalRevenue / 1000000).toFixed(1)}M₫` : '-', icon: DollarSign, color: 'from-green-500 to-emerald-600', sub: 'VND' },
    { label: 'Tổng đơn hàng', value: stats?.totalBookings || 0, icon: ShoppingCart, color: 'from-blue-500 to-cyan-600', sub: 'đơn' },
    { label: 'Đã thanh toán', value: stats?.confirmedBookings || 0, icon: Ticket, color: 'from-purple-500 to-pink-500', sub: 'đơn' },
    { label: 'Đang chờ', value: stats?.pendingBookings || 0, icon: Clock, color: 'from-yellow-500 to-orange-500', sub: 'đơn' },
  ];

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { successful: 'bg-green-500/20 text-green-500', pending: 'bg-yellow-500/20 text-yellow-500', failed: 'bg-red-500/20 text-red-500', refunded: 'bg-gray-500/20 text-gray-500' };
    return m[s] || m.pending;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📊 Tổng quan</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`${card} rounded-2xl p-5 shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg`}><s.icon size={20}/></div>
              <TrendingUp size={16} className="text-green-500"/>
            </div>
            <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-charcoal/60'}`}>{s.label}</p>
            <p className="text-2xl font-bold mt-1">{loading ? '...' : s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className={`${card} rounded-2xl p-6 shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">🕐 Đơn hàng gần đây</h2>
          <button onClick={() => navigate('/admin/orders')} className="text-sm text-akai font-medium hover:underline">Xem tất cả →</button>
        </div>

        {loading ? <div className="animate-pulse h-40 bg-gray-200 rounded-xl"/> : recentOrders.length === 0 ? (
          <p className="text-center py-8 opacity-50">Chưa có đơn hàng</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
                  <th className="text-left py-3 px-2 font-medium opacity-60">Mã đơn</th>
                  <th className="text-left py-3 px-2 font-medium opacity-60">Khách hàng</th>
                  <th className="text-left py-3 px-2 font-medium opacity-60">Sự kiện</th>
                  <th className="text-right py-3 px-2 font-medium opacity-60">Số tiền</th>
                  <th className="text-center py-3 px-2 font-medium opacity-60">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id} className={`border-b ${isDark ? 'border-zinc-800' : 'border-gray-100'} hover:bg-akai/5 cursor-pointer`} onClick={() => navigate('/admin/orders')}>
                    <td className="py-3 px-2 font-mono font-bold text-akai">{order.bookingCode}</td>
                    <td className="py-3 px-2">{order.passengerInfo?.name || order.userId?.name || '-'}</td>
                    <td className="py-3 px-2 truncate max-w-[200px]">{order.eventId?.title || '-'}</td>
                    <td className="py-3 px-2 text-right font-semibold">{order.totalPrice?.toLocaleString('vi-VN')}₫</td>
                    <td className="py-3 px-2 text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${statusBadge(order.paymentStatus)}`}>{order.paymentStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
