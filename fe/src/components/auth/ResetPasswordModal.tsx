import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { resetPasswordService } from '../../services/authService';

/**
 * ResetPasswordModal - Password reset form modal component
 */
const ResetPasswordModal: React.FC = () => {
  const { isDark } = useTheme();
  const { closeModal, modalData } = useAuthModal();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  const email = modalData?.email || '';

  const calculatePasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    if (!password) return 'weak';

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    const isLong = password.length >= 8;

    const score = [hasUppercase, hasLowercase, hasNumber, hasSpecial, isLong].filter(Boolean).length;

    if (score >= 4) return 'strong';
    if (score >= 2) return 'medium';
    return 'weak';
  };

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.password || !formData.confirmPassword) {
      setError('Vui lòng điền tất cả các trường');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không trùng khớp');
      return;
    }

    // No minimum length restriction — backend will accept any non-empty password

    setIsLoading(true);
    try {
      // Note: OTP is already verified in the previous step
      const response = await resetPasswordService({
        email,
        otp: '', // OTP was already verified in verify-otp step
        newPassword: formData.password,
      });

      if (response.success) {
        setSuccess(true);

        // 🎉 Show success toast
        toast.success('✅ Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập.', {
          duration: 4000,
          position: 'top-center',
        });

        setTimeout(() => {
          closeModal();
        }, 1800);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại';
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

  const strengthColor = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const strengthText = {
    weak: 'Yếu',
    medium: 'Trung bình',
    strong: 'Mạnh',
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
        Đặt mật khẩu mới của bạn.
      </motion.p>

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
            Mật khẩu đã được đặt lại!
          </p>
        </motion.div>
      )}

      {/* Password Input */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-zinc-300' : 'text-charcoal'}`}>
          Mật Khẩu Mới
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading || success}
            className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-all pr-12 ${
              isDark
                ? 'border-zinc-700 bg-zinc-800 text-white placeholder-zinc-600 focus:border-akai'
                : 'border-gray-300 bg-white text-ink placeholder-gray-400 focus:border-akai'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-akai hover:text-sakura-dark transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {formData.password && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-2"
          >
            <div className="flex-1 h-1.5 bg-zinc-700/30 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strengthColor[passwordStrength]}`}
                style={{
                  width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%',
                }}
              />
            </div>
            <span className={`text-xs font-semibold ${
              passwordStrength === 'weak' ? 'text-red-400' :
              passwordStrength === 'medium' ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {strengthText[passwordStrength]}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Confirm Password Input */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-zinc-300' : 'text-charcoal'}`}>
          Xác Nhận Mật Khẩu
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="••••••••"
            disabled={isLoading || success}
            className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-all pr-12 ${
              isDark
                ? 'border-zinc-700 bg-zinc-800 text-white placeholder-zinc-600 focus:border-akai'
                : 'border-gray-300 bg-white text-ink placeholder-gray-400 focus:border-akai'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-akai hover:text-sakura-dark transition-colors"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>

          {formData.confirmPassword && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-12 top-1/2 -translate-y-1/2"
            >
              {formData.password === formData.confirmPassword ? (
                <CheckCircle size={18} className="text-green-500" />
              ) : (
                <AlertCircle size={18} className="text-red-500" />
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Reset Button */}
      <motion.button
        type="submit"
        disabled={isLoading || success}
        whileHover={!isLoading && !success ? { scale: 1.02 } : {}}
        whileTap={!isLoading && !success ? { scale: 0.98 } : {}}
        className="w-full py-3 bg-gradient-to-r from-akai to-sakura text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-akai/50 hover:shadow-xl hover:shadow-akai/70"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Đang đặt lại...
          </div>
        ) : success ? (
          'Đặt lại thành công'
        ) : (
          'Đặt Lại Mật Khẩu'
        )}
      </motion.button>
    </motion.form>
  );
};

export default ResetPasswordModal;