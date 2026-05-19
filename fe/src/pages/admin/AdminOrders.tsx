import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Eye, RefreshCw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { bookingService } from '../../services/bookingService';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const { isDark } = useTheme();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detail, setDetail] = useState<any>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (filter) params.paymentStatus = filter;
      const res = await bookingService.getAllBookings(params);
      setOrders(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [page, filter]);

  const handleConfirm = async (id: string) => {
    try {
      await bookingService.confirmBooking(id);
      toast.success('Đã xác nhận đơn hàng và tạo vé!');
      fetchOrders();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };

  const handleCancel = async (id: string) => {
    try {
      await bookingService.cancelBooking(id);
      toast.success('Đã hủy đơn hàng');
      fetchOrders();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };

  const card = isDark ? 'bg-charcoal/80 border border-zinc-800' : 'bg-white border border-gray-200';
  const badge = (s: string) => {
    const m: Record<string, string> = { successful: 'bg-green-500/20 text-green-500', pending: 'bg-yellow-500/20 text-yellow-600', failed: 'bg-red-500/20 text-red-500', refunded: 'bg-blue-500/20 text-blue-500' };
    return m[s] || m.pending;
  };
  const statusLabel = (s: string) => {
    const m: Record<string, string> = { successful: 'Đã TT', pending: 'Chờ TT', failed: 'Thất bại', refunded: 'Hoàn tiền' };
    return m[s] || s;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">📋 Quản lý đơn hàng</h1>
        <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2 bg-akai text-white rounded-lg text-sm font-medium hover:bg-sakura-dark"><RefreshCw size={14}/>Làm mới</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[{ id: '', label: 'Tất cả' }, { id: 'pending', label: '🕐 Chờ TT' }, { id: 'successful', label: '✅ Đã TT' }, { id: 'failed', label: '❌ Thất bại' }, { id: 'refunded', label: '↩️ Hoàn tiền' }].map(f => (
          <button key={f.id} onClick={() => { setFilter(f.id); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.id ? 'bg-akai text-white' : isDark ? 'bg-charcoal text-cream/70 border border-zinc-700' : 'bg-white text-charcoal border border-gray-200'}`}>{f.label}</button>
        ))}
      </div>

      {/* Table */}
      <div className={`${card} rounded-2xl shadow-lg overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className={`${isDark ? 'bg-midnight' : 'bg-cream'}`}>
              {['Mã đơn','Khách hàng','SĐT','Sự kiện','Ghế','Tổng tiền','TT','Thao tác'].map(h=><th key={h} className="text-left py-3 px-3 font-medium opacity-60 text-xs">{h}</th>)}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="py-12 text-center"><div className="animate-spin w-8 h-8 border-4 border-akai border-t-transparent rounded-full mx-auto"/></td></tr>
              : orders.length === 0 ? <tr><td colSpan={8} className="py-12 text-center opacity-50">Không có đơn hàng</td></tr>
              : orders.map(o => (
                <tr key={o._id} className={`border-t ${isDark ? 'border-zinc-800 hover:bg-zinc-900/50' : 'border-gray-100 hover:bg-cream/50'}`}>
                  <td className="py-3 px-3 font-mono font-bold text-akai text-xs">{o.bookingCode}</td>
                  <td className="py-3 px-3 text-xs">{o.passengerInfo?.name || '-'}</td>
                  <td className="py-3 px-3 text-xs">{o.passengerInfo?.phone || '-'}</td>
                  <td className="py-3 px-3 text-xs truncate max-w-[150px]">{o.eventId?.title || '-'}</td>
                  <td className="py-3 px-3 text-xs">{o.selectedSeats?.join(', ') || '-'}</td>
                  <td className="py-3 px-3 text-xs font-semibold">{o.totalPrice?.toLocaleString('vi-VN')}₫</td>
                  <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badge(o.paymentStatus)}`}>{statusLabel(o.paymentStatus)}</span></td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      {o.paymentStatus === 'pending' && (
                        <button onClick={() => handleConfirm(o._id)} title="Xác nhận TT" className="p-1.5 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/30"><Check size={14}/></button>
                      )}
                      {o.status !== 'cancelled' && (
                        <button onClick={() => handleCancel(o._id)} title="Hủy đơn" className="p-1.5 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30"><X size={14}/></button>
                      )}
                      <button onClick={() => setDetail(o)} title="Xem chi tiết" className={`p-1.5 rounded-lg ${isDark ? 'bg-zinc-700 text-cream hover:bg-zinc-600' : 'bg-gray-100 text-charcoal hover:bg-gray-200'}`}><Eye size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-inherit">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded text-xs font-bold ${page === p ? 'bg-akai text-white' : isDark ? 'text-cream/60 hover:bg-midnight' : 'text-charcoal/60 hover:bg-cream'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()} className={`${card} rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl`}>
            <h3 className="text-lg font-bold mb-4">Chi tiết đơn #{detail.bookingCode}</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Khách:</strong> {detail.passengerInfo?.name}</p>
              <p><strong>Email:</strong> {detail.passengerInfo?.email}</p>
              <p><strong>SĐT:</strong> {detail.passengerInfo?.phone}</p>
              <p><strong>Sự kiện:</strong> {detail.eventId?.title}</p>
              <p><strong>Ghế:</strong> {detail.selectedSeats?.join(', ')}</p>
              <p><strong>Tổng:</strong> <span className="text-akai font-bold">{detail.totalPrice?.toLocaleString('vi-VN')}₫</span></p>
              <p><strong>Thanh toán:</strong> {detail.paymentMethod || '-'}</p>
              <p><strong>Payment ID:</strong> {detail.paymentId || '-'}</p>
              <p><strong>Trạng thái:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badge(detail.paymentStatus)}`}>{detail.paymentStatus}</span></p>
              <p><strong>Ngày tạo:</strong> {new Date(detail.createdAt).toLocaleString('vi-VN')}</p>
            </div>
            <button onClick={() => setDetail(null)} className="w-full mt-4 py-2 bg-akai text-white rounded-lg font-bold text-sm">Đóng</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
