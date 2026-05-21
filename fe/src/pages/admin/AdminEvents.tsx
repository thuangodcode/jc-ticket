import { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Plus, Edit3 } from 'lucide-react';
import EventForm from './EventForm';
import { useTheme } from '../../contexts/ThemeContext';
import { eventService } from '../../services/eventService';
import toast from 'react-hot-toast';

export default function AdminEvents() {
  const { isDark } = useTheme();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await eventService.getEvents({ limit: 50, status: '' });
      setEvents(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa sự kiện này?')) return;
    try {
      await eventService.deleteEvent(id);
      toast.success('Đã xóa sự kiện');
      fetchEvents();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };

  const card = isDark ? 'bg-charcoal/80 border border-zinc-800' : 'bg-white border border-gray-200';
  const statusColor = (s: string) => {
    const m: Record<string, string> = { active: 'bg-green-500/20 text-green-500', cancelled: 'bg-red-500/20 text-red-500', completed: 'bg-blue-500/20 text-blue-500', draft: 'bg-gray-500/20 text-gray-500' };
    return m[s] || m.active;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">🎌 Quản lý sự kiện</h1>
        <div className="flex gap-2">
          <button onClick={() => { setEditing(null); setShowForm(true); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-charcoal border border-zinc-700 text-cream' : 'bg-white border border-gray-200'}`}><Plus size={14}/>Tạo sự kiện</button>
          <button onClick={fetchEvents} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-charcoal border border-zinc-700 text-cream' : 'bg-white border border-gray-200'}`}><RefreshCw size={14}/>Làm mới</button>
        </div>
      </div>

      <div className={`${card} rounded-2xl shadow-lg overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className={isDark ? 'bg-midnight' : 'bg-cream'}>
              {['Hình','Tên sự kiện','Ngày','Địa điểm','Giá','Ghế','TT','Thao tác'].map(h=><th key={h} className="text-left py-3 px-3 font-medium opacity-60 text-xs">{h}</th>)}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="py-12 text-center"><div className="animate-spin w-8 h-8 border-4 border-akai border-t-transparent rounded-full mx-auto"/></td></tr>
              : events.map(e => (
                <tr key={e._id} className={`border-t ${isDark ? 'border-zinc-800 hover:bg-zinc-900/50' : 'border-gray-100 hover:bg-cream/50'}`}>
                  <td className="py-3 px-3"><img src={e.image} alt="" className="w-12 h-8 rounded object-cover"/></td>
                  <td className="py-3 px-3 text-xs font-medium truncate max-w-[200px]">{e.title}</td>
                  <td className="py-3 px-3 text-xs">{new Date(e.date).toLocaleDateString('vi-VN')}</td>
                  <td className="py-3 px-3 text-xs">{e.location}</td>
                  <td className="py-3 px-3 text-xs font-semibold">{e.price?.toLocaleString('vi-VN')}₫</td>
                  <td className="py-3 px-3 text-xs">{e.availableSeats}/{e.totalSeats}</td>
                  <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor(e.status)}`}>{e.status}</span></td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(e); setShowForm(true); }} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"><Edit3 size={14}/></button>
                      <button onClick={() => handleDelete(e._id)} className="p-1.5 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showForm && (
        <EventForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); fetchEvents(); }}
        />
      )}
    </div>
  );
}
