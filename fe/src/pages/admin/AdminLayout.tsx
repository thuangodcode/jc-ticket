import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Ticket, CalendarDays,
  LogOut, Menu, X, Moon, Sun, ChevronLeft, ChevronRight, Bell, QrCode
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserAuth } from '../../contexts/useUserAuth';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/staff/check-in', icon: QrCode, label: 'Quét vé Check-in' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Đơn hàng' },
  { to: '/admin/tickets', icon: Ticket, label: 'Vé phát hành' },
  { to: '/admin/events', icon: CalendarDays, label: 'Sự kiện' },
];

export default function AdminLayout() {
  const { isDark, toggleDark } = useTheme();
  const { user, logout, isLoading } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isStaff = user?.role === 'staff';
  const filteredNavItems = navItems.filter(item => {
    if (isStaff) {
      return item.to === '/staff/check-in';
    }
    return item.to !== '/staff/check-in';
  });

  const isCurrentRouteAllowed = isStaff
    ? location.pathname === '/staff/check-in'
    : location.pathname !== '/staff/check-in';

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0c0f1a] text-white' : 'bg-gray-50'}`}>
        <div className="w-12 h-12 border-4 border-akai border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role !== 'admin' && user?.role !== 'staff') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0c0f1a] text-white' : 'bg-gray-50 text-ink'}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-red-500/30">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Truy cập bị từ chối</h2>
          <p className="text-sm opacity-60 mb-6">Bạn cần quyền Admin hoặc Staff để truy cập trang này.</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gradient-to-r from-akai to-sakura-dark text-white rounded-xl font-bold hover:shadow-lg hover:shadow-akai/30 transition-all duration-300 hover:-translate-y-0.5"
          >
            Về trang chủ
          </button>
        </motion.div>
      </div>
    );
  }

  // Page title from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Dashboard';
    if (path.includes('/scan') || path.includes('/check-in')) return 'Quét vé Check-in';
    if (path.includes('/orders')) return 'Quản lý đơn hàng';
    if (path.includes('/tickets')) return 'Vé đã phát hành';
    if (path.includes('/events/create')) return 'Tạo sự kiện mới';
    if (path.includes('/events/edit')) return 'Chỉnh sửa sự kiện';
    if (path.includes('/events')) return 'Quản lý sự kiện';
    return isStaff ? 'Staff' : 'Admin';
  };

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-[#0c0f1a] text-gray-100' : 'bg-gray-50/80 text-ink'}`}>
      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${collapsed ? 'w-[72px]' : 'w-64'}
          ${isDark
            ? 'bg-[#111528]/95 border-white/[0.06]'
            : 'bg-white/95 border-gray-200/80'}
          border-r flex flex-col backdrop-blur-xl
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          transition-all duration-300 ease-in-out
        `}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center ${collapsed ? 'justify-center px-0' : 'px-5'} gap-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
          <div className="w-9 h-9 bg-gradient-to-br from-akai to-sakura-dark rounded-xl flex items-center justify-center shadow-lg shadow-akai/20 shrink-0">
            <span className="text-white font-bold text-sm">JC</span>
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
              <p className="font-bold text-sm tracking-tight">JC-Ticket</p>
              <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {isStaff ? 'Staff Panel' : 'Admin Panel'}
              </p>
            </motion.div>
          )}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3'} py-4 space-y-1`}>
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `
                group flex items-center ${collapsed ? 'justify-center' : ''} gap-3
                ${collapsed ? 'px-0 py-2.5' : 'px-3 py-2.5'}
                rounded-xl text-[13px] font-medium
                transition-all duration-200 relative
                ${isActive
                  ? `bg-gradient-to-r from-akai to-sakura-dark text-white shadow-md shadow-akai/25`
                  : isDark
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.06]'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80'
                }
              `}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className={`hidden lg:flex ${collapsed ? 'justify-center' : 'justify-end px-3'} py-2`}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/[0.06] text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>


      </aside>

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Main content area ── */}
      <main className="flex-1 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className={`
          sticky top-0 z-30 h-16 flex items-center gap-4 px-4 md:px-6
          ${isDark
            ? 'bg-[#0c0f1a]/80 border-white/[0.06]'
            : 'bg-white/80 border-gray-200/60'
          }
          border-b backdrop-blur-xl
        `}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={`lg:hidden p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-gray-100'}`}
          >
            <Menu size={20} />
          </button>

          <div className="flex-1">
            <h2 className="text-lg font-bold tracking-tight">
              {getPageTitle() === 'Dashboard' ? `👋 ${user?.name || 'Admin'}` : getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleDark}
              className={`p-2.5 rounded-xl transition-all duration-300 ${isDark ? 'hover:bg-white/[0.06] text-yellow-400' : 'hover:bg-gray-100 text-gray-500'}`}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification bell */}
            <button className={`p-2.5 rounded-xl transition-all duration-300 relative ${isDark ? 'hover:bg-white/[0.06] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-akai rounded-full ring-2 ring-white dark:ring-[#0c0f1a]" />
            </button>

            {/* User Profile & Logout Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center gap-2 p-1.5 rounded-xl transition-all duration-200 ${
                  isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-gray-100'
                }`}
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-akai to-sakura-dark flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-akai/20">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="hidden md:block text-xs font-semibold">{user?.name}</span>
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <>
                    {/* Click-outside backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-xl z-50 p-2 ${
                        isDark
                          ? 'bg-[#111528] border-white/[0.06] shadow-black/40'
                          : 'bg-white border-gray-200 shadow-gray-200/50'
                      }`}
                    >
                      {/* User Info Header */}
                      <div className="px-3 py-2.5 border-b mb-1 border-gray-100 dark:border-white/[0.06]">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">Tài khoản</p>
                        <p className="text-sm font-semibold truncate mt-0.5">{user?.name}</p>
                        <span className="inline-flex mt-1 items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-akai/10 text-akai">
                          {user?.role === 'admin' ? 'Administrator' : 'Staff'}
                        </span>
                      </div>

                      {/* Logout Action */}
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                          navigate('/');
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isDark
                            ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                            : 'text-red-500 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        <LogOut size={16} />
                        <span>Đăng xuất</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          {isCurrentRouteAllowed ? (
            <Outlet />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h2 className="text-xl font-bold mb-2">Truy cập bị giới hạn</h2>
              <p className={`text-xs max-w-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {isStaff
                  ? 'Tài khoản của bạn thuộc vai trò Nhân viên (Staff), chỉ được phép truy cập và sử dụng chức năng quét check-in vé.'
                  : 'Tài khoản của bạn thuộc vai trò Admin. Chức năng quét check-in vé bằng camera chỉ dành riêng cho vai trò Nhân viên (Staff).'}
              </p>
              <button
                onClick={() => navigate(isStaff ? '/staff/check-in' : '/admin')}
                className="px-6 py-2.5 bg-gradient-to-r from-akai to-sakura-dark text-white rounded-xl font-bold text-xs hover:shadow-lg transition-all"
              >
                {isStaff ? 'Đến trang Quét vé Check-in' : 'Quay lại Dashboard'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
