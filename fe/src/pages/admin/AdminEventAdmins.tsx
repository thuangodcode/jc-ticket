import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { authService } from '../../services/authService';
import { toast } from 'sonner';
import { Plus, X, Trash2, Mail, Phone, CalendarDays } from 'lucide-react';

export default function AdminEventAdmins() {
  const { isDark } = useTheme();
  const [eventAdmins, setEventAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchEventAdmins = async () => {
    setLoading(true);
    try {
      const res = await authService.getEventAdmins();
      setEventAdmins(res.data);
    } catch (err: any) {
      toast.error('Không thể lấy danh sách Event Admin');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventAdmins();
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      return toast.error('Vui lòng điền đầy đủ các trường bắt buộc');
    }
    setCreating(true);
    try {
      await authService.createEventAdmin(form);
      toast.success('Tạo tài khoản Event Admin thành công');
      setCreateModal(false);
      setForm({ name: '', email: '', phone: '', password: '' });
      fetchEventAdmins();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo Event Admin');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (userId: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn thu hồi quyền Event Admin của ${name}? Tài khoản sẽ trở thành User bình thường.`)) return;
    try {
      await authService.revokeEventAdmin(userId);
      toast.success('Đã thu hồi quyền Event Admin');
      fetchEventAdmins();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi thu hồi quyền');
    }
  };

  const card = isDark
    ? 'bg-[#151929]/80 border border-white/[0.06] backdrop-blur'
    : 'bg-white border border-gray-200/60 shadow-sm';
  const inputBg = isDark
    ? 'bg-white/[0.04] border-white/[0.06] text-gray-200 focus:border-akai'
    : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-akai';

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Quản lý tài khoản Event Admin
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Danh sách các tài khoản có quyền quản lý sự kiện được chỉ định.
          </p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold bg-gradient-to-r from-akai to-sakura-dark text-white hover:shadow-lg hover:shadow-akai/25 transition-all duration-300 hover:-translate-y-0.5 shrink-0"
        >
          <Plus size={14} />
          Tạo Event Admin mới
        </button>
      </div>

      <div className={`${card} rounded-2xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
                {['Tài khoản', 'Liên hệ', 'Sự kiện quản lý', 'Thao tác'].map(h => (
                  <th key={h} className={`text-left py-3.5 px-4 font-semibold text-[11px] uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-akai border-t-transparent rounded-full animate-spin" />
                      <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : eventAdmins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Chưa có tài khoản Event Admin nào.</p>
                  </td>
                </tr>
              ) : eventAdmins.map((admin) => (
                <tr
                  key={admin._id}
                  className={`border-b transition-colors ${isDark ? 'border-white/[0.04] hover:bg-white/[0.02]' : 'border-gray-50 hover:bg-gray-50/60'}`}
                >
                  <td className="py-3.5 px-4">
                    <p className="font-bold">{admin.name}</p>
                    <span className="inline-flex mt-1 items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/10 text-violet-500">
                      Event Admin
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail size={12} className="opacity-50" /> {admin.email}
                      </div>
                      {admin.phone && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone size={12} className="opacity-50" /> {admin.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {admin.managedEventIds && admin.managedEventIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {admin.managedEventIds.map((event: any) => (
                          <span key={event._id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${isDark ? 'bg-white/[0.06] text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                            <CalendarDays size={10} />
                            {event.title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs opacity-50">— Chưa được gán sự kiện —</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleRevoke(admin._id, admin.name)}
                      title="Thu hồi quyền Event Admin"
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Event Admin Modal ── */}
      <AnimatePresence>
        {createModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCreateModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className={`${card} rounded-2xl p-6 max-w-md w-full`}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">Tạo tài khoản Event Admin</h3>
                <button onClick={() => setCreateModal(false)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-gray-100'}`}>
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Họ tên <span className="text-akai">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nhập họ tên"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email <span className="text-akai">*</span></label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Nhập email"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Số điện thoại</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Nhập số điện thoại"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mật khẩu <span className="text-akai">*</span></label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Nhập mật khẩu"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-all ${inputBg}`}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 py-2.5 bg-gradient-to-r from-akai to-sakura-dark text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
                <button
                  onClick={() => setCreateModal(false)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${isDark ? 'bg-white/[0.06] text-gray-300 hover:bg-white/[0.1]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Hủy
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
