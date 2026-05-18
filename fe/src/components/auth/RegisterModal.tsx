import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { registerUser } from '../../services/authService';

/**
 * RegisterModal - Registration form modal component
 */
const RegisterModal: React.FC = () => {
  const { isDark } = useTheme();
  const { switchModal } = useAuthModal();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

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

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Vui lòng điền tất cả các trường');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không trùng khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải từ 6 ký tự trở lên');
      return;
    }

    setIsLoading(true);
    try {
      const response = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (response.success) {
        // 📧 Show info toast about OTP
        toast.success('📧 Mã xác thực OTP đã được gửi đến email của bạn!', {
          duration: 3000,
          position: 'top-center',
        });

        switchModal('verify-otp', { 
          email: formData.email,
          password: formData.password,
          flow: 'registration' 
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng ký thất bại';
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

      {/* Name Input */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-zinc-300' : 'text-charcoal'}`}>
          Họ và Tên
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nhập tên của bạn"
          disabled={isLoading}
          className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-all ${
            isDark
              ? 'border-zinc-700 bg-zinc-800 text-white placeholder-zinc-600 focus:border-akai'
              : 'border-gray-300 bg-white text-ink placeholder-gray-400 focus:border-akai'
          }`}
        />
      </motion.div>

      {/* Email Input */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-zinc-300' : 'text-charcoal'}`}>
          Email đăng nhập
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="your@email.com"
          disabled={isLoading}
          className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-all ${
            isDark
              ? 'border-zinc-700 bg-zinc-800 text-white placeholder-zinc-600 focus:border-akai'
              : 'border-gray-300 bg-white text-ink placeholder-gray-400 focus:border-akai'
          }`}
        />
      </motion.div>

      {/* Password Input */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-zinc-300' : 'text-charcoal'}`}>
          Mật khẩu
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
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
                style={{ width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%' }}
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-zinc-300' : 'text-charcoal'}`}>
          Xác Nhận Mật Khẩu
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="••••••••"
            disabled={isLoading}
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

      {/* Register Button */}
      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={!isLoading ? { scale: 1.02 } : {}}
        whileTap={!isLoading ? { scale: 0.98 } : {}}
        className="w-full py-3 bg-gradient-to-r from-akai to-sakura text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-akai/50 hover:shadow-xl hover:shadow-akai/70"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Đang Đăng Ký...
          </div>
        ) : (
          'Đăng Ký'
        )}
      </motion.button>

      {/* Login Link */}
      <motion.div className="text-center">
        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-charcoal/70'}`}>
          Đã có tài khoản?{' '}
          <button
            type="button"
            onClick={() => switchModal('login')}
            className="text-akai hover:text-sakura-dark font-semibold transition-colors"
          >
            Đăng Nhập
          </button>
        </p>
      </motion.div>
    </motion.form>
  );
};

export default RegisterModal;