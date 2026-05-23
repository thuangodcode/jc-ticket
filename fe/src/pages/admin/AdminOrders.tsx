import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Eye, RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { bookingService } from '../../services/bookingService';
import { toast } from 'sonner';

const statusConfig: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  successful: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Đã thanh toán', dot: 'bg-emerald-500' },
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Chờ thanh toán', dot: 'bg-amber-500' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Thất bại', dot: 'bg-red-500' },
  refunded: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Hoàn tiền', dot: 'bg-blue-500' },
};

const filterOptions = [
  { id: '', label: 'Tất cả', icon: '📋' },
  { id: 'pending', label: 'Chờ TT', icon: '🕐' },
  { id: 'successful', label: 'Đã TT', icon: '✅' },
  { id: 'failed', label: 'Thất bại', icon: '❌' },
  { id: 'refunded', label: 'Hoàn tiền', icon: '↩️' },
];

export default function AdminOrders() {
  const { isDark } = useTheme();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detail, setDetail] = useState<any>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (filter) params.paymentStatus = filter;
      if (search) params.search = search;
      const res = await bookingService.getAllBookings(params);
      setOrders(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchOrders();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [page, filter, search]);

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

  const card = isDark
    ? 'bg-[#151929]/80 border border-white/[0.06] backdrop-blur'
    : 'bg-white border border-gray-200/60 shadow-sm';

  return (
    <div className="space-y-5">
      {/* Filters + Search bar + Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map(f => (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); setPage(1); }}
              className={`
                flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold
                transition-all duration-200
                ${filter === f.id
                  ? 'bg-gradient-to-r from-akai to-sakura-dark text-white shadow-md shadow-akai/25'
                  : isDark
                    ? 'bg-[#151929] text-gray-400 border border-white/[0.06] hover:bg-white/[0.04] hover:text-gray-200'
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                }
              `}
            >
              <span>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* Search input + Refresh button */}
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <div className="relative max-w-xs w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
            </span>
            <input
              type="text"
              placeholder="Tìm đơn, khách hàng, SĐT..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={`
                w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none transition-all duration-200
                ${isDark
                  ? 'bg-[#151929] text-gray-200 border border-white/[0.06] focus:border-akai focus:ring-1 focus:ring-akai'
                  : 'bg-white text-gray-800 border border-gray-200 focus:border-akai focus:ring-1 focus:ring-akai'
                }
              `}
            />
          </div>

          <button
            onClick={fetchOrders}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold shrink-0
              bg-gradient-to-r from-akai to-sakura-dark text-white
              hover:shadow-lg hover:shadow-akai/25 transition-all duration-300 hover:-translate-y-0.5
            `}
          >
            <RefreshCw size={14} />
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className={`${card} rounded-2xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
                {['Mã đơn', 'Khách hàng', 'SĐT', 'Sự kiện', 'Ghế', 'Tổng tiền', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className={`text-left py-3.5 px-4 font-semibold text-[11px] uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-akai border-t-transparent rounded-full animate-spin" />
                      <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Search size={32} className={`mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Không tìm thấy đơn hàng</p>
                  </td>
                </tr>
              ) : orders.map((o) => {
                const status = statusConfig[o.paymentStatus] || statusConfig.pending;
                return (
                  <tr
                    key={o._id}
                    className={`
                      border-b transition-colors
                      ${isDark ? 'border-white/[0.04] hover:bg-white/[0.02]' : 'border-gray-50 hover:bg-gray-50/60'}
                    `}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-akai text-xs">{o.bookingCode}</td>
                    <td className="py-3.5 px-4 text-xs font-medium">{o.passengerInfo?.name || '—'}</td>
                    <td className="py-3.5 px-4 text-xs">{o.passengerInfo?.phone || '—'}</td>
                    <td className="py-3.5 px-4 text-xs truncate max-w-[140px]">{o.eventId?.title || '—'}</td>
                    <td className="py-3.5 px-4 text-xs font-medium">{o.selectedSeats?.join(', ') || '—'}</td>
                    <td className="py-3.5 px-4 text-xs font-bold tabular-nums">{o.totalPrice?.toLocaleString('vi-VN')}₫</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex gap-1.5">
                        {o.paymentStatus === 'pending' && (
                          <button
                            onClick={() => handleConfirm(o._id)}
                            title="Xác nhận"
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {o.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancel(o._id)}
                            title="Hủy đơn"
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => setDetail(o)}
                          title="Chi tiết"
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.1]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between px-5 py-3.5 border-t ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Trang {page} / {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-gray-100'}`}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, page - 3),
                Math.min(totalPages, page + 2)
              ).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`
                    w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200
                    ${page === p
                      ? 'bg-gradient-to-r from-akai to-sakura-dark text-white shadow-sm shadow-akai/25'
                      : isDark ? 'text-gray-500 hover:bg-white/[0.06] hover:text-gray-300' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                    }
                  `}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-gray-100'}`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {detail && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className={`${card} rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto`}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">Chi tiết đơn hàng</h3>
                <button onClick={() => setDetail(null)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-gray-100'}`}>
                  <X size={18} />
                </button>
              </div>

              <div className={`text-center py-4 px-3 rounded-xl mb-5 ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                <p className="font-mono text-2xl font-bold text-akai">{detail.bookingCode}</p>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Khách hàng', value: detail.passengerInfo?.name },
                  { label: 'Email', value: detail.passengerInfo?.email },
                  { label: 'Số điện thoại', value: detail.passengerInfo?.phone },
                  { label: 'Sự kiện', value: detail.eventId?.title },
                  { label: 'Ghế', value: detail.selectedSeats?.join(', ') },
                  { label: 'Thanh toán', value: detail.paymentMethod || '—' },
                  { label: 'Payment ID', value: detail.paymentId || '—' },
                  { label: 'Ngày tạo', value: new Date(detail.createdAt).toLocaleString('vi-VN') },
                ].map(item => (
                  <div key={item.label} className={`flex justify-between py-2 border-b ${isDark ? 'border-white/[0.04]' : 'border-gray-100'}`}>
                    <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</span>
                    <span className="text-sm font-medium text-right max-w-[60%] truncate">{item.value || '—'}</span>
                  </div>
                ))}
                <div className={`flex justify-between py-2 border-b ${isDark ? 'border-white/[0.04]' : 'border-gray-100'}`}>
                  <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Tổng tiền</span>
                  <span className="text-sm font-bold text-akai">{detail.totalPrice?.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Trạng thái</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${(statusConfig[detail.paymentStatus] || statusConfig.pending).bg} ${(statusConfig[detail.paymentStatus] || statusConfig.pending).text}`}>
                    {(statusConfig[detail.paymentStatus] || statusConfig.pending).label}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setDetail(null)}
                className="w-full mt-5 py-2.5 bg-gradient-to-r from-akai to-sakura-dark text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-akai/25 transition-all duration-300"
              >
                Đóng
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
