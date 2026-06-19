import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Ticket, CalendarDays,
  LogOut, Menu, X, Moon, Sun, ChevronLeft, ChevronRight, Bell, QrCode, MessageSquare, Users, BarChart3
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserAuth } from '../../contexts/useUserAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { eventService } from '../../services/eventService';

interface NavItem {
  to: string;
  icon: any;
  label: string;
  end?: boolean;
}

/** Navigation items for the main admin (System Admin) */
const adminNavItems: NavItem[] = [
  { to: '/admin', icon: LayoutDashboard, label: 'Tổng quan hệ thống', end: true },
  { to: '/admin/system-stats', icon: BarChart3, label: 'Thống kê hệ thống' },
  { to: '/admin/users', icon: Users, label: 'Quản lý tài khoản' },
  { to: '/admin/support', icon: MessageSquare, label: 'Hỗ trợ khách hàng' },
];

/** Navigation items for event_admin (Organizer) */
const eventAdminNavItems: NavItem[] = [
  { to: '/event-admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/event-admin/orders', icon: ShoppingCart, label: 'Đơn hàng' },
  { to: '/event-admin/tickets', icon: Ticket, label: 'Vé phát hành' },
  { to: '/event-admin/events', icon: CalendarDays, label: 'Sự kiện' },
];

/** Navigation items for staff */
const staffNavItems: NavItem[] = [
  { to: '/staff/check-in', icon: QrCode, label: 'Quét vé Check-in' },
  { to: '/staff/support', icon: MessageSquare, label: 'Hỗ trợ khách hàng' },
];

