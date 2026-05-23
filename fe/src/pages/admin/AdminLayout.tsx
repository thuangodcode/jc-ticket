import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Ticket, CalendarDays,
  LogOut, Menu, X, Moon, Sun, ChevronLeft, ChevronRight, Bell
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserAuth } from '../../contexts/useUserAuth';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Đơn hàng' },
  { to: '/admin/tickets', icon: Ticket, label: 'Vé phát hành' },
  { to: '/admin/events', icon: CalendarDays, label: 'Sự kiện' },
];

export default function AdminLayout() {
  const { isDark, toggleDark } = useTheme();
  const { user, logout } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (user?.role !== 'admin') {
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
          <p className="text-sm opacity-60 mb-6">Bạn cần quyền Admin để truy cập trang này.</p>
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
    if (path.includes('/orders')) return 'Quản lý đơn hàng';
    if (path.includes('/tickets')) return 'Vé đã phát hành';
    if (path.includes('/events/create')) return 'Tạo sự kiện mới';
    if (path.includes('/events/edit')) return 'Chỉnh sửa sự kiện';
    if (path.includes('/events')) return 'Quản lý sự kiện';
    return 'Admin';
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
              <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Admin Panel</p>
            </motion.div>
          )}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3'} py-4 space-y-1`}>
          {navItems.map((item) => (
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

        {/* User section */}
        <div className={`border-t ${isDark ? 'border-white/[0.06]' : 'border-gray-100'} ${collapsed ? 'px-2 py-3' : 'px-4 py-4'}`}>
          {!collapsed && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-akai to-sakura-dark flex items-center justify-center text-white font-bold text-sm shadow-md shadow-akai/20">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Administrator</p>
              </div>
            </div>
          )}
          <button
            onClick={() => { logout(); navigate('/'); }}
            className={`
              ${collapsed ? 'w-full flex justify-center' : 'w-full flex items-center gap-2'}
              px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200
              ${isDark
                ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                : 'text-red-500 hover:bg-red-50 hover:text-red-600'
              }
            `}
          >
            <LogOut size={16} />
            {!collapsed && <span>Đăng xuất</span>}
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
            <h2 className="text-lg font-bold tracking-tight">{getPageTitle()}</h2>
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
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
