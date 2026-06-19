import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { authService } from '../../services/authService';
import { toast } from 'sonner';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts';
import { Activity, Users, UserCheck, ShieldAlert, BarChart3, Calendar, MousePointerClick } from 'lucide-react';

export default function AdminSystemStats() {
  const { isDark } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'traffic' | 'signups'>('all');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await authService.getSystemStats();
        setStats(res.data);
      } catch (err: any) {
        toast.error('Không thể tải thống kê hệ thống');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return ShieldAlert;
      case 'event_admin':
        return BarChart3;
      case 'staff':
        return UserCheck;
      default:
        return Users;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'System Admin';
      case 'event_admin':
        return 'Event Admin';
      case 'staff':
        return 'Staff Check-in';
      default:
        return 'Standard User';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'from-rose-500 to-red-600';
      case 'event_admin':
        return 'from-amber-500 to-orange-600';
      case 'staff':
        return 'from-teal-500 to-emerald-600';
      default:
        return 'from-indigo-500 to-violet-600';
    }
  };

  const card = isDark
    ? 'bg-[#0f1225]/80 border border-white/[0.06] backdrop-blur'
    : 'bg-white border border-gray-200/60 shadow-sm';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Đang tải dữ liệu thống kê...</span>
      </div>
    );
  }

  const roleCounts = stats?.roleStats || [];
  const dailyData = stats?.dailyStats || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner / Overview */}
      <div>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Thống kê hoạt động hệ thống
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Phân tích lưu lượng truy cập và tài khoản người dùng được tạo mới trên JC-Ticket trong 30 ngày qua.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${card} rounded-2xl p-5 flex items-center justify-between hover:shadow-lg transition-all`}
        >
          <div className="space-y-1">
            <p className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Tổng tài khoản
            </p>
            <h3 className="text-3xl font-extrabold tracking-tight">
              {stats?.totalAccounts ?? 0}
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              Người dùng hoạt động
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Users size={24} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${card} rounded-2xl p-5 flex items-center justify-between hover:shadow-lg transition-all`}
        >
          <div className="space-y-1">
            <p className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Lượt truy cập (30 ngày)
            </p>
            <h3 className="text-3xl font-extrabold tracking-tight">
              {stats?.totalTraffic30Days ?? 0}
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
              Lưu lượng click hệ thống
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
            <MousePointerClick size={24} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${card} rounded-2xl p-5 flex items-center justify-between hover:shadow-lg transition-all`}
        >
          <div className="space-y-1">
            <p className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Đăng ký mới (30 ngày)
            </p>
            <h3 className="text-3xl font-extrabold tracking-tight">
              {dailyData.reduce((sum: number, day: any) => sum + day.signups, 0)}
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              Thành viên mới gia nhập
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Activity size={24} />
          </div>
        </motion.div>
      </div>

      {/* Main Charts & Role Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart area */}
        <div className={`${card} rounded-2xl p-5 lg:col-span-2 space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="opacity-60" />
              <h4 className="font-bold text-sm">Biểu đồ xu hướng (30 ngày qua)</h4>
            </div>
            <div className="flex bg-gray-100 dark:bg-white/[0.04] p-1 rounded-xl gap-1 shrink-0 text-xs">
              {(['all', 'traffic', 'signups'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab === 'all' ? 'Tất cả' : tab === 'traffic' ? 'Truy cập' : 'Đăng ký'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                <XAxis dataKey="dayLabel" stroke={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
                <YAxis stroke={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f1225' : '#ffffff',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    color: isDark ? '#ffffff' : '#000000',
                    borderRadius: '12px',
                  }}
                />
                <Legend />
                {(activeTab === 'all' || activeTab === 'traffic') && (
                  <Area
                    type="monotone"
                    name="Lượt truy cập"
                    dataKey="traffic"
                    stroke="#14b8a6"
                    fillOpacity={1}
                    fill="url(#colorTraffic)"
                    strokeWidth={2}
                  />
                )}
                {(activeTab === 'all' || activeTab === 'signups') && (
                  <Area
                    type="monotone"
                    name="Đăng ký mới"
                    dataKey="signups"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#colorSignups)"
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Role breakdown */}
        <div className={`${card} rounded-2xl p-5 flex flex-col justify-between`}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/[0.06] pb-3">
              <Users size={18} className="opacity-60" />
              <h4 className="font-bold text-sm">Cơ cấu loại tài khoản</h4>
            </div>

            <div className="space-y-4">
              {['user', 'event_admin', 'staff', 'admin'].map((role) => {
                const found = roleCounts.find((r: any) => r._id === role);
                const count = found ? found.count : 0;
                const total = stats?.totalAccounts || 1;
                const percent = Math.round((count / total) * 100);
                const Icon = getRoleIcon(role);
                const colorClass = getRoleColor(role);

                return (
                  <div key={role} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${colorClass} flex items-center justify-center text-white`}>
                          <Icon size={12} />
                        </div>
                        <span className="font-semibold">{getRoleLabel(role)}</span>
                      </div>
                      <span className="opacity-70 font-bold">{count} ({percent}%)</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-2 w-full bg-gray-100 dark:bg-white/[0.04] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full bg-gradient-to-r ${colorClass}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-indigo-600/5 dark:bg-indigo-500/[0.02] border border-indigo-500/10 rounded-xl p-3.5 mt-4 text-xs space-y-1">
            <p className="font-bold text-indigo-500">💡 Gợi ý Quản trị viên:</p>
            <p className={`opacity-80 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Quản trị viên có thể truy cập tab "Quản lý tài khoản" để thêm mới, chỉnh sửa hoặc vô hiệu hóa các tài khoản Event Admin và Nhân viên soát vé khi cần thiết.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
