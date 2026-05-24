import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  User, 
  Ticket, 
  ArrowLeft, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useUserAuth } from '../contexts/useUserAuth';
import { ticketService } from '../services/ticketService';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { toast } from 'sonner';

export default function VerifyTicketPage() {
  const { ticketCode } = useParams<{ ticketCode: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user, isAuthenticated } = useUserAuth();
  
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    message: string;
    data?: {
      ticketCode: string;
      event: {
        title: string;
        date: string;
        location: string;
        venue: string;
      };
      seatNumber: string;
      ticketType: 'standard' | 'vip';
      passengerName: string;
      status: 'active' | 'used' | 'cancelled' | 'expired';
    };
  } | null>(null);

  const isStaffOrAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'staff');
  const [autoCheckingIn, setAutoCheckingIn] = useState(false);

  const checkTicket = async () => {
    setLoading(true);
    try {
      const res = await ticketService.verifyTicket(ticketCode!);
      setResult(res);
    } catch (err: any) {
      setResult({
        valid: false,
        message: err.response?.data?.message || 'Không thể xác thực vé',
        data: err.response?.data?.data
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketCode) {
      checkTicket();
    }
  }, [ticketCode]);

  // Tự động check-in khi staff/admin quét mã QR
  useEffect(() => {
    if (
      !loading && 
      result?.valid && 
      result?.data?.status === 'active' && 
      isStaffOrAdmin && 
      !checkingIn && 
      !autoCheckingIn
    ) {
      const autoCheck = async () => {
        setAutoCheckingIn(true);
        const toastId = toast.loading('Đang tự động check-in vé...');
        try {
          await ticketService.markUsed(ticketCode!);
          toast.success('Tự động check-in thành công!', { id: toastId });
          // Re-verify to update status on UI
          const res = await ticketService.verifyTicket(ticketCode!);
          setResult(res);
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Lỗi tự động check-in', { id: toastId });
        } finally {
          setAutoCheckingIn(false);
        }
      };
      autoCheck();
    }
  }, [loading, result, isStaffOrAdmin, ticketCode]);

  const handleCheckIn = async () => {
    if (!ticketCode) return;
    setCheckingIn(true);
    const toastId = toast.loading('Đang check-in vé...');
    try {
      await ticketService.markUsed(ticketCode);
      toast.success('Check-in vé thành công!', { id: toastId });
      // Re-verify to update status on UI
      await checkTicket();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi check-in vé', { id: toastId });
    } finally {
      setCheckingIn(false);
    }
  };

  const bgClass = isDark ? 'bg-ink text-cream' : 'bg-gray-50 text-ink';
  const cardClass = isDark ? 'bg-[#151929]/80 border border-white/[0.06] backdrop-blur' : 'bg-white border border-gray-200/60 shadow-xl';

  return (
    <div className={`min-h-screen flex flex-col justify-between ${bgClass}`}>
      <Navbar />
      
      <div className="flex-1 max-w-lg mx-auto w-full px-4 pt-24 pb-16 flex flex-col justify-center">
        <button 
          onClick={() => navigate(isStaffOrAdmin ? '/admin/tickets' : '/')} 
          className="flex items-center gap-2 text-akai mb-6 text-sm hover:underline"
        >
          <ArrowLeft size={16}/>
          Quay lại {isStaffOrAdmin ? 'Quản lý vé' : 'Trang chủ'}
        </button>

        {loading ? (
          <div className={`${cardClass} rounded-3xl p-10 text-center shadow-2xl flex flex-col items-center justify-center min-h-[350px]`}>
            <div className="w-16 h-16 border-4 border-akai border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-bold text-lg">Đang xác thực vé...</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-cream/50' : 'text-charcoal/50'}`}>Vui lòng đợi trong giây lát</p>
          </div>
        ) : result ? (
          <div className={`${cardClass} rounded-3xl overflow-hidden shadow-2xl transition-all duration-300`}>
            {/* Status Header */}
            {result.valid ? (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white text-center flex flex-col items-center">
                <CheckCircle size={48} className="mb-2 animate-bounce" />
                <h2 className="text-xl font-bold uppercase tracking-wider">VÉ HỢP LỆ ✅</h2>
                <p className="text-xs opacity-90 mt-1">Sẵn sàng check-in cho sự kiện</p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-white text-center flex flex-col items-center">
                <XCircle size={48} className="mb-2" />
                <h2 className="text-xl font-bold uppercase tracking-wider">VÉ KHÔNG HỢP LỆ ❌</h2>
                <p className="text-xs opacity-90 mt-1">{result.message}</p>
              </div>
            )}

            {/* Ticket Metadata Info */}
            {result.data ? (
              <div className="p-6 space-y-6">
                <div>
                  <p className={`text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-cream/40' : 'text-charcoal/40'}`}>Sự kiện</p>
                  <h3 className="font-bold text-lg mt-1">{result.data.event.title}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-midnight' : 'bg-cream'}`}>
                    <div className={`flex items-center gap-1.5 text-xs mb-1 ${isDark ? 'text-cream/50' : 'text-charcoal/50'}`}>
                      <Calendar size={14} className="text-akai" />
                      <span>Ngày</span>
                    </div>
                    <p className="font-semibold text-xs">
                      {result.data.event.date ? new Date(result.data.event.date).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl ${isDark ? 'bg-midnight' : 'bg-cream'}`}>
                    <div className={`flex items-center gap-1.5 text-xs mb-1 ${isDark ? 'text-cream/50' : 'text-charcoal/50'}`}>
                      <MapPin size={14} className="text-akai" />
                      <span>Địa điểm</span>
                    </div>
                    <p className="font-semibold text-xs truncate">
                      {result.data.event.venue ? `${result.data.event.venue}, ${result.data.event.location}` : result.data.event.location}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl ${isDark ? 'bg-midnight' : 'bg-cream'}`}>
                    <div className={`flex items-center gap-1.5 text-xs mb-1 ${isDark ? 'text-cream/50' : 'text-charcoal/50'}`}>
                      <Ticket size={14} className="text-akai" />
                      <span>Thông tin ghế</span>
                    </div>
                    <p className="font-semibold text-sm">
                      Ghế: <span className="font-bold text-akai">{result.data.seatNumber}</span>
                    </p>
                    <p className="text-[10px] opacity-60">
                      {result.data.ticketType === 'vip' ? '🌟 Vé VIP' : '🎫 Vé Standard'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl ${isDark ? 'bg-midnight' : 'bg-cream'}`}>
                    <div className={`flex items-center gap-1.5 text-xs mb-1 ${isDark ? 'text-cream/50' : 'text-charcoal/50'}`}>
                      <User size={14} className="text-akai" />
                      <span>Hành khách</span>
                    </div>
                    <p className="font-semibold text-sm truncate">{result.data.passengerName}</p>
                    <p className="text-[10px] opacity-60 font-mono">Mã: {result.data.ticketCode}</p>
                  </div>
                </div>

                {/* Status and Action panels */}
                <div className={`p-4 rounded-2xl flex items-center justify-between ${isDark ? 'bg-white/[0.03]' : 'bg-gray-100/50'}`}>
                  <div>
                    <p className={`text-xs ${isDark ? 'text-cream/50' : 'text-charcoal/50'}`}>Trạng thái vé</p>
                    <p className={`text-sm font-bold mt-0.5 ${
                      result.data.status === 'active' ? 'text-emerald-500' :
                      result.data.status === 'used' ? 'text-gray-400' : 'text-red-500'
                    }`}>
                      {result.data.status === 'active' ? 'Có hiệu lực' :
                       result.data.status === 'used' ? 'Đã sử dụng' :
                       result.data.status === 'cancelled' ? 'Đã bị hủy' : 'Đã hết hạn'}
                    </p>
                  </div>
                  
                  {isStaffOrAdmin && result.data.status === 'active' && (
                    <button
                      onClick={handleCheckIn}
                      disabled={checkingIn || autoCheckingIn}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/25 disabled:opacity-50"
                    >
                      <UserCheck size={14} />
                      {checkingIn || autoCheckingIn ? 'Đang check-in...' : 'Xác nhận Check-in'}
                    </button>
                  )}
                </div>

                {/* Staff/Admin Mode Badge */}
                {isStaffOrAdmin && (
                  <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-akai/20 bg-akai/5 text-akai text-[11px] font-bold">
                    <ShieldCheck size={14} />
                    Chế độ {user?.role === 'admin' ? 'Admin' : 'Staff'} - Nhân viên kiểm soát vé
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center space-y-4">
                <AlertCircle size={48} className="mx-auto text-amber-500" />
                <p className="font-bold text-base">{result.message}</p>
                <p className={`text-xs ${isDark ? 'text-cream/50' : 'text-charcoal/50'}`}>
                  Mã vé không tồn tại hoặc hệ thống gặp sự cố khi đọc dữ liệu.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className={`${cardClass} rounded-3xl p-8 text-center space-y-4`}>
            <AlertCircle size={48} className="mx-auto text-red-500" />
            <p className="font-bold">Lỗi xác thực</p>
            <p className="text-sm">Không thể kết nối đến hệ thống kiểm tra vé.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
