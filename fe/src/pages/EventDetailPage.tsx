import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Check, Star } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useUserAuth } from '../contexts/useUserAuth';
import { useAuthModal } from '../contexts/AuthModalContext';
import { eventService } from '../services/eventService';
import { bookingService } from '../services/bookingService';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { toast } from 'sonner';

/**
 * EventDetailPage - Chi tiết sự kiện + Seat Map + Booking Form
 */
export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useUserAuth();
  const { openModal } = useAuthModal();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [step, setStep] = useState<'seats' | 'info'>('seats');
  const [submitting, setSubmitting] = useState(false);
  const [passengerInfo, setPassengerInfo] = useState({ name: '', email: '', phone: '' });
  const [imgSrc, setImgSrc] = useState<string>('');

  useEffect(() => {
    if (!user) {
      return;
    }

    setPassengerInfo((prev) => ({
      name: prev.name || user.name || '',
      email: prev.email || user.email || '',
      phone: prev.phone || user.phone || '',
    }));
  }, [user]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await eventService.getEventById(id!);
        setEvent(res.data);
      } catch (err) {
        toast.error('Không tìm thấy sự kiện');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (event?.image) {
      setImgSrc(event.image);
    }
  }, [event]);

  // Seat map helpers
  const getRowLabel = (index: number) => String.fromCharCode(65 + index);

  const isSeatReserved = (seat: string) => {
    return event?.seatMap?.reservedSeats?.includes(seat);
  };

  const isSeatSelected = (seat: string) => selectedSeats.includes(seat);

  const isVipRow = (rowIndex: number) => event?.seatMap?.vipRows?.includes(rowIndex);

  const toggleSeat = (seat: string) => {
    if (isSeatReserved(seat)) return;
    setSelectedSeats(prev =>
      prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]
    );
  };

  const getSeatPrice = (seat: string) => {
    const rowIndex = seat.charCodeAt(0) - 65;
    return isVipRow(rowIndex) ? (event?.vipPrice || event?.price * 1.5) : event?.price;
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + getSeatPrice(seat), 0);

  const vipCount = selectedSeats.filter(s => isVipRow(s.charCodeAt(0) - 65)).length;
  const stdCount = selectedSeats.length - vipCount;

  const handleBooking = async () => {
    if (!isAuthenticated) {
      openModal('login');
      return;
    }

    if (selectedSeats.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 ghế');
      return;
    }

    if (step === 'seats') {
      setStep('info');
      return;
    }

    // Validate passenger info
    if (!passengerInfo.name || !passengerInfo.email || !passengerInfo.phone) {
      toast.error('Vui lòng điền đầy đủ thông tin hành khách');
      return;
    }

    setSubmitting(true);
    try {
      const tickets = [];
      if (stdCount > 0) tickets.push({ ticketType: 'standard', quantity: stdCount, unitPrice: event.price });
      if (vipCount > 0) tickets.push({ ticketType: 'vip', quantity: vipCount, unitPrice: event.vipPrice || event.price * 1.5 });

      const res = await bookingService.createBooking({
        eventId: id!,
        tickets,
        selectedSeats,
        passengerInfo,
      });

      toast.success('Đặt vé thành công! Chuyển đến thanh toán...');
      navigate(`/checkout/${res.data._id}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đặt vé thất bại';
      toast.error(msg);
    } finally {
      setSubmitting(false);
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

  if (!event) return null;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-ink text-cream' : 'bg-gray-50 text-ink'}`}>
      <Navbar />

      {/* Hero Image */}
      <div className="relative h-72 md:h-96 mt-16">
        <img
          src={imgSrc || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop'}
          alt={event.title}
          onError={() => {
            const fallback = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop';
            if (imgSrc !== fallback) {
              setImgSrc(fallback);
            }
          }}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-white/80 hover:text-white mb-3 text-sm">
            <ArrowLeft size={16} /> Quay lại
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-akai text-white rounded-full text-xs font-semibold">{event.category}</span>
            <span className="flex items-center gap-1 text-yellow-400 text-sm">
              <Star size={14} className="fill-yellow-400" /> {event.rating}
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white font-elegant">{event.title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Event Info + Seat Map */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details */}
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-charcoal/80 border border-zinc-800' : 'bg-white border border-gray-200'} shadow-lg`}>
              <h2 className="text-xl font-bold mb-4">📋 Thông tin sự kiện</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-midnight' : 'bg-cream'}`}>
                  <Calendar className="text-akai" size={20} />
                  <div>
                    <p className="text-xs opacity-60">Ngày giờ</p>
                    <p className="font-semibold text-sm">
                      {new Date(event.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-midnight' : 'bg-cream'}`}>
                  <MapPin className="text-akai" size={20} />
                  <div>
                    <p className="text-xs opacity-60">Địa điểm</p>
                    <p className="font-semibold text-sm">{event.venue}</p>
                    <p className="text-xs opacity-60">{event.location}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-midnight' : 'bg-cream'}`}>
                  <Users className="text-akai" size={20} />
                  <div>
                    <p className="text-xs opacity-60">Còn trống</p>
                    <p className="font-semibold text-sm">{event.availableSeats}/{event.totalSeats} ghế</p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-midnight' : 'bg-cream'}`}>
                  <Clock className="text-akai" size={20} />
                  <div>
                    <p className="text-xs opacity-60">Tổ chức bởi</p>
                    <p className="font-semibold text-sm">{event.organizer}</p>
                  </div>
                </div>
              </div>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-cream/70' : 'text-charcoal/70'}`}>
                {event.description}
              </p>
            </div>

            {/* Seat Map */}
            <AnimatePresence mode="wait">
              {step === 'seats' ? (
                <motion.div
                  key="seats"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className={`p-6 rounded-2xl ${isDark ? 'bg-charcoal/80 border border-zinc-800' : 'bg-white border border-gray-200'} shadow-lg`}
                >
                  <h2 className="text-xl font-bold mb-2">🎭 Chọn ghế ngồi</h2>
                  <p className={`text-sm mb-6 ${isDark ? 'text-cream/60' : 'text-charcoal/60'}`}>
                    Nhấn vào ghế để chọn. Ghế VIP ở {event.seatMap.vipRows.length} hàng đầu tiên.
                  </p>

                  {/* Stage */}
                  <div className="mb-6">
                    <div className={`mx-auto w-3/4 py-2 rounded-t-3xl text-center text-sm font-semibold ${
                      isDark ? 'bg-gradient-to-r from-akai/30 to-sakura/30 text-cream/80' : 'bg-gradient-to-r from-akai/20 to-sakura/20 text-charcoal/80'
                    }`}>
                      🎬 SÂN KHẤU
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 mb-4 justify-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded bg-gradient-to-br from-yellow-400 to-amber-500" />
                      <span>VIP ({(event.vipPrice || event.price * 1.5).toLocaleString('vi-VN')}₫)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded ${isDark ? 'bg-zinc-600' : 'bg-gray-300'}`} />
                      <span>Standard ({event.price.toLocaleString('vi-VN')}₫)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded bg-akai" />
                      <span>Đã chọn</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded bg-zinc-900 opacity-50" />
                      <span>Đã đặt</span>
                    </div>
                  </div>

                  {/* Seat Grid */}
                  <div className="overflow-x-auto pb-2">
                    <div className="inline-flex flex-col gap-1.5 min-w-fit mx-auto">
                      {Array.from({ length: event.seatMap.rows }, (_, rowIdx) => (
                        <div key={rowIdx} className="flex items-center gap-1.5">
                          <span className={`w-6 text-center text-xs font-bold ${isDark ? 'text-cream/50' : 'text-charcoal/50'}`}>
                            {getRowLabel(rowIdx)}
                          </span>
                          <div className="flex gap-1">
                            {Array.from({ length: event.seatMap.seatsPerRow }, (_, seatIdx) => {
                              const seatId = `${getRowLabel(rowIdx)}${seatIdx + 1}`;
                              const reserved = isSeatReserved(seatId);
                              const selected = isSeatSelected(seatId);
                              const vip = isVipRow(rowIdx);

                              return (
                                <motion.button
                                  key={seatId}
                                  whileHover={!reserved ? { scale: 1.2 } : {}}
                                  whileTap={!reserved ? { scale: 0.9 } : {}}
                                  onClick={() => toggleSeat(seatId)}
                                  disabled={reserved}
                                  title={`${seatId} - ${vip ? 'VIP' : 'Standard'}${reserved ? ' (Đã đặt)' : ''}`}
                                  className={`w-7 h-7 md:w-8 md:h-8 rounded text-[10px] font-bold transition-all flex items-center justify-center ${
                                    reserved
                                      ? 'bg-zinc-900/50 text-zinc-700 cursor-not-allowed'
                                      : selected
                                        ? 'bg-akai text-white shadow-lg shadow-akai/50 ring-2 ring-akai/30'
                                        : vip
                                          ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white hover:shadow-lg hover:shadow-yellow-500/30 cursor-pointer'
                                          : isDark
                                            ? 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500 cursor-pointer'
                                            : 'bg-gray-300 text-gray-700 hover:bg-gray-400 cursor-pointer'
                                  }`}
                                >
                                  {selected ? <Check size={12} /> : seatIdx + 1}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className={`p-6 rounded-2xl ${isDark ? 'bg-charcoal/80 border border-zinc-800' : 'bg-white border border-gray-200'} shadow-lg`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setStep('seats')} className="text-akai hover:text-sakura-dark">
                      <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl font-bold">👤 Thông tin hành khách</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-cream/80' : 'text-charcoal/80'}`}>
                        Họ và tên *
                      </label>
                      <input
                        type="text"
                        value={passengerInfo.name}
                        onChange={(e) => setPassengerInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nguyễn Văn A"
                        className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all ${
                          isDark
                            ? 'bg-midnight border border-zinc-700 text-cream focus:border-akai'
                            : 'bg-cream border border-gray-200 text-ink focus:border-akai'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-cream/80' : 'text-charcoal/80'}`}>
                        Email *
                      </label>
                      <input
                        type="email"
                        value={passengerInfo.email}
                        onChange={(e) => setPassengerInfo(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="example@email.com"
                        className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all ${
                          isDark
                            ? 'bg-midnight border border-zinc-700 text-cream focus:border-akai'
                            : 'bg-cream border border-gray-200 text-ink focus:border-akai'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-cream/80' : 'text-charcoal/80'}`}>
                        Số điện thoại *
                      </label>
                      <input
                        type="tel"
                        value={passengerInfo.phone}
                        onChange={(e) => setPassengerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="0901234567"
                        className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all ${
                          isDark
                            ? 'bg-midnight border border-zinc-700 text-cream focus:border-akai'
                            : 'bg-cream border border-gray-200 text-ink focus:border-akai'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Sidebar: Order Summary */}
          <div className="lg:col-span-1">
            <div className={`sticky top-24 p-6 rounded-2xl ${isDark ? 'bg-charcoal/80 border border-zinc-800' : 'bg-white border border-gray-200'} shadow-lg`}>
              <h3 className="text-lg font-bold mb-4">🎫 Tóm tắt đơn hàng</h3>

              {selectedSeats.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-cream/50' : 'text-charcoal/50'}`}>
                  Chưa chọn ghế nào. Hãy chọn ghế trên sơ đồ.
                </p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {stdCount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Standard × {stdCount}</span>
                        <span className="font-semibold">{(stdCount * event.price).toLocaleString('vi-VN')}₫</span>
                      </div>
                    )}
                    {vipCount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>🌟 VIP × {vipCount}</span>
                        <span className="font-semibold">{(vipCount * (event.vipPrice || event.price * 1.5)).toLocaleString('vi-VN')}₫</span>
                      </div>
                    )}
                  </div>

                  <div className={`border-t py-3 ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {selectedSeats.sort().map(seat => (
                        <span key={seat} className="px-2 py-0.5 bg-akai/20 text-akai rounded text-xs font-bold">
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={`border-t pt-3 ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold">Tổng cộng</span>
                      <span className="text-2xl font-bold text-akai">{totalPrice.toLocaleString('vi-VN')}₫</span>
                    </div>
                  </div>
                </>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBooking}
                disabled={selectedSeats.length === 0 || submitting}
                className={`w-full py-3.5 rounded-xl font-bold text-white transition-all ${
                  selectedSeats.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-akai hover:bg-sakura-dark shadow-lg shadow-akai/30'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </span>
                ) : step === 'seats' ? (
                  `Tiếp tục (${selectedSeats.length} ghế)`
                ) : (
                  `Đặt vé — ${totalPrice.toLocaleString('vi-VN')}₫`
                )}
              </motion.button>

              {!isAuthenticated && (
                <p className="text-xs text-center mt-3 text-akai">
                  ⚠️ Bạn cần đăng nhập để đặt vé
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
