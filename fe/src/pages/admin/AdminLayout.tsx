import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Ticket, CalendarDays, LogOut, Menu, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserAuth } from '../../contexts/useUserAuth';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Đơn hàng' },
  { to: '/admin/tickets', icon: Ticket, label: 'Vé đã phát hành' },
  { to: '/admin/events', icon: CalendarDays, label: 'Sự kiện' },
];

export default function AdminLayout() {
  const { isDark } = useTheme();
  const { user, logout } = useUserAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (user?.role !== 'admin') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-ink text-cream' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className="text-6xl mb-4">🔒</p>
          <h2 className="text-2xl font-bold mb-2">Truy cập bị từ chối</h2>
          <p className="text-sm opacity-60 mb-6">Bạn cần quyền Admin để truy cập trang này.</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-akai text-white rounded-xl font-bold">Về trang chủ</button>
        </div>
      </div>
    );
  }

  const sidebar = isDark ? 'bg-charcoal border-zinc-800' : 'bg-white border-gray-200';
  const active = 'bg-akai text-white';
  const inactive = isDark ? 'text-cream/70 hover:bg-midnight hover:text-cream' : 'text-charcoal/70 hover:bg-cream hover:text-charcoal';

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-ink text-cream' : 'bg-gray-100 text-ink'}`}>
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 ${sidebar} border-r flex flex-col transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform`}>
        <div className="p-5 flex items-center gap-3 border-b border-inherit">
          <div className="w-9 h-9 bg-akai rounded-lg flex items-center justify-center"><span className="text-white font-bold">✦</span></div>
          <div>
            <p className="font-bold text-sm">JC-Ticket</p>
            <p className="text-xs opacity-50">Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto"><X size={20}/></button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? active : inactive}`}>
              <item.icon size={18}/>{item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-inherit">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-akai flex items-center justify-center text-white font-bold text-sm">{user?.name?.charAt(0)}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{user?.name}</p><p className="text-xs opacity-50">Admin</p></div>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-500 hover:bg-red-50'}`}>
            <LogOut size={16}/>Đăng xuất
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}/>}

      {/* Main */}
      <main className="flex-1 min-h-screen">
        <header className={`sticky top-0 z-30 flex items-center gap-4 px-6 py-4 ${isDark ? 'bg-ink/95 border-zinc-800' : 'bg-white/95 border-gray-200'} border-b backdrop-blur`}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu size={20}/></button>
          <h2 className="text-lg font-bold">⚡ Admin Dashboard</h2>
        </header>
        <div className="p-6"><Outlet/></div>
      </main>
    </div>
  );
}
