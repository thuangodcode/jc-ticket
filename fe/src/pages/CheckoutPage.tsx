import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import { Navbar } from '../components/Navbar';
import toast from 'react-hot-toast';

/**
 * CheckoutPage - Xác nhận đơn hàng + Chọn phương thức thanh toán
 */
export default function CheckoutPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await bookingService.getBookingById(bookingId!);
        setBooking(res.data);
        if (res.data.paymentStatus === 'successful') {
          toast.success('Đơn hàng đã được thanh toán!');
          navigate('/my-tickets');
        }
      } catch (err) {
        toast.error('Không tìm thấy đơn hàng');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const handlePayment = async () => {
    if (!booking) return;
    setProcessing(true);

    try {
      const res = await paymentService.createPayOSOrder(bookingId!);
      if (res.success && res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        toast.error('Không thể tạo đơn PayOS');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Thanh toán thất bại';
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-ink' : 'bg-gray-50'}`}>
        <Navbar />
        <div className="flex items-center justify-center h-96 pt-20">
          <div className="animate-spin w-12 h-12 border-4 border-akai border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!booking) return null;
  const event = booking.eventId;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-ink text-cream' : 'bg-gray-50 text-ink'}`}>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-akai mb-6 text-sm font-medium hover:underline">
          <ArrowLeft size={16} /> Quay lại
        </button>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold font-elegant mb-8">
          💳 Thanh toán
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Payment Method Selection */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-lg font-bold mb-3">Thanh toán qua PayOS</h2>

            <div className={`p-5 rounded-2xl border-2 border-akai shadow-lg shadow-akai/10 ${isDark ? 'bg-charcoal/80' : 'bg-white'}`}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 flex items-center justify-center text-white text-2xl shadow-lg">
                  ⚡
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">PayOS (Nhanh &amp; Tự động)</h3>
                  <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-charcoal/60'}`}>
                    Thanh toán qua QR Code ngân hàng. Hệ thống sẽ tự xác nhận khi giao dịch hoàn tất.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className={`flex items-start gap-3 p-4 rounded-xl ${isDark ? 'bg-midnight/80' : 'bg-green-50'}`}>
              <Shield size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-cream' : 'text-charcoal'}`}>Thanh toán an toàn & bảo mật</p>
                <p className={`text-xs ${isDark ? 'text-cream/60' : 'text-charcoal/60'}`}>
                  Thông tin thanh toán được mã hóa SSL. JC-Ticket không lưu trữ thông tin thẻ của bạn.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-2">
            <div className={`sticky top-24 p-6 rounded-2xl ${isDark ? 'bg-charcoal/80 border border-zinc-800' : 'bg-white border border-gray-200'} shadow-lg`}>
              <h3 className="text-lg font-bold mb-4">📋 Chi tiết đơn hàng</h3>

              {/* Event Info */}
              <div className="flex gap-3 mb-4">
                <img src={event?.image} alt={event?.title} className="w-20 h-20 rounded-xl object-cover" />
                <div>
                  <h4 className="font-bold text-sm line-clamp-2">{event?.title}</h4>
                  <p className={`text-xs mt-1 ${isDark ? 'text-cream/60' : 'text-charcoal/60'}`}>
                    {event?.date && new Date(event.date).toLocaleDateString('vi-VN')}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-cream/60' : 'text-charcoal/60'}`}>
                    {event?.venue}
                  </p>
                </div>
              </div>

              <div className={`border-t py-3 space-y-2 ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
                <div className="flex justify-between text-sm">
                  <span>Mã đặt vé</span>
                  <span className="font-mono font-bold text-akai">{booking.bookingCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Hành khách</span>
                  <span className="font-medium">{booking.passengerInfo.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Số ghế</span>
                  <span className="font-medium">{booking.selectedSeats.join(', ')}</span>
                </div>
                {booking.tickets.map((t: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{t.ticketType === 'vip' ? '🌟 VIP' : '🎫 Standard'} × {t.quantity}</span>
                    <span>{(t.quantity * t.unitPrice).toLocaleString('vi-VN')}₫</span>
                  </div>
                ))}
              </div>

              <div className={`border-t pt-3 mb-4 ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Tổng cộng</span>
                  <span className="text-2xl font-bold text-akai">{booking.totalPrice.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>

              {/* Timer */}
              <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
                <Clock size={16} className="text-yellow-500" />
                <span className="text-xs text-yellow-600 font-medium">Đơn hàng hết hạn sau 5 phút nếu chưa thanh toán</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePayment}
                disabled={processing}
                className="w-full py-4 rounded-xl font-bold text-white bg-akai hover:bg-sakura-dark transition-all shadow-lg shadow-akai/30 disabled:opacity-50"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </span>
                ) : (
                  `Thanh toán ${booking.totalPrice.toLocaleString('vi-VN')}₫`
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
