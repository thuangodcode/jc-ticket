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
  ticketType?: string;
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

  const fetchCheckInHistory = async () => {
    try {
      const res = await ticketService.getAllTickets({ status: 'used', page: 1, limit: 5 } as any);
      if (res && res.data) {
        const historyItems: HistoryItem[] = res.data.map((ticket: any) => ({
          ticketCode: ticket.ticketCode,
          passengerName: ticket.passengerName || 'Khách mời',
          timestamp: new Date(ticket.updatedAt || ticket.usedAt || Date.now()),
          status: 'success',
          message: 'Thành công',
          ticketType: ticket.ticketType
        }));
        setHistory(historyItems);
      }
    } catch (err) {
      console.error('Failed to fetch check-in history:', err);
    }
  };

  useEffect(() => {
    // Check permission
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setHasCameraPermission(true))
      .catch(() => setHasCameraPermission(false));

    fetchCheckInHistory();

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
    
    // Look for VE followed by 10 digits (Standard ticket code format)
    const match = trimmed.match(/VE\d{10}/);
    if (match) {
      return match[0];
    }
    
    // Fallback: If it is a full URL containing verify-ticket or verify
    if (trimmed.includes('/verify-ticket/')) {
      const code = trimmed.split('/verify-ticket/')[1] || trimmed;
      return code.replace(/[^a-zA-Z0-9]/g, '');
    }
    if (trimmed.includes('/verify/')) {
      const code = trimmed.split('/verify/')[1] || trimmed;
      return code.replace(/[^a-zA-Z0-9]/g, '');
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
          message: 'Thành công',
          ticketType: verifyRes.data?.ticketType
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
    ? 'bg-[#151929]/90 border border-white/[0.06] backdrop-blur-xl shadow-2xl shadow-black/25'
    : 'bg-white border border-gray-200/60 shadow-xl shadow-gray-100/50';

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 px-2 md:px-0">
      
      {/* ── Header Card ── */}
      <div className={`${card} p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 hover:border-akai/20`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-akai via-akai to-sakura-dark rounded-2xl flex items-center justify-center text-white shadow-lg shadow-akai/30 animate-[pulse_3s_infinite]">
            <QrCode size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-akai to-sakura-dark bg-clip-text text-transparent">Staff Check-in</h1>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Duyệt kiểm soát ra vào bằng camera hoặc nhập mã vé thủ công
            </p>
          </div>
        </div>
        
        <div className={`self-start sm:self-center py-2 px-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
          isDark 
            ? 'bg-white/[0.03] border-white/[0.08] text-gray-200' 
            : 'bg-gray-50 border-gray-100 text-gray-700'
        }`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          Nhân viên: <span className="text-akai font-extrabold">{user?.name}</span>
        </div>
      </div>

      {/* ── Camera Scanner Area ── */}
      {hasCameraPermission === false && (
        <div className="w-full p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs text-center font-medium animate-pulse">
          ❌ Vui lòng cấp quyền truy cập camera trong cài đặt trình duyệt để có thể quét QR trực tiếp.
        </div>
      )}
      
      <div className={`${card} p-6 rounded-3xl overflow-hidden flex flex-col items-center justify-center relative min-h-[420px]`}>
        
        {/* Scanner Viewfinder Box */}
        <div className="w-full max-w-sm aspect-square relative rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-white/10 shadow-inner group">
          
          <div 
            id={elementId} 
            className="absolute inset-0 w-full h-full object-cover [&>video]:object-cover"
          />

          {!scanning && (
            <div className="z-10 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-20 h-20 bg-white/[0.04] border border-white/10 rounded-3xl flex items-center justify-center text-gray-400 group-hover:scale-105 group-hover:border-akai/40 transition-all duration-300">
                <Camera size={36} className="text-gray-300" />
              </div>
              <div>
                <p className="text-white text-base font-bold">Camera đang tắt</p>
                <p className="text-gray-500 text-xs mt-1 max-w-[200px] mx-auto">Chạm vào nút bên dưới để mở camera quét vé</p>
              </div>
            </div>
          )}

          {/* Neon Target overlay when scanning */}
          {scanning && (
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              {/* Viewfinder Target square */}
              <div className="w-2/3 h-2/3 border-2 border-emerald-500/20 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                {/* Neon Corners */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                
                {/* Horizontal scanner beam line */}
                <div className="absolute left-1.5 right-1.5 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399] top-1/2 animate-[bounce_3s_infinite] -translate-y-1/2" />
              </div>
            </div>
          )}
        </div>

        {/* Scanner Control buttons */}
        <div className="mt-6 w-full max-w-sm flex flex-col items-center gap-3">
          {scanning ? (
            <button
              onClick={stopScanning}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 active:scale-[0.99] transition-all shadow-lg shadow-red-500/20"
            >
              <CameraOff size={16} />
              Tắt Camera
            </button>
          ) : (
            <button
              onClick={startScanning}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-akai to-sakura-dark text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-akai/20 active:scale-[0.99] transition-all"
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
      <div className={`${card} p-6 rounded-2xl transition-all duration-300 hover:border-akai/20`}>
        <div className="flex items-center gap-2 mb-4">
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
              flex-1 px-4 py-3.5 rounded-xl text-xs outline-none transition-all duration-200 font-mono font-bold tracking-wider
              ${isDark
                ? 'bg-white/[0.02] text-gray-200 border border-white/[0.06] focus:border-akai focus:ring-1 focus:ring-akai/50 focus:bg-white/[0.04]'
                : 'bg-gray-50 text-gray-800 border border-gray-200 focus:border-akai focus:ring-1 focus:ring-akai/50 focus:bg-white'
              }
            `}
          />
          <button
            type="submit"
            disabled={checking || !manualCode.trim()}
            className="px-6 py-3.5 bg-gradient-to-r from-akai to-sakura-dark text-white rounded-xl font-bold text-xs hover:shadow-md hover:shadow-akai/20 disabled:opacity-40 transition-all shrink-0 active:scale-[0.98]"
          >
            Check-in
          </button>
        </form>
      </div>

      {/* ── Recent History Area ── */}
      <div className={`${card} p-6 rounded-2xl space-y-4 transition-all duration-300 hover:border-akai/20`}>
        <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-white/[0.04]">
          <div className="flex items-center gap-2">
            <History size={16} className="text-gray-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Lịch sử check-in vừa qua</h2>
          </div>
          <span className={`text-[10px] py-0.5 px-2 rounded-full ${isDark ? 'bg-white/[0.03] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
            Đồng bộ thời gian thực 🔄
          </span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Chưa có lượt check-in nào được ghi nhận.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/[0.04] text-[13px] -mx-2">
            {history.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 px-2 rounded-xl transition-all duration-200 hover:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  {/* Status Indicator Dot */}
                  <div className="relative flex items-center justify-center">
                    <span className={`absolute inline-flex h-2.5 w-2.5 rounded-full ${item.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'} opacity-75 ${item.status === 'success' ? 'animate-ping' : ''}`} />
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${item.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-akai text-[13px]">{item.ticketCode}</span>
                      <span className={`text-[10px] opacity-75 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {item.passengerName}
                      </span>
                      {item.ticketType && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          item.ticketType === 'vip' 
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                            : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}>
                          {item.ticketType.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Check-in lúc: {item.timestamp.toLocaleTimeString('vi-VN')}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-extrabold ${item.status === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {item.status === 'success' ? 'Thành công' : 'Thất bại'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Result Detail Dialog Overlay ── */}
      {showResult && scanResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div 
            className={`${card} rounded-3xl p-6 max-w-sm w-full shadow-2xl overflow-hidden relative border border-white/10 animate-[scaleIn_0.2s_ease-out]`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Badge */}
            {scanResult.success ? (
              <div className="flex flex-col items-center text-center pb-5 border-b border-gray-100 dark:border-white/[0.04]">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3 animate-[bounce_1.5s_infinite]">
                  <CheckCircle size={36} />
                </div>
                <h3 className="text-lg font-bold text-emerald-500 tracking-wider">CHECK-IN THÀNH CÔNG</h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{scanResult.message}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center pb-5 border-b border-gray-100 dark:border-white/[0.04]">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-3 animate-shake">
                  <XCircle size={36} />
                </div>
                <h3 className="text-lg font-bold text-red-500 tracking-wider">CHECK-IN THẤT BẠI</h3>
                <p className="text-xs text-red-400 mt-1 font-semibold">{scanResult.message}</p>
              </div>
            )}

            {/* Guest Details */}
            {scanResult.success && (
              <div className="py-5 space-y-3">
                <div className="flex justify-between border-b pb-2 border-gray-50 dark:border-white/[0.02]">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Hành khách</span>
                  <span className="text-xs font-bold">{scanResult.passengerName}</span>
                </div>
                <div className="flex justify-between border-b pb-2 border-gray-50 dark:border-white/[0.02]">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Số ghế</span>
                  <span className="text-xs font-bold text-akai">{scanResult.seatNumber}</span>
                </div>
                <div className="flex justify-between border-b pb-2 border-gray-50 dark:border-white/[0.02]">
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
              <div className="py-6 text-center space-y-3">
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mã vé đã quét</p>
                <p className="font-mono text-lg font-extrabold text-akai tracking-wider bg-akai/5 py-2 rounded-xl border border-akai/10">{scanResult.ticketCode}</p>
                <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 text-red-400 text-[11px] font-medium leading-relaxed">
                  Mã vé này không hợp lệ hoặc đã qua check-in trước đó. Vui lòng kiểm tra lại.
                </div>
              </div>
            )}

            {/* Action button to continue */}
            <button
              onClick={nextScan}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-akai to-sakura-dark text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-akai/20 active:scale-[0.98] transition-all mt-2"
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
