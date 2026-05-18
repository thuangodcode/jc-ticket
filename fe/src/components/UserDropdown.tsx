import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import type { User as UserType } from '../contexts/UserAuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface UserDropdownProps {
  user: UserType;
  onLogout: () => Promise<void>;
  isLoading?: boolean;
  onProfileClick?: () => void;
  onTicketsClick?: () => void;
}

/**
 * UserDropdown Component
 * Displays user avatar and dropdown menu with Profile, Tickets, and Logout options
 * Handles both desktop hover and mobile click interactions
 */
export const UserDropdown: React.FC<UserDropdownProps> = ({
  user,
  onLogout,
  isLoading = false,
  onProfileClick,
  onTicketsClick,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /**
   * Handle click outside to close dropdown
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        buttonRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  /**
   * Handle logout with proper error handling
   */
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await onLogout();
      setIsOpen(false);

      // Show success toast
      toast.success(t('navbar.logoutSuccess') || '👋 Logged out successfully!', {
        duration: 3000,
        position: 'top-center',
      });
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error(t('navbar.logoutError') || '❌ Logout failed. Please try again.', {
        duration: 3000,
        position: 'top-center',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  /**
   * Handle profile click
   */
  const handleProfileClick = () => {
    setIsOpen(false);
    if (onProfileClick) {
      onProfileClick();
    }
  };

  /**
   * Handle tickets click
   */
  const handleTicketsClick = () => {
    setIsOpen(false);
    if (onTicketsClick) {
      onTicketsClick();
    }
  };

  // Get user initials for avatar
  const userInitials = user.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={containerRef}>
      {/* Avatar Button */}
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isLoading || isLoggingOut}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
          isDark ? 'hover:bg-midnight text-cream' : 'hover:bg-cream text-charcoal'
        } ${(isLoading || isLoggingOut) && 'opacity-50 cursor-not-allowed'}`}
        title={`${user.name} (${user.email})`}
      >
        {/* Avatar Circle */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-akai to-sakura flex items-center justify-center text-white font-bold text-sm overflow-hidden shadow-md">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span>{userInitials}</span>
          )}
        </div>

        {/* User Name (Hidden on small screens) */}
        <span className="font-medium text-sm hidden lg:inline truncate max-w-[100px]">{user.name.split(' ')[0]}</span>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl overflow-hidden z-50 border ${
              isDark ? 'bg-charcoal border-midnight shadow-2xl shadow-black/20' : 'bg-white border-cream shadow-2xl shadow-black/10'
            }`}
          >
            {/* User Info Header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
              className={`px-4 py-3 border-b ${isDark ? 'border-midnight bg-midnight/50' : 'border-cream bg-cream/30'}`}
            >
              <p className={`font-semibold text-sm ${isDark ? 'text-cream' : 'text-charcoal'}`}>{user.name}</p>
              <p className={`text-xs truncate ${isDark ? 'text-cream/60' : 'text-charcoal/60'}`}>{user.email}</p>
              {user.role === 'admin' && (
                <span
                  className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded ${
                    isDark ? 'bg-akai/20 text-akai' : 'bg-akai/10 text-akai'
                  }`}
                >
                  {t('user.admin') || 'Admin'}
                </span>
              )}
            </motion.div>

            {/* Menu Items */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="py-1"
            >
              {/* Profile Button */}
              <motion.button
                type="button"
                whileHover={{
                  backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                  paddingLeft: 20,
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleProfileClick}
                disabled={isLoading || isLoggingOut}
                className={`w-full px-4 py-2.5 text-left flex items-center space-x-3 transition-colors ${
                  isDark ? 'text-cream hover:bg-midnight' : 'text-charcoal hover:bg-cream'
                } ${(isLoading || isLoggingOut) && 'opacity-50 cursor-not-allowed'}`}
              >
                <User size={16} className="flex-shrink-0" />
                <span className="text-sm font-medium">{t('navbar.profile') || 'Profile'}</span>
              </motion.button>

              {/* My Tickets Button */}
              <motion.button
                type="button"
                whileHover={{
                  backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                  paddingLeft: 20,
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTicketsClick}
                disabled={isLoading || isLoggingOut}
                className={`w-full px-4 py-2.5 text-left flex items-center space-x-3 transition-colors ${
                  isDark ? 'text-cream hover:bg-midnight' : 'text-charcoal hover:bg-cream'
                } ${(isLoading || isLoggingOut) && 'opacity-50 cursor-not-allowed'}`}
              >
                <Ticket size={16} className="flex-shrink-0" />
                <span className="text-sm font-medium">{t('navbar.myTickets') || 'My Tickets'}</span>
              </motion.button>

              {/* Divider */}
              <div
                className={`my-1 ${isDark ? 'bg-midnight/50' : 'bg-gray-100'}`}
                style={{ height: '1px' }}
              />

              {/* Logout Button */}
              <motion.button
                type="button"
                whileHover={{
                  backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                  paddingLeft: 20,
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`w-full px-4 py-2.5 text-left flex items-center space-x-3 transition-colors relative ${
                  isDark ? 'text-sakura hover:bg-midnight' : 'text-akai hover:bg-cream'
                } ${isLoggingOut && 'opacity-50 cursor-not-allowed'}`}
              >
                <LogOut size={16} className="flex-shrink-0" />
                <span className="text-sm font-medium">
                  {isLoggingOut ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {t('navbar.loggingOut') || 'Logging out...'}
                    </span>
                  ) : (
                    t('navbar.logout') || 'Logout'
                  )}
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDropdown;
