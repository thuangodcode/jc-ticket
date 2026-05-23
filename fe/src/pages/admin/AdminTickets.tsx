import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Eye, RefreshCw, Search, ChevronLeft, ChevronRight, X, CheckCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { ticketService } from '../../services/ticketService';
import { toast } from 'sonner';

const statusConfig: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  active: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Có hiệu lực', dot: 'bg-emerald-500' },
  used: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Đã sử dụng', dot: 'bg-gray-400' },
  cancelled: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Đã hủy', dot: 'bg-red-500' },
  expired: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Hết hạn', dot: 'bg-amber-500' },
};

const filterOptions = [
  { id: '', label: 'Tất cả', icon: '🎫' },
  { id: 'active', label: 'Có hiệu lực', icon: '✅' },
  { id: 'used', label: 'Đã dùng', icon: '📌' },
  { id: 'cancelled', label: 'Đã hủy', icon: '❌' },
];

export default function AdminTickets() {
  const { isDark } = useTheme();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detail, setDetail] = useState<any>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (filter) params.status = filter;
      if (search) params.search = search;
      const res = await ticketService.getAllTickets(params);
      setTickets(res.data);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTickets();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [page, filter, search]);

  const handleMarkUsed = async (code: string) => {
    try {
      await ticketService.markUsed(code);
      toast.success('Vé đã được đánh dấu sử dụng');
      fetchTickets();
      setDetail(null);
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
                    ? 'bg-[#151929] text-gray-400 border border-white/[0.06] hover:bg-white/[0.04]'
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
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
              placeholder="Tìm vé, khách hàng, SĐT..."
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
            onClick={fetchTickets}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold bg-gradient-to-r from-akai to-sakura-dark text-white hover:shadow-lg hover:shadow-akai/25 transition-all duration-300 hover:-translate-y-0.5"
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
                {['Mã vé', 'Sự kiện', 'Ghế', 'Loại', 'Khách hàng', 'Giá', 'Trạng thái', ''].map(h => (
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
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Search size={32} className={`mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Chưa có vé nào</p>
                  </td>
                </tr>
              ) : tickets.map((t) => {
                const status = statusConfig[t.status] || statusConfig.active;
                return (
                  <tr
                    key={t._id}
                    className={`border-b transition-colors ${isDark ? 'border-white/[0.04] hover:bg-white/[0.02]' : 'border-gray-50 hover:bg-gray-50/60'}`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-akai text-xs">{t.ticketCode}</td>
                    <td className="py-3.5 px-4 text-xs truncate max-w-[140px]">{t.eventId?.title || '—'}</td>
                    <td className="py-3.5 px-4 text-xs font-bold">{t.seatNumber}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${t.ticketType === 'vip' ? 'bg-amber-500/10 text-amber-500' : isDark ? 'bg-white/[0.06] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                        {t.ticketType === 'vip' ? '⭐ VIP' : 'Std'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">{t.passengerName}</td>
                    <td className="py-3.5 px-4 text-xs font-bold tabular-nums">{t.price?.toLocaleString('vi-VN')}₫</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setDetail(t)}
                        className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.1]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 ${page === p ? 'bg-gradient-to-r from-akai to-sakura-dark text-white shadow-sm shadow-akai/25' : isDark ? 'text-gray-500 hover:bg-white/[0.06]' : 'text-gray-400 hover:bg-gray-100'}`}
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

      {/* ── Detail Modal with QR ── */}
      <AnimatePresence>
        {detail && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className={`${card} rounded-2xl p-6 max-w-sm w-full`}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">Chi tiết vé</h3>
                <button onClick={() => setDetail(null)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-gray-100'}`}>
                  <X size={18} />
                </button>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-5">
                <div className="bg-white p-4 rounded-2xl shadow-inner">
                  <QRCodeSVG value={detail.qrCodeData} size={160} level="H" />
                </div>
              </div>

              <div className={`text-center py-3 px-3 rounded-xl mb-5 ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                <p className="font-mono text-xl font-bold text-akai">{detail.ticketCode}</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {detail.ticketType === 'vip' ? '⭐ VIP' : 'Standard'} — Ghế {detail.seatNumber}
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: 'Khách hàng', value: detail.passengerName },
                  { label: 'Email', value: detail.passengerEmail },
                  { label: 'SĐT', value: detail.passengerPhone },
                  { label: 'Giá vé', value: `${detail.price?.toLocaleString('vi-VN')}₫`, highlight: true },
                ].map(item => (
                  <div key={item.label} className={`flex justify-between py-2 border-b ${isDark ? 'border-white/[0.04]' : 'border-gray-100'}`}>
                    <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</span>
                    <span className={`text-sm font-medium ${item.highlight ? 'text-akai font-bold' : ''}`}>{item.value || '—'}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2">
                  <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Trạng thái</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${(statusConfig[detail.status] || statusConfig.active).bg} ${(statusConfig[detail.status] || statusConfig.active).text}`}>
                    {(statusConfig[detail.status] || statusConfig.active).label}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                {detail.status === 'active' && (
                  <button
                    onClick={() => handleMarkUsed(detail.ticketCode)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors"
                  >
                    <CheckCircle size={16} />
                    Đánh dấu đã dùng
                  </button>
                )}
                <button
                  onClick={() => setDetail(null)}
                  className={`${detail.status === 'active' ? 'flex-1' : 'w-full'} py-2.5 bg-gradient-to-r from-akai to-sakura-dark text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-akai/25 transition-all duration-300`}
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
