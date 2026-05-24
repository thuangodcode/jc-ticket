import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  CheckCircle, 
  XCircle, 
  Camera, 
  CameraOff,
  ListRestart,
  History,
  QrCode,
  Keyboard
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserAuth } from '../../contexts/useUserAuth';
import { ticketService } from '../../services/ticketService';
import { toast } from 'sonner';

interface HistoryItem {
  ticketCode: string;
  passengerName: string;
  timestamp: Date;
  status: 'success' | 'failed';
  message: string;
}

export default function AdminScanPage() {
  const { isDark } = useTheme();
  const { user } = useUserAuth();
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [manualCode, setManualCode] = useState('');
  
  // Scanned result for success popup
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    ticketCode: string;
    passengerName?: string;
    seatNumber?: string;
    ticketType?: string;
    eventTitle?: string;
    message: string;
  } | null>(null);

  // Recent history list (5 items)
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const elementId = "qr-camera-stream";

  useEffect(() => {
    // Check permission
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setHasCameraPermission(true))
      .catch(() => setHasCameraPermission(false));

    return () => {
      // Clean up scanner on unmount
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setShowResult(false);
      setScanResult(null);
      
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(elementId);
      }

      if (html5QrCodeRef.current.isScanning) {
        return;
      }

      setScanning(true);
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.75;
            return { width: size, height: size };
          }
        },
        onQrCodeSuccess,
        () => {} // Suppress noise logs on QR search failures
      );
    } catch (err: any) {
      console.error(err);
      toast.error('Không thể mở camera. Hãy đảm bảo bạn đã cấp quyền truy cập camera.');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Helper to extract code from URL or text
  const extractTicketCode = (text: string): string => {
    const trimmed = text.trim();
    // If it is a full URL containing verify-ticket or verify
    if (trimmed.includes('/verify-ticket/')) {
      return trimmed.split('/verify-ticket/')[1] || trimmed;
    }
    if (trimmed.includes('/verify/')) {
      return trimmed.split('/verify/')[1] || trimmed;
    }
    return trimmed;
  };

  const onQrCodeSuccess = async (decodedText: string) => {
    // Stop scanning immediately to prevent duplicate scans
    await stopScanning();
    const ticketCode = extractTicketCode(decodedText);
    processTicketCheckIn(ticketCode);
  };

  const processTicketCheckIn = async (code: string) => {
    if (!code) return;
    setChecking(true);
    const toastId = toast.loading(`Đang xác thực vé ${code}...`);

    try {
      // 1. Verify ticket
      const verifyRes = await ticketService.verifyTicket(code);
      
      if (!verifyRes.valid) {
        throw new Error(verifyRes.message || 'Vé không hợp lệ');
      }

      // 2. Perform check-in / mark used
      await ticketService.markUsed(code);
      
      toast.success('Check-in thành công! ✅', { id: toastId });
      
      const guestName = verifyRes.data?.passengerName || 'Khách mời';
      
      setScanResult({
        success: true,
        ticketCode: code,
        passengerName: guestName,
        seatNumber: verifyRes.data?.seatNumber,
        ticketType: verifyRes.data?.ticketType === 'vip' ? '🌟 VIP' : '🎫 Standard',
        eventTitle: verifyRes.data?.event?.title,
        message: 'Check-in thành công vào hệ thống!'
      });

      // Append to history
      setHistory(prev => [
        {
          ticketCode: code,
          passengerName: guestName,
          timestamp: new Date(),
          status: 'success',
          message: 'Thành công'
        },
        ...prev.slice(0, 5)
      ]);
      
      setShowResult(true);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Mã vé không tồn tại hoặc lỗi hệ thống';
      
      toast.error(errMsg, { id: toastId });
      
      setScanResult({
        success: false,
        ticketCode: code,
        message: errMsg
      });

      // Append failed scan to history
      setHistory(prev => [
        {
          ticketCode: code,
          passengerName: '—',
          timestamp: new Date(),
          status: 'failed',
          message: errMsg
        },
        ...prev.slice(0, 5)
      ]);

      setShowResult(true);
    } finally {
      setChecking(false);
    }
  };

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processTicketCheckIn(manualCode.trim());
    setManualCode('');
  };

  const nextScan = () => {
    setShowResult(false);
    setScanResult(null);
    startScanning();
  };

  const card = isDark
    ? 'bg-[#151929]/80 border border-white/[0.06] backdrop-blur'
    : 'bg-white border border-gray-200/60 shadow-sm';

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      
      {/* ── Header Card ── */}
      <div className={`${card} p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-akai to-sakura-dark rounded-xl flex items-center justify-center text-white shadow-md shadow-akai/25">
            <QrCode size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold">Staff Check-in</h1>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Quét QR hoặc nhập mã vé sự kiện để duyệt check-in tự động
            </p>
          </div>
        </div>
        
        <div className={`py-1.5 px-3 rounded-xl border text-xs font-semibold ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-gray-50 border-gray-100'}`}>
          👤 Nhân viên: <span className="text-akai font-bold">{user?.name}</span>
        </div>
      </div>

      {/* ── Camera Scanner Area ── */}
      {hasCameraPermission === false && (
        <div className="w-full p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs text-center">
          ❌ Vui lòng cấp quyền truy cập camera trong cài đặt trình duyệt để có thể quét QR trực tiếp.
        </div>
      )}
      <div className={`${card} p-6 rounded-3xl overflow-hidden flex flex-col items-center justify-center relative min-h-[380px]`}>
        
        {/* Scanner Viewfinder Box */}
        <div className="w-full max-w-sm aspect-square relative rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10 shadow-inner">
          
          <div 
            id={elementId} 
            className="absolute inset-0 w-full h-full object-cover [&>video]:object-cover"
          />

          {!scanning && (
            <div className="z-10 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-400">
                <Camera size={32} />
              </div>
              <div>
                <p className="text-white text-sm font-bold">Camera đang tắt</p>
                <p className="text-gray-500 text-xs mt-1">Bấm nút bên dưới để bắt đầu quét vé</p>
              </div>
            </div>
          )}

          {/* Neon Target overlay when scanning */}
          {scanning && (
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              {/* Viewfinder Target square */}
              <div className="w-3/4 h-3/4 border-2 border-emerald-500/20 rounded-2xl relative">
                {/* Neon Corners */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg" />
                
                {/* Horizontal scanner beam line */}
                <div className="absolute left-2 right-2 h-0.5 bg-emerald-500 shadow-md shadow-emerald-500/50 top-1/2 animate-[pulse_2s_infinite] -translate-y-1/2" />
              </div>
            </div>
          )}
        </div>

        {/* Scanner Control buttons */}
        <div className="mt-5 w-full max-w-sm flex flex-col items-center gap-3">
          {scanning ? (
            <button
              onClick={stopScanning}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/25"
            >
              <CameraOff size={16} />
              Tắt Camera
            </button>
          ) : (
            <button
              onClick={startScanning}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-akai to-sakura-dark text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-akai/20 transition-all"
            >
              <Camera size={16} />
              Mở Camera bắt đầu quét QR
            </button>
          )}
          <p className={`text-[11px] text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {scanning ? "Đưa mã QR của vé vào trung tâm camera để quét tự động" : "Yêu cầu cấp quyền truy cập camera trên trình duyệt di động"}
          </p>
        </div>
      </div>

      {/* ── Manual Input Area ── */}
      <div className={`${card} p-5 rounded-2xl`}>
        <div className="flex items-center gap-2 mb-3">
          <Keyboard size={16} className="text-akai" />
          <h2 className="text-xs font-bold uppercase tracking-wider">Hoặc nhập mã vé thủ công</h2>
        </div>
        <form onSubmit={handleManualCheckIn} className="flex gap-2">
          <input
            type="text"
            placeholder="Ví dụ: VE2605240001"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            disabled={checking}
            className={`
              flex-1 px-4 py-3 rounded-xl text-xs outline-none transition-all duration-200 font-mono font-bold
              ${isDark
                ? 'bg-white/[0.03] text-gray-200 border border-white/[0.06] focus:border-akai focus:ring-1 focus:ring-akai'
                : 'bg-gray-50 text-gray-800 border border-gray-200 focus:border-akai focus:ring-1 focus:ring-akai'
              }
            `}
          />
          <button
            type="submit"
            disabled={checking || !manualCode.trim()}
            className="px-6 py-3 bg-gradient-to-r from-akai to-sakura-dark text-white rounded-xl font-bold text-xs hover:shadow-md hover:shadow-akai/20 disabled:opacity-40 transition-all shrink-0"
          >
            Check-in
          </button>
        </form>
      </div>

      {/* ── Recent History Area ── */}
      <div className={`${card} p-5 rounded-2xl space-y-3`}>
        <div className="flex items-center justify-between border-b pb-2.5 border-gray-100 dark:border-white/[0.04]">
          <div className="flex items-center gap-2">
            <History size={16} className="text-gray-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Lịch sử check-in vừa qua</h2>
          </div>
          <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Tối đa 5 lượt gần nhất</span>
        </div>

        {history.length === 0 ? (
          <p className={`text-center py-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Chưa có lượt check-in nào được ghi nhận trong phiên này.
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/[0.04] text-[13px]">
            {history.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-akai text-[12px]">{item.ticketCode}</span>
                    <span className="text-[11px] opacity-60">— {item.passengerName}</span>
                  </div>
                  <p className="text-[10px] opacity-40">
                    {item.timestamp.toLocaleTimeString('vi-VN')}
                  </p>
                </div>
                <span className={`text-xs font-bold ${item.status === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {item.status === 'success' ? 'Thành công ✅' : 'Thất bại ❌'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Result Detail Dialog Overlay ── */}
      {showResult && scanResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className={`${card} rounded-3xl p-6 max-w-sm w-full shadow-2xl overflow-hidden relative border border-white/10`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Badge */}
            {scanResult.success ? (
              <div className="flex flex-col items-center text-center pb-5 border-b border-gray-100 dark:border-white/[0.04]">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-3 animate-bounce">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-lg font-bold text-emerald-500">CHECK-IN THÀNH CÔNG</h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{scanResult.message}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center pb-5 border-b border-gray-100 dark:border-white/[0.04]">
                <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-3">
                  <XCircle size={32} />
                </div>
                <h3 className="text-lg font-bold text-red-500">CHECK-IN THẤT BẠI</h3>
                <p className="text-xs text-red-400 mt-1 font-semibold">{scanResult.message}</p>
              </div>
            )}

            {/* Guest Details */}
            {scanResult.success && (
              <div className="py-5 space-y-3">
                <div className="flex justify-between border-b pb-1.5 border-gray-50 dark:border-white/[0.02]">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Hành khách</span>
                  <span className="text-xs font-bold">{scanResult.passengerName}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 border-gray-50 dark:border-white/[0.02]">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Số ghế</span>
                  <span className="text-xs font-bold text-akai">{scanResult.seatNumber}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 border-gray-50 dark:border-white/[0.02]">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Hạng vé</span>
                  <span className="text-xs font-bold">{scanResult.ticketType}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sự kiện</span>
                  <span className="text-xs font-bold truncate max-w-[180px]">{scanResult.eventTitle}</span>
                </div>
              </div>
            )}

            {!scanResult.success && (
              <div className="py-6 text-center space-y-2">
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mã vé đã quét</p>
                <p className="font-mono text-base font-bold text-akai">{scanResult.ticketCode}</p>
                <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 text-red-500 text-[11px]">
                  Vui lòng kiểm tra lại trạng thái vé trên hệ thống hoặc thử quét lại.
                </div>
              </div>
            )}

            {/* Action button to continue */}
            <button
              onClick={nextScan}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-akai to-sakura-dark text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-akai/20 transition-all mt-2"
            >
              <ListRestart size={16} />
              Quét Khách Tiếp Theo
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
