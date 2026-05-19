import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Eye, Ticket, Calendar, MapPin } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ticketService } from '../services/ticketService';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import toast from 'react-hot-toast';

export default function MyTicketsPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await ticketService.getMyTickets(filter || undefined);
        setTickets(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [filter]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      active: 'bg-green-500/20 text-green-500 border-green-500/30',
      used: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
      cancelled: 'bg-red-500/20 text-red-500 border-red-500/30',
      expired: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    };
    return map[s] || map.active;
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { active: 'Có hiệu lực', used: 'Đã sử dụng', cancelled: 'Đã hủy', expired: 'Hết hạn' };
    return map[s] || s;
  };

  const handleDownloadPDF = async (ticket: any) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const el = document.getElementById(`ticket-${ticket.ticketCode}`);
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#fff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a5');
      const w = pdf.internal.pageSize.getWidth() - 20;
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, w, h);
      pdf.save(`JC-Ticket_${ticket.ticketCode}.pdf`);
      toast.success('PDF đã tải xuống!');
    } catch (err) {
      toast.error('Không thể tạo PDF');
    }
  };

  const bg = isDark ? 'bg-ink text-cream' : 'bg-gray-50 text-ink';
  const card = isDark ? 'bg-charcoal/80 border border-zinc-800' : 'bg-white border border-gray-200';

  return (
    <div className={`min-h-screen ${bg}`}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold font-elegant mb-2">🎫 Vé của tôi</h1>
          <p className={`text-sm mb-6 ${isDark ? 'text-cream/60' : 'text-charcoal/60'}`}>Quản lý và xem vé điện tử</p>
        </motion.div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[{ id: '', label: 'Tất cả' }, { id: 'active', label: 'Có hiệu lực' }, { id: 'used', label: 'Đã dùng' }, { id: 'cancelled', label: 'Đã hủy' }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f.id ? 'bg-akai text-white' : isDark ? 'bg-charcoal text-cream/70 border border-zinc-700' : 'bg-white text-charcoal border border-gray-200'}`}>{f.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{[...Array(4)].map((_, i) => (<div key={i} className={`animate-pulse h-64 rounded-2xl ${isDark ? 'bg-charcoal' : 'bg-gray-200'}`} />))}</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20">
            <Ticket size={64} className="mx-auto mb-4 text-akai opacity-50" />
            <p className="text-xl font-bold mb-2">Chưa có vé nào</p>
            <p className={`text-sm mb-6 ${isDark ? 'text-cream/50' : 'text-charcoal/50'}`}>Đặt vé sự kiện để xem vé tại đây</p>
            <button onClick={() => navigate('/events')} className="px-6 py-3 bg-akai text-white rounded-xl font-semibold hover:bg-sakura-dark">Khám phá sự kiện</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tickets.map((ticket, idx) => (
              <motion.div key={ticket._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} id={`ticket-${ticket.ticketCode}`} className={`${card} rounded-2xl overflow-hidden shadow-lg`}>
                {/* Ticket Header */}
                <div className="bg-gradient-to-r from-akai to-sakura-dark p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-80">Mã vé</p>
                      <p className="font-mono font-bold text-lg">{ticket.ticketCode}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadge(ticket.status)}`}>{statusLabel(ticket.status)}</span>
                  </div>
                </div>
                {/* Ticket Body */}
                <div className="p-5">
                  <h3 className="font-bold text-base mb-3 line-clamp-1">{ticket.eventId?.title || 'Sự kiện'}</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-cream/70' : 'text-charcoal/70'}`}>
                      <Calendar size={14} className="text-akai" />
                      <span>{ticket.eventId?.date ? new Date(ticket.eventId.date).toLocaleDateString('vi-VN') : '-'}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-cream/70' : 'text-charcoal/70'}`}>
                      <MapPin size={14} className="text-akai" />
                      <span>{ticket.eventId?.location || '-'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* QR Code */}
                    <div className="bg-white p-2 rounded-xl">
                      <QRCodeSVG value={ticket.qrCodeData} size={90} level="M" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="text-sm"><span className="opacity-60">Ghế:</span> <span className="font-bold text-akai">{ticket.seatNumber}</span></div>
                      <div className="text-sm"><span className="opacity-60">Loại:</span> <span className="font-bold">{ticket.ticketType === 'vip' ? '🌟 VIP' : '🎫 Standard'}</span></div>
                      <div className="text-sm"><span className="opacity-60">Giá:</span> <span className="font-bold text-akai">{ticket.price?.toLocaleString('vi-VN')}₫</span></div>
                      <div className="text-sm"><span className="opacity-60">Khách:</span> <span className="font-medium">{ticket.passengerName}</span></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
                    <button onClick={() => handleDownloadPDF(ticket)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-akai/10 text-akai hover:bg-akai/20 transition-colors"><Download size={14} />Tải PDF</button>
                    <button onClick={() => navigate(`/my-tickets/${ticket.ticketCode}`)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-midnight text-cream hover:bg-zinc-800' : 'bg-cream text-charcoal hover:bg-gray-200'}`}><Eye size={14} />Chi tiết</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
