import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { authService } from '../../services/authService';
import { eventService } from '../../services/eventService';
import { toast } from 'sonner';
import { Plus, X, Trash2, Mail, Phone, Search, Filter, Shield, User, UserCheck, ShieldAlert } from 'lucide-react';

export default function AdminUserManagement() {
  const { isDark } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [createModal, setCreateModal] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
  });
  const [creating, setCreating] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [assignModal, setAssignModal] = useState<{ email: string; name: string } | null>(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authService.getAllUsers({
        role: roleFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: 15,
      });
      setUsers(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalUsers(res.pagination.total);
    } catch (err: any) {
      toast.error('Không thể tải danh sách tài khoản');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, page]);

  useEffect(() => {
    eventService.getEvents({ limit: 100 }).then(res => setEvents(res.data)).catch(console.error);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password || !form.role) {
      return toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
    }
    setCreating(true);
    try {
      await authService.createUserAccount(form);
      toast.success(`Tạo tài khoản ${form.role.toUpperCase()} thành công`);
      setCreateModal(false);
      setForm({ name: '', email: '', phone: '', password: '', role: 'user' });
      setPage(1);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo tài khoản');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản của "${name}"? Thao tác này không thể hoàn tác.`)) {
      return;
    }
    try {
      await authService.deleteUserAccount(userId);
      toast.success('Đã xóa tài khoản thành công');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa tài khoản');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <ShieldAlert size={10} /> System Admin
          </span>
        );
      case 'event_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Shield size={10} /> Event Admin
          </span>
        );
      case 'staff':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-500 border border-teal-500/20">
            <UserCheck size={10} /> Staff Check-in
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <User size={10} /> Standard User
          </span>
        );
    }
  };

  const card = isDark
    ? 'bg-[#0f1225]/80 border border-white/[0.06] backdrop-blur'
    : 'bg-white border border-gray-200/60 shadow-sm';
  const inputBg = isDark
    ? 'bg-white/[0.04] border-white/[0.06] text-gray-200 focus:border-indigo-500'
    : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-indigo-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Quản lý tài khoản người dùng
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Xem, tạo mới, và quản trị phân quyền tất cả tài khoản trong hệ thống JC-Ticket.
          </p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 shrink-0"
        >
          <Plus size={16} />
          Tạo tài khoản mới
        </button>
      </div>

      {/* Filters & Search */}
      <div className={`${card} p-4 rounded-2xl`}>
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 opacity-50" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl text-[13px] border outline-none transition-all duration-300 ${inputBg}`}
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-3.5 h-4 w-4 opacity-50" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className={`pl-10 pr-8 py-3 rounded-xl text-[13px] border outline-none appearance-none cursor-pointer transition-all duration-300 ${inputBg}`}
              >
                <option value="">Tất cả vai trò</option>
                <option value="user">Standard User</option>
                <option value="event_admin">Event Admin</option>
                <option value="staff">Staff Check-in</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl text-[13px] font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Tìm kiếm
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className={`${card} rounded-2xl overflow-hidden shadow-xl`}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
                {['Người dùng', 'Email & SĐT', 'Vai trò', 'Chi tiết quản lý', 'Hành động'].map(h => (
                  <th key={h} className={`text-left py-4 px-5 font-semibold text-[11px] uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Đang tải danh sách tài khoản...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="max-w-xs mx-auto space-y-2 opacity-50">
                      <span className="text-4xl">👥</span>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Không tìm thấy tài khoản nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr
                  key={u._id}
                  className={`border-b transition-colors duration-200 ${isDark ? 'border-white/[0.04] hover:bg-white/[0.02]' : 'border-gray-50 hover:bg-gray-50/60'}`}
                >
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${u.role === 'admin' ? 'from-rose-500 to-red-600' : u.role === 'event_admin' ? 'from-amber-500 to-orange-600' : u.role === 'staff' ? 'from-teal-500 to-emerald-600' : 'from-indigo-500 to-violet-600'} flex items-center justify-center text-white font-bold text-sm`}>
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold">{u.name}</p>
                        <p className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>ID: {u._id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail size={12} className="opacity-50" /> {u.email}
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone size={12} className="opacity-50" /> {u.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    {getRoleBadge(u.role)}
                  </td>
                  <td className="py-4 px-5">
                    {u.role === 'event_admin' && u.managedEventIds && u.managedEventIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {u.managedEventIds.map((event: any) => (
                          <span
                            key={event._id}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                              isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {event.title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className={`text-[11px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>--</span>
                    )}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      {u.role === 'event_admin' && (
                        <button
                          onClick={() => {
                            setSelectedEventId(u.managedEventIds?.[0]?._id || '');
                            setAssignModal({ email: u.email, name: u.name });
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                            isDark ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                          }`}
                        >
                          Gán sự kiện
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(u._id, u.name)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' : 'text-red-500 hover:bg-red-50 hover:text-red-600'
                        }`}
                        title="Xóa tài khoản"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`p-4 flex items-center justify-between border-t ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Hiển thị {users.length} trên {totalUsers} tài khoản
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isDark
                    ? 'border-white/[0.06] text-gray-300 hover:bg-white/[0.06] disabled:opacity-40'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40'
                }`}
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                    p === page
                      ? 'bg-indigo-600 text-white'
                      : isDark
                        ? 'text-gray-400 hover:bg-white/[0.06]'
                        : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isDark
                    ? 'border-white/[0.06] text-gray-300 hover:bg-white/[0.06] disabled:opacity-40'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40'
                }`}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      <AnimatePresence>
        {createModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden ${
                isDark ? 'bg-[#0f1225] border border-white/[0.08] text-white shadow-black/50' : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/[0.06]">
                <h3 className="text-base font-bold">Tạo tài khoản hệ thống mới</h3>
                <button
                  onClick={() => setCreateModal(false)}
                  className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/[0.06] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="py-4 space-y-4 text-xs">
                {/* Form fields */}
                <div className="space-y-1.5">
                  <label className="font-semibold opacity-85">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all ${inputBg}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold opacity-85">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all ${inputBg}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold opacity-85">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="09XXXXXXXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all ${inputBg}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold opacity-85">Mật khẩu *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all ${inputBg}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold opacity-85">Vai trò hệ thống *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all ${inputBg}`}
                  >
                    <option value="user">User (Khách hàng mua vé)</option>
                    <option value="event_admin">Event Admin (Ban tổ chức)</option>
                    <option value="staff">Staff Check-in (Nhân viên soát vé)</option>
                    <option value="admin">System Admin (Quản trị hệ thống)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-end gap-3">
                <button
                  onClick={() => setCreateModal(false)}
                  className={`px-4 py-2.5 rounded-xl font-bold transition-all ${
                    isDark ? 'bg-white/[0.06] hover:bg-white/[0.1] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Hủy bỏ
                </button>
                <button
                  disabled={creating}
                  onClick={handleCreate}
                  className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 hover:shadow-lg transition-all"
                >
                  {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Event Modal */}
      <AnimatePresence>
        {assignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAssignModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden ${
                isDark ? 'bg-[#0f1225] border border-white/[0.08] text-white shadow-black/50' : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/[0.06]">
                <h3 className="text-base font-bold">Gán sự kiện cho Event Admin</h3>
                <button
                  onClick={() => setAssignModal(null)}
                  className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/[0.06] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="py-4 space-y-4 text-xs">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
                  <p className="opacity-70 font-semibold">Tài khoản:</p>
                  <p className="font-bold mt-0.5">{assignModal.name} ({assignModal.email})</p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold opacity-85">Chọn sự kiện để quản lý *</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all ${inputBg}`}
                  >
                    <option value="">-- Chọn sự kiện --</option>
                    {events.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-end gap-3">
                <button
                  onClick={() => setAssignModal(null)}
                  className={`px-4 py-2.5 rounded-xl font-bold transition-all ${
                    isDark ? 'bg-white/[0.06] hover:bg-white/[0.1] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Hủy bỏ
                </button>
                <button
                  disabled={assigning || !selectedEventId}
                  onClick={async () => {
                    setAssigning(true);
                    try {
                      await authService.assignEventAdmin(assignModal.email, [selectedEventId]);
                      toast.success('Gán sự kiện quản lý thành công');
                      setAssignModal(null);
                      setSelectedEventId('');
                      fetchUsers();
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || 'Lỗi khi gán sự kiện');
                    } finally {
                      setAssigning(false);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 hover:shadow-lg transition-all"
                >
                  {assigning ? 'Đang xử lý...' : 'Xác nhận gán'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
