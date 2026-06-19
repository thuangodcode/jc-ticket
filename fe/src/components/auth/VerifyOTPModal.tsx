import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { useUserAuth } from '../../contexts/useUserAuth';
import OTPInput from '../OTPInput';
import { verifyRegistrationOTP, verifyResetOTP } from '../../services/authService';

/**
 * VerifyOTPModal - OTP verification modal component
 */
const VerifyOTPModal: React.FC = () => {
  const { isDark } = useTheme();
  const { switchModal, modalData, closeModal } = useAuthModal();
  const { login: autoLogin, isLoading: authLoading } = useUserAuth();
  const navigate = useNavigate();

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  const email = modalData?.email || '';
  const flow = modalData?.flow || 'registration';

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async (customOtp?: string) => {
    const otpToVerify = customOtp || otp;
    if (!otpToVerify || otpToVerify.length !== 6) {
      setError('Vui lòng nhập mã OTP 6 chữ số');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let response;

      if (flow === 'registration') {
        response = await verifyRegistrationOTP({ email, otp: otpToVerify });
      } else {
        response = await verifyResetOTP({ email, otp: otpToVerify });
      }

      if (response.success) {
        setSuccess(true);

        if (flow === 'registration') {
          if (response.token) {
            localStorage.setItem('accessToken', response.token);
          }
          // 🎉 Registration flow: Verify OTP → Auto-login → Close modal → Show toast
          setTimeout(async () => {
            try {
              // Auto-login user
              const password = modalData?.password || '';
              let loggedInUser;
              if (password) {
                loggedInUser = await autoLogin(email, password);
              }

              // Close modal
              closeModal();
              setOtp('');
              setSuccess(false);

              // Show success toast
              toast.success('🎉 Đăng ký thành công! Chào mừng bạn đến với JC-Ticket.', {
                duration: 4000,
                position: 'top-center',
              });

              // Redirect admin/staff to dashboard
              if (loggedInUser) {
                if (loggedInUser.role === 'admin') {
                  navigate('/admin');
                } else if (loggedInUser.role === 'event_admin') {
                  navigate('/event-admin');
                } else if (loggedInUser.role === 'staff') {
                  navigate('/staff/check-in');
                }
              }
            } catch (loginErr) {
              console.error('Auto-login failed:', loginErr);
              toast.error('Xác thực OTP thành công, nhưng đăng nhập tự động thất bại. Vui lòng đăng nhập thủ công.', {
                duration: 4000,
                position: 'top-center',
              });
              closeModal();
            }
          }, 1500);
        } else {
          // 🔐 Password reset flow: Switch to reset-password modal
          toast.success('✅ Xác thực OTP thành công! Tiếp tục đặt mật khẩu mới.', {
            duration: 3000,
            position: 'top-center',
          });
          setTimeout(() => {
            switchModal('reset-password', { email, flow: 'password-reset', otp: otpToVerify });
          }, 1000);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Xác thực OTP thất bại';
      const axiosErr = err as { response?: { data?: { message?: string } } } | Error | unknown;
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (axiosErr as { response?: { data?: { message?: string } } }).response?.data?.message ||
            errorMessage
          : errorMessage;
      setError(message);
      toast.error(`❌ ${message}`, {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timeLeft > 300) return; // Chỉ cho phép resend khi còn dưới 5 phút

    setError('');
    // TODO: Gọi API resend OTP
    setTimeLeft(600);
    setOtp('');
    // Ví dụ: await resendOTPService({ email });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Description */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-charcoal/70'}`}>
          <span className="font-semibold">{email}</span> Nhập mã OTP được gửi đến
        </p>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg flex items-start gap-3 ${
            isDark ? 'bg-red-900/20 border border-red-700/50' : 'bg-red-50 border border-red-200'
          }`}
        >
          <AlertCircle size={18} className={isDark ? 'text-red-400' : 'text-red-600'} />
          <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
        </motion.div>
      )}

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg flex items-start gap-3 ${
            isDark ? 'bg-green-900/20 border border-green-700/50' : 'bg-green-50 border border-green-200'
          }`}
        >
          <CheckCircle size={18} className={isDark ? 'text-green-400' : 'text-green-600'} />
          <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
            {flow === 'registration' ? 'Đăng ký thành công!' : 'Xác thực OTP thành công!'}
          </p>
        </motion.div>
      )}

      {/* OTP Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="py-6"
      >
        <OTPInput
          length={6}
          value={otp}
          onChange={setOtp}
          onComplete={handleVerifyOTP}
          disabled={isLoading || success}
          isDark={isDark}
        />
      </motion.div>

      {/* Timer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center justify-center gap-2"
      >
        <div
          className={`inline-block px-3 py-1.5 rounded-lg font-mono font-semibold ${
            timeLeft > 300
              ? isDark
                ? 'bg-zinc-800 text-green-400'
                : 'bg-green-50 text-green-600'
              : isDark
              ? 'bg-red-900/20 text-red-400'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {formatTime(timeLeft)}
        </div>
        <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-charcoal/50'}`}>Thời gian còn lại</span>
      </motion.div>

      <motion.button
        type="button"
        onClick={() => handleVerifyOTP()}
        disabled={isLoading || authLoading || success || otp.length !== 6}
        whileHover={!isLoading && !authLoading && !success && otp.length === 6 ? { scale: 1.02 } : {}}
        whileTap={!isLoading && !authLoading && !success && otp.length === 6 ? { scale: 0.98 } : {}}
        className="w-full py-3 bg-gradient-to-r from-akai to-sakura text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-akai/50 hover:shadow-xl hover:shadow-akai/70"
      >
        {isLoading || authLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {authLoading ? 'Đang đăng nhập...' : 'Đang xác nhận...'}
          </div>
        ) : (
          'Xác Nhận'
        )}
      </motion.button>

      {/* Resend OTP Button */}
      <motion.button
        type="button"
        onClick={handleResendOTP}
        disabled={isLoading || timeLeft > 300}
        className={`w-full py-2 rounded-lg font-semibold text-sm transition-all ${
          timeLeft > 300
            ? isDark
              ? 'text-zinc-500 cursor-not-allowed'
              : 'text-charcoal/50 cursor-not-allowed'
            : isDark
            ? 'text-akai hover:text-sakura-dark'
            : 'text-akai hover:text-sakura-dark'
        }`}
      >
        {timeLeft > 300
          ? `Có thể gửi lại sau ${Math.ceil((600 - timeLeft) / 60)} phút`
          : 'Gửi lại Mã OTP'}
      </motion.button>
    </motion.div>
  );
};

export default VerifyOTPModal;