export default function AdminLayout() {
  const { isDark, toggleDark } = useTheme();
  const { user, logout, isLoading } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [managedEventNames, setManagedEventNames] = useState<string[]>([]);

  const isStaff = user?.role === 'staff';
  const isEventAdmin = user?.role === 'event_admin';

  // Role theme configuration
  const roleTheme = isStaff
    ? {
        name: 'Staff Station',
        panelTitle: 'Staff Panel',
        accentGradient: 'from-teal-500 to-emerald-600',
        accentShadow: 'shadow-teal-500/25',
        accentText: 'text-teal-500',
        bgDark: 'bg-[#060c0d]',
        sidebarBgDark: 'bg-[#0b1416]/95',
        logoText: 'text-teal-400',
        activeBtn: 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25',
        loaderBorder: 'border-teal-500',
        textMuted: 'text-teal-400/70',
        badgeBg: 'bg-teal-500/10 text-teal-500',
      }
    : isEventAdmin
      ? {
          name: 'Organizer Portal',
          panelTitle: 'Organizer Panel',
          accentGradient: 'from-orange-500 to-rose-600',
          accentShadow: 'shadow-orange-500/25',
          accentText: 'text-orange-500',
          bgDark: 'bg-[#110e15]',
          sidebarBgDark: 'bg-[#181320]/95',
          logoText: 'text-orange-400',
          activeBtn: 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-md shadow-orange-500/25',
          loaderBorder: 'border-orange-500',
          textMuted: 'text-orange-400/70',
          badgeBg: 'bg-orange-500/10 text-orange-500',
        }
      : {
          name: 'System Admin',
          panelTitle: 'System Panel',
          accentGradient: 'from-indigo-600 to-violet-600',
          accentShadow: 'shadow-indigo-500/25',
          accentText: 'text-indigo-500',
          bgDark: 'bg-[#080a15]',
          sidebarBgDark: 'bg-[#0e1122]/95',
          logoText: 'text-indigo-400',
          activeBtn: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25',
          loaderBorder: 'border-indigo-500',
          textMuted: 'text-indigo-400/70',
          badgeBg: 'bg-indigo-500/10 text-indigo-500',
        };

  // Determine nav items based on role
  const filteredNavItems = isStaff
    ? staffNavItems
    : isEventAdmin
      ? eventAdminNavItems
      : adminNavItems;

  // Check if user can access the current route
  const isCurrentRouteAllowed = isStaff
    ? location.pathname.startsWith('/staff')
    : isEventAdmin
      ? location.pathname.startsWith('/event-admin')
      : location.pathname.startsWith('/admin');

  // Fetch managed event names for event_admin
  useEffect(() => {
    if (isEventAdmin && user?.managedEventIds?.length) {
      const fetchNames = async () => {
        try {
          const names: string[] = [];
          for (const id of user.managedEventIds || []) {
            const res = await eventService.getEventById(id);
            if (res.data?.title) names.push(res.data.title);
          }
          setManagedEventNames(names);
        } catch (err) { console.error(err); }
      };
      fetchNames();
    }
  }, [isEventAdmin, user?.managedEventIds]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? (isEventAdmin ? 'bg-[#110e15]' : isStaff ? 'bg-[#060c0d]' : 'bg-[#080a15]') + ' text-white' : 'bg-gray-50'}`}>
        <div className={`w-12 h-12 border-4 ${isEventAdmin ? 'border-orange-500' : isStaff ? 'border-teal-500' : 'border-indigo-600'} border-t-transparent rounded-full animate-spin`} />
      </div>
    );
  }

  if (user?.role !== 'admin' && user?.role !== 'event_admin' && user?.role !== 'staff') {
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
    if (path === '/admin' || path === '/event-admin') return 'Dashboard';
    if (path.includes('/scan') || path.includes('/check-in')) return 'Quét vé Check-in';
    if (path.includes('/support')) return 'Hỗ trợ trực tuyến';
    if (path.includes('/orders')) return 'Quản lý đơn hàng';
    if (path.includes('/tickets')) return 'Vé đã phát hành';
    if (path.includes('/events/create')) return 'Tạo sự kiện mới';
    if (path.includes('/events/edit')) return 'Chỉnh sửa sự kiện';
    if (path.includes('/events')) return 'Quản lý sự kiện';
    if (path.includes('/users')) return 'Quản lý tài khoản';
    if (path.includes('/system-stats')) return 'Thống kê hệ thống';
    return isStaff ? 'Staff' : isEventAdmin ? 'Event Admin' : 'Admin';
  };

  return (
    <div className={`min-h-screen flex ${isDark ? `${roleTheme.bgDark} text-gray-100` : 'bg-gray-50/80 text-ink'}`}>
      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${collapsed ? 'w-[72px]' : 'w-64'}
          ${isDark
            ? `${roleTheme.sidebarBgDark} border-white/[0.06]`
            : 'bg-white/95 border-gray-200/80'}
          border-r flex flex-col backdrop-blur-xl
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          transition-all duration-300 ease-in-out
        `}
      >
        {/* Logo */}
        <div className={`h-20 flex items-center ${collapsed ? 'justify-center px-0' : 'px-5'} gap-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-85 transition-all duration-200 shrink-0"
          >
            <div className={`w-11 h-11 bg-gradient-to-br ${roleTheme.accentGradient} rounded-xl flex items-center justify-center shadow-lg ${roleTheme.accentShadow} shrink-0`}>
              <span className="text-white font-extrabold text-base">JC</span>
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
                <p className="font-extrabold text-[15px] tracking-tight leading-tight">JC-Ticket</p>
                <p className={`text-[11px] font-medium mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {roleTheme.name}
                </p>
                {isEventAdmin && managedEventNames.length > 0 && (
                  <p className={`text-[10px] truncate max-w-[130px] mt-0.5 ${isDark ? 'text-orange-400/80' : 'text-orange-500/80'}`} title={managedEventNames.join(', ')}>
                    📋 {managedEventNames.length > 1 ? `${managedEventNames.length} sự kiện` : managedEventNames[0]}
                  </p>
                )}
              </motion.div>
            )}
          </Link>
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
                  ? roleTheme.activeBtn
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
            ? `${roleTheme.bgDark}/80 border-white/[0.06]`
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
              <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white ${isDark ? (isEventAdmin ? 'ring-[#110e15]' : isStaff ? 'ring-[#060c0d]' : 'ring-[#080a15]') : ''}`} />
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
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleTheme.accentGradient} flex items-center justify-center text-white font-bold text-sm shadow-sm ${roleTheme.accentShadow}`}>
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
                          ? `${roleTheme.sidebarBgDark} border-white/[0.06] shadow-black/40`
                          : 'bg-white border-gray-200 shadow-gray-200/50'
                      }`}
                    >
                      {/* User Info Header */}
                      <div className="px-3 py-2.5 border-b mb-1 border-gray-100 dark:border-white/[0.06]">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">Tài khoản</p>
                        <p className="text-sm font-semibold truncate mt-0.5">{user?.name}</p>
                        <span className={`inline-flex mt-1 items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${roleTheme.badgeBg}`}>
                          {user?.role === 'admin' ? 'Administrator' : user?.role === 'event_admin' ? 'Event Admin' : 'Staff'}
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
                  : 'Bạn không có quyền truy cập trang này.'}
              </p>
              <button
                onClick={() => navigate(isStaff ? '/staff/check-in' : isEventAdmin ? '/event-admin' : '/admin')}
                className={`px-6 py-2.5 bg-gradient-to-r ${roleTheme.accentGradient} text-white rounded-xl font-bold text-xs hover:shadow-lg transition-all`}
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
