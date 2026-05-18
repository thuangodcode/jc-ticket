import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import LoginModal from './auth/LoginModal';
import RegisterModal from './auth/RegisterModal';
import ForgotPasswordModal from './auth/ForgotPasswordModal';
import VerifyOTPModal from './auth/VerifyOTPModal';
import ResetPasswordModal from './auth/ResetPasswordModal';

/**
 * AuthModal - Main modal container
 * Renders different modal content based on currentModal state
 */
const AuthModal: React.FC = () => {
  const { isDark } = useTheme();
  const { isOpen, currentModal, closeModal } = useAuthModal();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  /**
   * Get modal title based on current modal type
   */
  const getModalTitle = (): string => {
    switch (currentModal) {
      case 'login':
        return 'Đăng Nhập';
      case 'register':
        return 'Đăng Ký';
      case 'forgot-password':
        return 'Quên Mật Khẩu';
      case 'verify-otp':
        return 'Xác Thực OTP';
      case 'reset-password':
        return 'Đặt Mật Khẩu Mới';
      default:
        return '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeModal}
            className={`fixed inset-0 z-40 backdrop-blur-sm ${
              isDark ? 'bg-black/60' : 'bg-black/40'
            }`}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          >
            {/* Modal Card */}
            <motion.div
              layout
              className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
                isDark
                  ? 'bg-gradient-to-br from-zinc-900/95 via-gray-900/95 to-black/95 border border-zinc-700/50'
                  : 'bg-gradient-to-br from-white/95 via-white/95 to-gray-50/95 border border-gray-200/50'
              }`}
              style={{
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Decorative Top Line */}
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-akai to-transparent rounded-full" />

              {/* Modal Header */}
              <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-zinc-700/30">
                <motion.h2
                  key={currentModal}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`text-2xl font-bold ${
                    isDark ? 'text-white' : 'text-ink'
                  }`}
                >
                  {getModalTitle()}
                </motion.h2>

                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeModal}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Modal Content - With transitions */}
              <div className="px-6 py-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <AnimatePresence mode="wait">
                  {currentModal === 'login' && <LoginModal key="login" />}
                  {currentModal === 'register' && <RegisterModal key="register" />}
                  {currentModal === 'forgot-password' && <ForgotPasswordModal key="forgot" />}
                  {currentModal === 'verify-otp' && <VerifyOTPModal key="verify" />}
                  {currentModal === 'reset-password' && <ResetPasswordModal key="reset" />}
                </AnimatePresence>
              </div>

              {/* Decorative Bottom Line */}
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-sakura to-transparent rounded-full" />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;