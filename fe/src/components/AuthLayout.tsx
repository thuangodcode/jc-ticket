import React, { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface AuthLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  backTo?: string;
  backgroundImage?: boolean;
}

/**
 * Auth Layout Component - Reusable layout for authentication pages
 * Features: Japanese-themed background, responsive design, back button, dark mode
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  showBackButton = true,
  backTo = '/',
  backgroundImage = true,
}) => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gradient-to-br from-black via-gray-950 to-black' : 'bg-gradient-to-br from-white to-gray-50'
    }`}>
      {/* Decorative Background Elements */}
      {backgroundImage && (
        <>
          {/* Sakura Petals Animation */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-akai/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-sakura/5 rounded-full blur-3xl" />
        </>
      )}

      {/* Back Button */}
      {showBackButton && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-6 left-6 z-50"
        >
          <Link
            to={backTo}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              isDark
                ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                : 'text-charcoal/70 hover:text-ink hover:bg-gray-100'
            }`}
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-semibold">Back</span>
          </Link>
        </motion.div>
      )}

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className={`w-full max-w-md rounded-2xl p-8 md:p-10 shadow-2xl ${
            isDark
              ? 'bg-gradient-to-br from-zinc-900 to-gray-900 border border-zinc-800'
              : 'bg-white border border-gray-200'
          }`}
        >
          {/* Decorative Top Line */}
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-akai to-transparent rounded-full" />

          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>

          {/* Decorative Bottom Line */}
          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-sakura to-transparent rounded-full" />
        </motion.div>
      </div>

      {/* Japanese Text Watermark */}
      <div className={`fixed bottom-6 right-6 text-xs font-semibold ${
        isDark ? 'text-zinc-700' : 'text-gray-300'
      }`}>
        JC-Ticket 🎌
      </div>
    </div>
  );
};

export default AuthLayout;
