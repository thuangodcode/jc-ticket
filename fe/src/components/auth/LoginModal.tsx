import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { useUserAuth } from '../../contexts/useUserAuth';

/**
 * LoginModal - Login form modal component
 * Handles user login and updates global auth state
 */
const LoginModal: React.FC = () => {
  const { isDark } = useTheme();
  const { switchModal, closeModal } = useAuthModal();
  const { login, isLoading: authLoading } = useUserAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Email và mật khẩu không được để trống');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 LoginModal: Calling login()...');
      // Use UserAuthContext login method
      const loggedInUser = await login(formData.email, formData.password);
      console.log('🔐 LoginModal: login() completed, closing modal...');

      // 🎉 Login successful - close modal
      closeModal();
      console.log('🔐 LoginModal: modal closed');
      setFormData({ email: '', password: '' });

      // Show success toast
      toast.success('🎉 Đăng nhập thành công! Chào mừng quay trở lại.', {
        duration: 3000,
        position: 'top-center',
      });

      // Redirect admin to dashboard
      if (loggedInUser && loggedInUser.role === 'admin') {
        navigate('/admin');
      }
    } catch (err: unknown) {
      console.error('🔐 LoginModal: Login failed:', err);
      // Error is already set in context, but we can also display it here
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      } else {
        errorMessage = err instanceof Error ? err.message : errorMessage;
      }
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`, {
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

      {/* Email Input */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-zinc-300' : 'text-charcoal'}`}>
          Email đăng nhập
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="your@email.com"
          disabled={isLoading || authLoading}
          className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-all ${
            isDark
              ? 'border-zinc-700 bg-zinc-800 text-white placeholder-zinc-600 focus:border-akai'
              : 'border-gray-300 bg-white text-ink placeholder-gray-400 focus:border-akai'
          }`}
        />
      </motion.div>

      {/* Password Input */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-zinc-300' : 'text-charcoal'}`}>
          Mật khẩu
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            disabled={isLoading || authLoading}
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
      </motion.div>

      {/* Forgot Password Link */}
      <motion.button
        type="button"
        onClick={() => switchModal('forgot-password')}
        className="text-sm text-akai hover:text-sakura-dark transition-colors font-semibold"
      >
        Quên Mật Khẩu?
      </motion.button>

      {/* Login Button */}
      <motion.button
        type="submit"
        disabled={isLoading || authLoading}
        whileHover={!isLoading && !authLoading ? { scale: 1.02 } : {}}
        whileTap={!isLoading && !authLoading ? { scale: 0.98 } : {}}
        className="w-full py-3 bg-gradient-to-r from-akai to-sakura text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-akai/50 hover:shadow-xl hover:shadow-akai/70"
      >
        {isLoading || authLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Đang Đăng Nhập...
          </div>
        ) : (
          'Đăng Nhập'
        )}
      </motion.button>

      {/* Register Link */}
      <motion.div className="text-center">
        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-charcoal/70'}`}>
          Chưa có tài khoản?{' '}
          <button
            type="button"
            onClick={() => switchModal('register')}
            className="text-akai hover:text-sakura-dark font-semibold transition-colors"
          >
            Đăng Ký
          </button>
        </p>
      </motion.div>
    </motion.form>
  );
};

export default LoginModal;