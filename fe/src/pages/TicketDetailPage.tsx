import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Download, Calendar, MapPin, User, Phone, Ticket } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ticketService } from '../services/ticketService';
import { Navbar } from '../components/Navbar';
import toast from 'react-hot-toast';

export default function TicketDetailPage() {
  const { ticketCode } = useParams<{ ticketCode: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await ticketService.getTicketByCode(ticketCode!);
        setTicket(res.data);
      } catch { toast.error('Vé không tồn tại'); navigate('/my-tickets'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [ticketCode]);

  const handlePDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const el = document.getElementById('ticket-detail-print');
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#fff' });
      const pdf = new jsPDF('p', 'mm', 'a5');
      const w = pdf.internal.pageSize.getWidth() - 20;
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, w, h);
      pdf.save(`JC-Ticket_${ticketCode}.pdf`);
      toast.success('PDF đã tải xuống!');
    } catch { toast.error('Lỗi tạo PDF'); }
  };

  if (loading) return <div className={`min-h-screen ${isDark?'bg-ink':'bg-gray-50'}`}><Navbar/><div className="flex items-center justify-center h-96 pt-20"><div className="animate-spin w-12 h-12 border-4 border-akai border-t-transparent rounded-full"/></div></div>;
  if (!ticket) return null;

  const event = ticket.eventId;
  const card = isDark ? 'bg-charcoal/80 border border-zinc-800' : 'bg-white border border-gray-200';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-ink text-cream' : 'bg-gray-50 text-ink'}`}>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 pt-24 pb-16">
        <button onClick={() => navigate('/my-tickets')} className="flex items-center gap-2 text-akai mb-6 text-sm hover:underline"><ArrowLeft size={16}/>Quay lại</button>

        <div id="ticket-detail-print" className={`${card} rounded-3xl overflow-hidden shadow-2xl`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-akai to-sakura-dark p-6 text-white text-center">
            <p className="text-sm opacity-80 mb-1">✦ JC-Ticket</p>
            <h2 className="text-xl font-bold font-elegant">VÉ ĐIỆN TỬ</h2>
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-6 bg-white">
            <QRCodeSVG value={ticket.qrCodeData} size={200} level="H" includeMargin />
          </div>

          {/* Ticket Code */}
          <div className="text-center py-3 bg-gradient-to-r from-akai/10 to-sakura/10 border-y border-dashed border-akai/30">
            <p className="text-xs opacity-60">Mã vé</p>
            <p className="font-mono font-bold text-2xl text-akai tracking-wider">{ticket.ticketCode}</p>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <h3 className="font-bold text-lg text-center">{event?.title}</h3>

            <div className="grid grid-cols-2 gap-3">
              <InfoRow icon={<Calendar size={14}/>} label="Ngày" value={event?.date ? new Date(event.date).toLocaleDateString('vi-VN') : '-'} isDark={isDark}/>
              <InfoRow icon={<MapPin size={14}/>} label="Địa điểm" value={event?.location || '-'} isDark={isDark}/>
              <InfoRow icon={<Ticket size={14}/>} label="Ghế" value={ticket.seatNumber} isDark={isDark}/>
              <InfoRow icon={<Ticket size={14}/>} label="Loại" value={ticket.ticketType === 'vip' ? '🌟 VIP' : '🎫 Standard'} isDark={isDark}/>
              <InfoRow icon={<User size={14}/>} label="Hành khách" value={ticket.passengerName} isDark={isDark}/>
              <InfoRow icon={<Phone size={14}/>} label="SĐT" value={ticket.passengerPhone} isDark={isDark}/>
            </div>

            <div className={`text-center py-3 rounded-xl ${isDark ? 'bg-midnight' : 'bg-cream'}`}>
              <p className="text-xs opacity-60">Giá vé</p>
              <p className="text-2xl font-bold text-akai">{ticket.price?.toLocaleString('vi-VN')}₫</p>
            </div>

            <div className={`text-center text-xs ${isDark ? 'text-cream/40' : 'text-charcoal/40'}`}>
              <p>Ngày phát hành: {new Date(ticket.issuedAt).toLocaleString('vi-VN')}</p>
              <p className="mt-1">Vui lòng xuất trình QR khi vào cửa</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button onClick={handlePDF} className="flex-1 flex items-center justify-center gap-2 py-3 bg-akai text-white rounded-xl font-bold hover:bg-sakura-dark shadow-lg shadow-akai/30"><Download size={16}/>Tải PDF</button>
          <button onClick={() => window.print()} className={`flex-1 py-3 rounded-xl font-bold ${isDark ? 'bg-charcoal text-cream border border-zinc-700' : 'bg-white text-charcoal border border-gray-200'}`}>🖨️ In vé</button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, isDark }: { icon: React.ReactNode; label: string; value: string; isDark: boolean }) {
  return (
    <div className={`p-3 rounded-xl ${isDark ? 'bg-midnight' : 'bg-cream'}`}>
      <div className={`flex items-center gap-1.5 text-xs mb-1 ${isDark ? 'text-cream/50' : 'text-charcoal/50'}`}>{icon}{label}</div>
      <p className="font-semibold text-sm truncate">{value}</p>
    </div>
  );
}
