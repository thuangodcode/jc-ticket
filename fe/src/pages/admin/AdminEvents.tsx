import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, RefreshCw, Plus, Edit3, Search, Image } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { eventService } from '../../services/eventService';
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
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50, status: statusFilter };
      if (search) params.search = search;
      const res = await eventService.getEvents(params);
      setEvents(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEvents();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [statusFilter, search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa sự kiện này?')) return;
    try {
      await eventService.deleteEvent(id);
      toast.success('Đã xóa sự kiện');
      fetchEvents();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Lỗi'); }
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
            onClick={() => navigate('/admin/events/create')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold bg-gradient-to-r from-akai to-sakura-dark text-white hover:shadow-lg hover:shadow-akai/25 transition-all duration-300 hover:-translate-y-0.5 shrink-0"
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
                {['Hình', 'Tên sự kiện', 'Ngày', 'Địa điểm', 'Giá', 'Ghế', 'Trạng thái', 'Thao tác'].map(h => (
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
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => navigate(`/admin/events/edit/${e._id}`)}
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
