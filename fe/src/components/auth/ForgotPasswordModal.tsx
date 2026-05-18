import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { forgotPassword } from '../../services/authService';

/**
 * ForgotPasswordModal - Password reset request modal component
 * Features: Email input, OTP sending, transition to OTP verification
 */
const ForgotPasswordModal: React.FC = () => {
  const { isDark } = useTheme();
  const { switchModal } = useAuthModal();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await forgotPassword({ email });

      if (response.success) {
        setSuccess(true);

        // 📧 Show info toast
        toast.success('📧 Mã OTP đã được gửi đến email của bạn!', {
          duration: 3000,
          position: 'top-center',
        });

        // After 1.5 seconds, switch to OTP verification
        setTimeout(() => {
          switchModal('verify-otp', {
            email,
            flow: 'password-reset',
          });
        }, 1500);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Yêu cầu thất bại';
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

  return (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-sm ${isDark ? 'text-zinc-400' : 'text-charcoal/70'}`}
      >
        Nhập email được đăng ký. Chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
      </motion.p>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg flex items-start gap-3 ${
            isDark
              ? 'bg-red-900/20 border border-red-700/50'
              : 'bg-red-50 border border-red-200'
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
            isDark
              ? 'bg-green-900/20 border border-green-700/50'
              : 'bg-green-50 border border-green-200'
          }`}
        >
          <CheckCircle size={18} className={isDark ? 'text-green-400' : 'text-green-600'} />
          <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
            Mã OTP đã được gửi. Đang chuyển hướng...
          </p>
        </motion.div>
      )}

      {/* Email Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className={`block text-sm font-semibold mb-2 ${
          isDark ? 'text-zinc-300' : 'text-charcoal'
        }`}>
          Email đăng nhập
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={isLoading || success}
          className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-all ${
            isDark
              ? 'border-zinc-700 bg-zinc-800 text-white placeholder-zinc-600 focus:border-akai focus:shadow-lg focus:shadow-akai/30'
              : 'border-gray-300 bg-white text-ink placeholder-gray-400 focus:border-akai focus:shadow-lg focus:shadow-akai/20'
          }`}
        />
      </motion.div>

      {/* Submit Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        type="submit"
        disabled={isLoading || success}
        whileHover={!isLoading && !success ? { scale: 1.02 } : {}}
        whileTap={!isLoading && !success ? { scale: 0.98 } : {}}
        className="w-full py-3 bg-gradient-to-r from-akai to-sakura text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-akai/50 hover:shadow-xl hover:shadow-akai/70"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Đang gửi...
          </div>
        ) : success ? (
          'Đang chuyển hướng...'
        ) : (
          'Gửi Mã OTP'
        )}
      </motion.button>

      {/* Back to Login */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <button
          type="button"
          onClick={() => switchModal('login')}
          className={`text-sm font-semibold transition-colors ${
            isDark
              ? 'text-zinc-400 hover:text-akai'
              : 'text-charcoal/70 hover:text-akai'
          }`}
        >
          Quay lại Đăng Nhập
        </button>
      </motion.div>
    </motion.form>
  );
};

export default ForgotPasswordModal;
