/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { toast } from 'sonner';
import { eventService } from '../../services/eventService';
import { uploadService } from '../../services/uploadService';

export default function EventForm({ initial, onClose, onSaved }: { initial?: any; onClose: () => void; onSaved: () => void; }) {
  const defaultState: any = initial
    ? { ...initial, tags: (initial.tags || []).join(','), seatMap: { ...(initial.seatMap || {}), vipRows: (initial.seatMap?.vipRows || []).join(',') } }
    : {
        title: '',
        description: '',
        date: '',
        endDate: '',
        location: '',
        venue: '',
        organizer: '',
        price: 0,
        vipPrice: 0,
        totalSeats: 100,
        image: '',
        imagePublicId: '',
        status: 'active',
        tags: '',
        category: 'other',
        seatMap: { rows: 10, seatsPerRow: 12, vipRows: '0,1' },
      };

  const [form, setForm] = useState<any>(defaultState);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (f?: File) => {
    if (!f) return;
    try {
      setUploading(true);
      const res = await uploadService.uploadImage(f);
      // uploadService now returns { url, public_id }
      setForm((s: any) => ({ ...s, image: res.url, imagePublicId: res.public_id }));
      toast.success('Upload ảnh thành công');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload thất bại');
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        tags: (form.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
        seatMap: {
          rows: Number(form.seatMap.rows),
          seatsPerRow: Number(form.seatMap.seatsPerRow),
          vipRows: (form.seatMap.vipRows || '')
            .split(',')
            .map((s: string) => Number(s.trim()))
            .filter((n: number) => !Number.isNaN(n)),
        },
      };
      if (initial) {
        await eventService.updateEvent(initial._id, payload);
        toast.success('Cập nhật sự kiện thành công');
      } else {
        await eventService.createEvent({ ...payload, availableSeats: payload.totalSeats });
        toast.success('Tạo sự kiện thành công');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu sự kiện');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-3xl p-6 bg-white rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold mb-4">{initial ? 'Sửa sự kiện' : 'Tạo sự kiện'}</h3>
        <div className="grid grid-cols-2 gap-3">
          <input className="p-2 border rounded col-span-2" placeholder="Tiêu đề" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
          <textarea className="p-2 border rounded col-span-2" placeholder="Mô tả" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
          <input type="datetime-local" className="p-2 border rounded" value={form.date ? new Date(form.date).toISOString().slice(0,16) : ''} onChange={e=>setForm({...form,date:e.target.value})} />
          <input type="datetime-local" className="p-2 border rounded" value={form.endDate ? new Date(form.endDate).toISOString().slice(0,16) : ''} onChange={e=>setForm({...form,endDate:e.target.value})} />
          <input className="p-2 border rounded" placeholder="Địa điểm" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} />
          <input className="p-2 border rounded" placeholder="Địa điểm (Venue)" value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})} />
          <input className="p-2 border rounded" placeholder="Tổ chức bởi" value={form.organizer} onChange={e=>setForm({...form,organizer:e.target.value})} />
          <input type="number" className="p-2 border rounded" placeholder="Giá" value={form.price} onChange={e=>setForm({...form,price: Number(e.target.value)})} />
          <input type="number" className="p-2 border rounded" placeholder="Giá VIP" value={form.vipPrice} onChange={e=>setForm({...form,vipPrice: Number(e.target.value)})} />
          <input type="number" className="p-2 border rounded" placeholder="Tổng ghế" value={form.totalSeats} onChange={e=>setForm({...form,totalSeats: Number(e.target.value)})} />
          <input className="p-2 border rounded col-span-2" placeholder="Tags (comma separated)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} />
          <div className="col-span-2">
            <label className="block text-sm mb-1">Ảnh sự kiện</label>
            {form.image && <img src={form.image} alt="preview" className="w-48 h-28 object-cover rounded mb-2" />}
            <input type="file" accept="image/*" onChange={e=>handleFile(e.target.files?.[0])} />
            {uploading && <div className="text-sm text-gray-500">Đang upload...</div>}
          </div>
          <div className="col-span-2">
            <h4 className="font-semibold">Seat map</h4>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <input className="p-2 border rounded" placeholder="Rows" value={form.seatMap.rows} onChange={e=>setForm({...form,seatMap:{...form.seatMap,rows: e.target.value}})} />
              <input className="p-2 border rounded" placeholder="Seats per row" value={form.seatMap.seatsPerRow} onChange={e=>setForm({...form,seatMap:{...form.seatMap,seatsPerRow: e.target.value}})} />
              <input className="p-2 border rounded" placeholder="VIP rows (comma)" value={form.seatMap.vipRows} onChange={e=>setForm({...form,seatMap:{...form.seatMap,vipRows: e.target.value}})} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded">Hủy</button>
          <button onClick={handleSave} className="px-4 py-2 rounded bg-akai text-white">Lưu</button>
        </div>
      </div>
    </div>
  );
}
