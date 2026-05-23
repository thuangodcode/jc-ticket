import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, Moon, Sun, Globe, LogOut, User, Ticket, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useUserAuth } from '../contexts/useUserAuth';

interface NavbarProps {
  onSearchClick?: () => void;   // Giữ lại để sau này dùng
}

/**
 * Navbar Component - Japanese Modern Elegant style
 */
export const Navbar: React.FC<NavbarProps> = ({ onSearchClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { isDark, toggleDark } = useTheme();
  const { openModal } = useAuthModal();
  const { user, isAuthenticated, logout, isLoading } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('🎨 Navbar render:', { user, isAuthenticated, isLoading });

  const menuItems = [
    { key: 'navbar.home', target: 'home' },
    { key: 'navbar.categories', target: 'categories' },
    { key: 'navbar.events', target: 'events' },
    { key: 'navbar.contact', target: 'contact' },
  ];

  const scrollToSection = (sectionId?: string) => {
    if (!sectionId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = 88;
      const y = element.getBoundingClientRect().top + window.scrollY - yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleMenuClick = (target: string) => {
    setIsOpen(false);
    setIsUserMenuOpen(false);

    if (target === 'events') {
      if (location.pathname === '/events') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/events');
      }
      return;
    }

    const sectionId = target === 'home' ? '' : target;

    if (location.pathname !== '/') {
      navigate('/');
      window.setTimeout(() => scrollToSection(sectionId), 50);
      return;
    }

    scrollToSection(sectionId);
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      
      // Show logout toast
      toast.success('👋 Đã đăng xuất thành công! Hẹn gặp bạn lần sau.', {
        duration: 3000,
        position: 'top-center',
      });
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('❌ Đăng xuất thất bại. Vui lòng thử lại.', {
        duration: 3000,
        position: 'top-center',
      });
    }
  };

  return (
    <nav
      style={{ zIndex: 100000 }}
      className={`fixed top-0 w-full transition-colors duration-300 ${isDark ? 'bg-charcoal/95' : 'bg-white/95'} backdrop-blur-md z-50 border-b ${isDark ? 'border-midnight' : 'border-cream'} shadow-sm`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            className="flex items-center space-x-2 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-8 h-8 bg-akai rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg font-elegant">✦</span>
            </div>
            <span className={`text-lg font-bold hidden sm:inline font-elegant ${isDark ? 'text-cream' : 'text-ink'}`}>
              JC-Ticket
            </span>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleMenuClick(item.target)}
                className={`font-medium transition-colors ${isDark ? 'text-cream hover:text-akai' : 'text-charcoal hover:text-akai'}`}
              >
                {t(item.key)}
              </button>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <motion.div
              className="relative group"
              whileHover={{ scale: 1.05 }}
            >
              <button className={`p-2 rounded-lg transition-colors flex items-center space-x-1 ${isDark ? 'hover:bg-midnight' : 'hover:bg-cream'}`}>
                <Globe size={20} className="text-akai" />
                <span className="text-xs font-semibold text-akai hidden sm:inline">
                  {i18n.language.toUpperCase()}
                </span>
              </button>
              {/* Language Dropdown */}
              <div className={`absolute right-0 mt-2 w-32 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ${isDark ? 'bg-charcoal border border-midnight' : 'bg-white border border-cream'}`}>
                <button
                  onClick={() => changeLanguage('en')}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors rounded-t-lg ${i18n.language === 'en' ? 'bg-akai text-white' : isDark ? 'hover:bg-midnight text-cream' : 'hover:bg-cream text-charcoal'}`}
                >
                  🇬🇧 English
                </button>
                <button
                  onClick={() => changeLanguage('vi')}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors rounded-b-lg ${i18n.language === 'vi' ? 'bg-akai text-white' : isDark ? 'hover:bg-midnight text-cream' : 'hover:bg-cream text-charcoal'}`}
                >
                  🇻🇳 Tiếng Việt
                </button>
              </div>
            </motion.div>

            {/* Dark Mode Toggle */}
            <motion.button
              onClick={toggleDark}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-midnight text-gold hover:bg-ink' : 'bg-cream text-charcoal hover:bg-sakura/20'}`}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>

            {/* Search Button - Sử dụng onSearchClick */}
            <motion.button
              onClick={onSearchClick}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-midnight text-akai' : 'hover:bg-cream text-akai'}`}
              title="Search events"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 01-14 0 7 7 0 0114 0z" />
              </svg>
            </motion.button>

            {/* Cart Icon */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`relative p-2 text-akai transition-colors rounded-lg ${isDark ? 'hover:bg-midnight' : 'hover:bg-cream'}`}
            >
              <ShoppingCart size={20} />
              <span className="absolute top-1 right-1 w-4 h-4 bg-akai text-white text-xs rounded-full flex items-center justify-center font-bold">
                0
              </span>
            </motion.button>

            {/* Auth Section - Desktop */}
            <div className="hidden sm:flex items-center space-x-3">
              {!isLoading && (
                <>
                  {isAuthenticated && user ? (
                    // User Menu - When authenticated
                    <motion.div
                      className="relative"
                      onMouseEnter={() => setIsUserMenuOpen(true)}
                      onMouseLeave={() => setIsUserMenuOpen(false)}
                    >
                      {/* User Avatar/Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                          isDark
                            ? 'hover:bg-midnight text-cream'
                            : 'hover:bg-cream text-charcoal'
                        }`}
                      >
                        {/* Avatar Circle */}
                        <div className="w-8 h-8 rounded-full bg-akai flex items-center justify-center text-white font-bold text-sm">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        {/* User Name */}
                        <span className="font-medium text-sm hidden lg:inline">
                          {user.name.split(' ')[0]}
                        </span>
                      </motion.button>

                      {/* User Dropdown Menu */}
                      <AnimatePresence>
                        {isUserMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden z-50 ${
                              isDark
                                ? 'bg-charcoal border border-midnight'
                                : 'bg-white border border-cream'
                            }`}
                          >
                            {/* User Info Header */}
                            <div
                              className={`px-4 py-3 border-b ${
                                isDark ? 'border-midnight bg-midnight/50' : 'border-cream bg-cream/50'
                              }`}
                            >
                              <p className={`font-semibold ${isDark ? 'text-cream' : 'text-charcoal'}`}>
                                {user.name}
                              </p>
                              <p
                                className={`text-xs ${
                                  isDark ? 'text-cream/60' : 'text-charcoal/60'
                                }`}
                              >
                                {user.email}
                              </p>
                            </div>

                            {/* Menu Items */}
                            <div className="py-1">
                              {/* Profile */}
                              <Link to="/profile">
                                <motion.div
                                  whileHover={{
                                    backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                                  }}
                                  className={`w-full px-4 py-2 flex items-center space-x-2 transition-colors ${
                                    isDark ? 'text-cream hover:bg-midnight' : 'text-charcoal hover:bg-cream'
                                  }`}
                                >
                                  <User size={16} />
                                  <span>{t('navbar.profile') || 'Profile'}</span>
                                </motion.div>
                              </Link>

                              {/* My Tickets */}
                              <Link to="/my-tickets">
                                <motion.div
                                  whileHover={{
                                    backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                                  }}
                                  className={`w-full px-4 py-2 flex items-center space-x-2 transition-colors ${
                                    isDark ? 'text-cream hover:bg-midnight' : 'text-charcoal hover:bg-cream'
                                  }`}
                                >
                                  <Ticket size={16} />
                                  <span>{t('navbar.myTickets') || 'My Tickets'}</span>
                                </motion.div>
                              </Link>

                              {/* Admin Panel - Only for admin users */}
                              {user.role === 'admin' && (
                                <Link to="/admin">
                                  <motion.div
                                    whileHover={{
                                      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                                    }}
                                    className={`w-full px-4 py-2 flex items-center space-x-2 transition-colors ${
                                      isDark ? 'text-amber-400 hover:bg-midnight' : 'text-amber-600 hover:bg-cream'
                                    }`}
                                  >
                                    <Shield size={16} />
                                    <span>Admin Panel</span>
                                  </motion.div>
                                </Link>
                              )}

                              {/* Divider */}
                              <div
                                className={`my-1 ${isDark ? 'bg-midnight' : 'bg-cream'}`}
                                style={{ height: '1px' }}
                              />

                              {/* Logout */}
                              <motion.button
                                onClick={handleLogout}
                                whileHover={{
                                  backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                                }}
                                className={`w-full px-4 py-2 text-left flex items-center space-x-2 transition-colors ${
                                  isDark
                                    ? 'text-sakura hover:bg-midnight'
                                    : 'text-akai hover:bg-cream'
                                }`}
                              >
                                <LogOut size={16} />
                                <span>{t('navbar.logout') || 'Logout'}</span>
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    // Login & Register Buttons - When not authenticated
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => openModal('login')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          isDark
                            ? 'text-cream border border-cream hover:bg-cream hover:text-ink'
                            : 'text-charcoal border border-charcoal hover:bg-charcoal hover:text-cream'
                        }`}
                      >
                        {t('navbar.login')}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => openModal('register')}
                        className="px-4 py-2 rounded-lg font-medium bg-akai text-white hover:bg-sakura-dark transition-colors shadow-md"
                      >
                        {t('navbar.register')}
                      </motion.button>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${isDark ? 'text-cream hover:bg-midnight' : 'text-charcoal hover:bg-cream'}`}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`md:hidden pb-4 border-t ${isDark ? 'border-midnight' : 'border-cream'}`}
          >
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleMenuClick(item.target)}
                className={`block px-4 py-2 rounded-lg transition-colors ${isDark ? 'text-cream hover:bg-midnight' : 'text-charcoal hover:bg-cream'}`}
              >
                {t(item.key)}
              </button>
            ))}
            <div
              className={`px-4 py-3 space-y-2 border-t ${
                isDark ? 'border-midnight' : 'border-cream'
              } mt-3`}
            >
              {isAuthenticated && user ? (
                // Mobile User Menu
                <>
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      isDark
                        ? 'bg-midnight text-cream'
                        : 'bg-cream text-charcoal'
                    }`}
                  >
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className="text-xs opacity-75">{user.email}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      isDark
                        ? 'text-cream hover:bg-midnight'
                        : 'text-charcoal hover:bg-cream'
                    }`}
                  >
                    <User size={16} />
                    <span>{t('navbar.profile') || 'Profile'}</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      isDark
                        ? 'text-cream hover:bg-midnight'
                        : 'text-charcoal hover:bg-cream'
                    }`}
                  >
                    <Ticket size={16} />
                    <span>{t('navbar.myTickets') || 'My Tickets'}</span>
                  </motion.button>
                  <motion.button
                    onClick={handleLogout}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      isDark
                        ? 'text-sakura hover:bg-midnight'
                        : 'text-akai hover:bg-cream'
                    }`}
                  >
                    <LogOut size={16} />
                    <span>{t('navbar.logout') || 'Logout'}</span>
                  </motion.button>
                </>
              ) : (
                // Mobile Auth Buttons
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      openModal('login');
                    }}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDark
                        ? 'text-cream border border-cream hover:bg-cream hover:text-ink'
                        : 'text-charcoal border border-charcoal hover:bg-charcoal hover:text-cream'
                    }`}
                  >
                    {t('navbar.login')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      openModal('register');
                    }}
                    className="w-full px-4 py-2 rounded-lg font-medium bg-akai text-white hover:bg-sakura-dark transition-colors shadow-md"
                  >
                    {t('navbar.register')}
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};