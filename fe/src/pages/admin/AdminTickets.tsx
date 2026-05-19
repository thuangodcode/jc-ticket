import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Eye, RefreshCw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { ticketService } from '../../services/ticketService';
import toast from 'react-hot-toast';

export default function AdminTickets() {
  const { isDark } = useTheme();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detail, setDetail] = useState<any>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (filter) params.status = filter;
      const res = await ticketService.getAllTickets(params);
      setTickets(res.data);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, [page, filter]);

  const handleMarkUsed = async (code: string) => {
    try {
      await ticketService.markUsed(code);
      toast.success('Vé đã được đánh dấu sử dụng');
      fetchTickets();
      setDetail(null);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };

  const card = isDark ? 'bg-charcoal/80 border border-zinc-800' : 'bg-white border border-gray-200';
  const badge = (s: string) => {
    const m: Record<string, string> = { active: 'bg-green-500/20 text-green-500', used: 'bg-gray-500/20 text-gray-500', cancelled: 'bg-red-500/20 text-red-500', expired: 'bg-yellow-500/20 text-yellow-500' };
    return m[s] || m.active;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">🎫 Vé đã phát hành</h1>
        <button onClick={fetchTickets} className="flex items-center gap-2 px-4 py-2 bg-akai text-white rounded-lg text-sm font-medium hover:bg-sakura-dark"><RefreshCw size={14}/>Làm mới</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[{ id: '', label: 'Tất cả' }, { id: 'active', label: '✅ Có hiệu lực' }, { id: 'used', label: '📌 Đã dùng' }, { id: 'cancelled', label: '❌ Đã hủy' }].map(f => (
          <button key={f.id} onClick={() => { setFilter(f.id); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.id ? 'bg-akai text-white' : isDark ? 'bg-charcoal text-cream/70 border border-zinc-700' : 'bg-white text-charcoal border border-gray-200'}`}>{f.label}</button>
        ))}
      </div>

      <div className={`${card} rounded-2xl shadow-lg overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className={isDark ? 'bg-midnight' : 'bg-cream'}>
              {['Mã vé','Sự kiện','Ghế','Loại','Khách','Giá','TT',''].map(h=><th key={h} className="text-left py-3 px-3 font-medium opacity-60 text-xs">{h}</th>)}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="py-12 text-center"><div className="animate-spin w-8 h-8 border-4 border-akai border-t-transparent rounded-full mx-auto"/></td></tr>
              : tickets.length === 0 ? <tr><td colSpan={8} className="py-12 text-center opacity-50">Chưa có vé</td></tr>
              : tickets.map(t => (
                <tr key={t._id} className={`border-t ${isDark ? 'border-zinc-800 hover:bg-zinc-900/50' : 'border-gray-100 hover:bg-cream/50'}`}>
                  <td className="py-3 px-3 font-mono font-bold text-akai text-xs">{t.ticketCode}</td>
                  <td className="py-3 px-3 text-xs truncate max-w-[150px]">{t.eventId?.title || '-'}</td>
                  <td className="py-3 px-3 text-xs font-bold">{t.seatNumber}</td>
                  <td className="py-3 px-3 text-xs">{t.ticketType === 'vip' ? '🌟 VIP' : '🎫 Std'}</td>
                  <td className="py-3 px-3 text-xs">{t.passengerName}</td>
                  <td className="py-3 px-3 text-xs font-semibold">{t.price?.toLocaleString('vi-VN')}₫</td>
                  <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badge(t.status)}`}>{t.status}</span></td>
                  <td className="py-3 px-3"><button onClick={() => setDetail(t)} className={`p-1.5 rounded-lg ${isDark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-gray-100 hover:bg-gray-200'}`}><Eye size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-inherit">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded text-xs font-bold ${page === p ? 'bg-akai text-white' : isDark ? 'text-cream/60 hover:bg-midnight' : 'text-charcoal/60 hover:bg-cream'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal with QR */}
      {detail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()} className={`${card} rounded-2xl p-6 max-w-sm w-full shadow-2xl`}>
            <h3 className="text-lg font-bold mb-4 text-center">Vé #{detail.ticketCode}</h3>
            <div className="flex justify-center mb-4 bg-white p-3 rounded-xl"><QRCodeSVG value={detail.qrCodeData} size={160} level="H"/></div>
            <div className="space-y-1.5 text-sm mb-4">
              <p><strong>Ghế:</strong> {detail.seatNumber}</p>
              <p><strong>Loại:</strong> {detail.ticketType === 'vip' ? '🌟 VIP' : 'Standard'}</p>
              <p><strong>Khách:</strong> {detail.passengerName}</p>
              <p><strong>Email:</strong> {detail.passengerEmail}</p>
              <p><strong>SĐT:</strong> {detail.passengerPhone}</p>
              <p><strong>Giá:</strong> <span className="text-akai font-bold">{detail.price?.toLocaleString('vi-VN')}₫</span></p>
              <p><strong>Trạng thái:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badge(detail.status)}`}>{detail.status}</span></p>
            </div>
            <div className="flex gap-2">
              {detail.status === 'active' && <button onClick={() => handleMarkUsed(detail.ticketCode)} className="flex-1 py-2 bg-green-500 text-white rounded-lg font-bold text-sm">✓ Đánh dấu đã dùng</button>}
              <button onClick={() => setDetail(null)} className="flex-1 py-2 bg-akai text-white rounded-lg font-bold text-sm">Đóng</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
