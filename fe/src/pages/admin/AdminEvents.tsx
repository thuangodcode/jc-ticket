import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, RefreshCw, Plus, Edit3, Search, Image, UserPlus, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserAuth } from '../../contexts/useUserAuth';
import { eventService } from '../../services/eventService';
import { authService } from '../../services/authService';
import { toast } from 'sonner';

const statusConfig: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  active: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Hoạt động', dot: 'bg-emerald-500' },
  cancelled: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Đã hủy', dot: 'bg-red-500' },
  completed: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Đã diễn ra', dot: 'bg-blue-500' },
  draft: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Bản nháp', dot: 'bg-gray-400' },
};

export default function AdminEvents() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user } = useUserAuth();
  const isEventAdmin = user?.role === 'event_admin';
  const isSuperAdmin = user?.role === 'admin';
  const routePrefix = isEventAdmin ? '/event-admin' : '/admin';
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [assignModal, setAssignModal] = useState<{ eventId: string; eventTitle: string } | null>(null);
  const [assignEmail, setAssignEmail] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [eventAdminsList, setEventAdminsList] = useState<any[]>([]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50, status: statusFilter };
      if (search) params.search = search;
      const res = await eventService.getEvents(params);
      let data = res.data;
      // Event admin can see all events in system-wide mode
      setEvents(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEvents();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [statusFilter, search]);

  useEffect(() => {
    if (isSuperAdmin) {
      authService.getEventAdmins().then(res => setEventAdminsList(res.data)).catch(console.error);
    }
  }, [isSuperAdmin]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa sự kiện này?')) return;
    try {
      await eventService.deleteEvent(id);
      toast.success('Đã xóa sự kiện');
      fetchEvents();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };

  const handleAssignEventAdmin = async () => {
    if (!assignModal || !assignEmail.trim()) return;
    setAssigning(true);
    try {
      await authService.assignEventAdmin(assignEmail.trim(), [assignModal.eventId]);
      toast.success(`Đã gán Event Admin cho sự kiện "${assignModal.eventTitle}"`);
      setAssignModal(null);
      setAssignEmail('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể gán Event Admin');
    } finally {
      setAssigning(false);
    }
  };

  const card = isDark
    ? 'bg-[#151929]/80 border border-white/[0.06] backdrop-blur'
    : 'bg-white border border-gray-200/60 shadow-sm';

  const filterOptions = [
    { id: '', label: 'Tất cả', icon: '📅' },
    { id: 'active', label: 'Đang hoạt động', icon: '🟢' },
    { id: 'draft', label: 'Bản nháp', icon: '📝' },
    { id: 'cancelled', label: 'Đã hủy', icon: '🔴' },
  ];

  return (
    <div className="space-y-5">
      {/* Filters + Search bar + Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`
                flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold
                transition-all duration-200
                ${statusFilter === f.id
                  ? 'bg-gradient-to-r from-akai to-sakura-dark text-white shadow-md shadow-akai/25'
                  : isDark
                    ? 'bg-[#151929] text-gray-400 border border-white/[0.06] hover:bg-white/[0.04]'
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              <span>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
          <div className="relative max-w-xs w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
            </span>
            <input
              type="text"
              placeholder="Tìm sự kiện, địa điểm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`
                w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none transition-all duration-200
                ${isDark
                  ? 'bg-[#151929] text-gray-200 border border-white/[0.06] focus:border-akai focus:ring-1 focus:ring-akai'
                  : 'bg-white text-gray-800 border border-gray-200 focus:border-akai focus:ring-1 focus:ring-akai'
                }
              `}
            />
          </div>

          <button
            onClick={() => navigate(`${routePrefix}/events/create`)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold bg-gradient-to-r from-akai to-sakura-dark text-white hover:shadow-lg hover:shadow-akai/25 transition-all duration-300 hover:-translate-y-0.5 shrink-0 ${isEventAdmin ? '' : 'hidden'}`}
          >
            <Plus size={14} />
            Tạo sự kiện
          </button>

          <button
            onClick={fetchEvents}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold shrink-0
              transition-all duration-200
              ${isDark
                ? 'bg-[#151929] text-gray-300 border border-white/[0.06] hover:bg-white/[0.04]'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            <RefreshCw size={14} />
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className={`${card} rounded-2xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
                {['Hình', 'Tên sự kiện', 'Ngày', 'Địa điểm', 'Giá', 'Ghế', 'Trạng thái', 'Quản lý', 'Thao tác'].map(h => (
                  <th key={h} className={`text-left py-3.5 px-4 font-semibold text-[11px] uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-akai border-t-transparent rounded-full animate-spin" />
                      <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Search size={32} className={`mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Chưa có sự kiện nào</p>
                  </td>
                </tr>
              ) : events.map(e => {
                const status = statusConfig[e.status] || statusConfig.active;
                const assignedAdmin = eventAdminsList.find(admin => 
                  admin.managedEventIds?.some((m: any) => m._id === e._id || m.id === e._id || m === e._id)
                );
                return (
                  <tr
                    key={e._id}
                    className={`border-b transition-colors ${isDark ? 'border-white/[0.04] hover:bg-white/[0.02]' : 'border-gray-50 hover:bg-gray-50/60'}`}
                  >
                    <td className="py-3 px-4">
                      {e.image ? (
                        <img src={e.image} alt="" className="w-14 h-10 rounded-lg object-cover ring-1 ring-black/5" />
                      ) : (
                        <div className={`w-14 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/[0.06]' : 'bg-gray-100'}`}>
                          <Image size={16} className={isDark ? 'text-gray-600' : 'text-gray-300'} />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold max-w-[180px] truncate">{e.title}</td>
                    <td className="py-3 px-4 text-xs tabular-nums">{new Date(e.date).toLocaleDateString('vi-VN')}</td>
                    <td className="py-3 px-4 text-xs truncate max-w-[120px]">{e.location}</td>
                    <td className="py-3 px-4 text-xs font-bold tabular-nums">{e.price?.toLocaleString('vi-VN')}₫</td>
                    <td className="py-3 px-4 min-w-[140px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold">{e.totalSeats - e.availableSeats} đã bán</span>
                          <span className={`font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{e.totalSeats > 0 ? Math.round(((e.totalSeats - e.availableSeats) / e.totalSeats) * 100) : 0}%</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-gray-100'}`}>
                          <div
                            className="h-full bg-gradient-to-r from-akai to-sakura-dark rounded-full transition-all duration-300"
                            style={{ width: `${e.totalSeats > 0 ? Math.min(100, Math.max(0, ((e.totalSeats - e.availableSeats) / e.totalSeats) * 100)) : 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {assignedAdmin ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold px-2 py-1 bg-violet-500/10 text-violet-500 rounded-md truncate max-w-[90px]" title={assignedAdmin.email}>
                            {assignedAdmin.name}
                          </span>
                          {isSuperAdmin && (
                            <button
                              onClick={() => setAssignModal({ eventId: e._id, eventTitle: e.title })}
                              className="text-gray-400 hover:text-violet-500 transition-colors"
                              title="Đổi quản lý"
                            >
                              <Edit3 size={12} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className={`text-[11px] italic mr-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Chưa có</span>
                          {isSuperAdmin && (
                            <button
                              onClick={() => setAssignModal({ eventId: e._id, eventTitle: e.title })}
                              className="p-1 rounded bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 transition-colors"
                              title="Gán quản lý"
                            >
                              <UserPlus size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        {isEventAdmin && (
                          <>
                            <button
                              onClick={() => navigate(`${routePrefix}/events/edit/${e._id}`)}
                              title="Chỉnh sửa"
                              className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(e._id)}
                              title="Xóa"
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Assign Event Admin Modal ── */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAssignModal(null)}>
          <div
            onClick={e => e.stopPropagation()}
            className={`${card} rounded-2xl p-6 max-w-md w-full`}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Gán Event Admin</h3>
              <button onClick={() => setAssignModal(null)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-gray-100'}`}>
                <X size={18} />
              </button>
            </div>

            <div className={`text-center py-3 px-3 rounded-xl mb-5 ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sự kiện</p>
              <p className="text-sm font-bold mt-1">{assignModal.eventTitle}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tài khoản Event Admin</label>
                <select
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  className={`
                    w-full mt-1.5 px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 cursor-pointer
                    ${isDark
                      ? 'bg-white/[0.04] text-gray-200 border border-white/[0.06] focus:border-akai focus:ring-1 focus:ring-akai'
                      : 'bg-gray-50 text-gray-800 border border-gray-200 focus:border-akai focus:ring-1 focus:ring-akai'
                    }
                  `}
                >
                  <option value="" disabled>Chọn Event Admin...</option>
                  {eventAdminsList
                    .filter(admin => {
                      // Only show admins with 0 managed events, OR admins already managing THIS specific event
                      if (!admin.managedEventIds || admin.managedEventIds.length === 0) return true;
                      return admin.managedEventIds.some((m: any) => 
                        m === assignModal.eventId || m._id === assignModal.eventId || m.id === assignModal.eventId
                      );
                    })
                    .map(admin => (
                    <option key={admin._id} value={admin.email}>
                      {admin.name} ({admin.email})
                    </option>
                  ))}
                </select>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Sự kiện này sẽ được gán cho Event Admin đã chọn. Nếu bạn chưa có tài khoản Event Admin, hãy tạo trong mục "Tài khoản Event Admin".
              </p>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleAssignEventAdmin}
                disabled={assigning || !assignEmail.trim()}
                className="flex-1 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-40"
              >
                {assigning ? 'Đang xử lý...' : 'Xác nhận gán'}
              </button>
              <button
                onClick={() => setAssignModal(null)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${isDark ? 'bg-white/[0.06] text-gray-300 hover:bg-white/[0.1]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
