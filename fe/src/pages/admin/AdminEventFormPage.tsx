/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Upload, ChevronDown, ChevronUp, Image } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { eventService } from '../../services/eventService';
import { uploadService } from '../../services/uploadService';
import LocationAutocomplete, { type LocationResult } from '../../components/LocationAutocomplete';
import MapPreview from '../../components/MapPreview';


const VIETNAM_PROVINCES = [
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bạc Liêu', 'Bắc Giang', 'Bắc Kạn', 'Bắc Ninh',
  'Bến Tre', 'Bình Dương', 'Bình Định', 'Bình Phước', 'Bình Thuận', 'Cà Mau',
  'Cao Bằng', 'Cần Thơ', 'Đà Nẵng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên',
  'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Nội',
  'Hà Tĩnh', 'Hải Dương', 'Hải Phòng', 'Hậu Giang', 'Hòa Bình', 'Hưng Yên',
  'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lạng Sơn', 'Lào Cai',
  'Lâm Đồng', 'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận',
  'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh',
  'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'TP. Hồ Chí Minh', 'Trà Vinh',
  'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
];

export default function AdminEventFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const DEFAULT_SEATS_PER_ROW = 12;

  const getCommonDivisors = (value: number) => {
    const divisors = new Set<number>();
    const limit = Math.floor(Math.sqrt(value));

    for (let i = 1; i <= limit; i += 1) {
      if (value % i === 0) {
        divisors.add(i);
        divisors.add(value / i);
      }
    }

    return Array.from(divisors).sort((a, b) => a - b);
  };

  const buildNormalizedSeatMap = (
    ticketTypes: any[],
    seatMap: { rows?: number; seatsPerRow?: number; vipRows?: string | number[] }
  ) => {
    const totalSeats = ticketTypes.reduce((sum, type) => sum + (Number(type.quantity) || 0), 0);
    const vipSeats = ticketTypes
      .filter((type) => String(type.name || '').trim().toLowerCase() === 'vip')
      .reduce((sum, type) => sum + (Number(type.quantity) || 0), 0);

    const currentSeatsPerRow = Number(seatMap.seatsPerRow) || DEFAULT_SEATS_PER_ROW;
    const candidates = getCommonDivisors(Math.max(1, totalSeats)).filter((divisor) => vipSeats === 0 || vipSeats % divisor === 0);
    const seatsPerRow = candidates.length > 0
      ? candidates.reduce((best, candidate) => {
          const target = currentSeatsPerRow || DEFAULT_SEATS_PER_ROW;
          const bestDistance = Math.abs(best - target);
          const candidateDistance = Math.abs(candidate - target);
          if (candidateDistance < bestDistance) return candidate;
          if (candidateDistance === bestDistance && candidate > best) return candidate;
          return best;
        }, candidates[0])
      : currentSeatsPerRow;

    const rows = Math.max(1, Math.ceil(totalSeats / seatsPerRow));
    const vipRowCount = vipSeats > 0 ? Math.min(rows, Math.ceil(vipSeats / seatsPerRow)) : 0;

    return {
      rows,
      seatsPerRow,
      vipRows: Array.from({ length: vipRowCount }, (_, index) => index),
    };
  };

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Local date bounds for datepicker
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(new Date());
  const threeYearsFromNow = new Date();
  threeYearsFromNow.setFullYear(threeYearsFromNow.getFullYear() + 3);
  const maxDateStr = getLocalDateString(threeYearsFromNow);

  // Form state
  const [form, setForm] = useState<any>({
    title: '',
    description: '',
    category: 'anime',
    date: '', // YYYY-MM-DD
    startTime: '09:00', // HH:MM
    endTime: '21:00', // HH:MM
    location: '',
    venue: '',
    formattedAddress: '', // Địa chỉ chi tiết đầy đủ (từ autocomplete)
    coordinates: null as { lat: number; lng: number } | null, // Tọa độ bản đồ
    organizer: '',
    price: 0,
    vipPrice: 0,
    totalSeats: 100,
    image: '',
    imagePublicId: '',
    status: 'active', // 'active' for published now, 'draft' for not
    tags: '',
    ticketTypes: [
      { name: 'Regular', price: 0, quantity: 100 }
    ],
    seatMap: { rows: 10, seatsPerRow: 12, vipRows: '0,1' },
  });

  /** Callback khi user chọn địa chỉ từ autocomplete */
  const handleLocationSelect = useCallback((result: LocationResult) => {
    setForm((prev: any) => ({
      ...prev,
      venue: result.formattedAddress,
      formattedAddress: result.formattedAddress,
      coordinates: { lat: result.lat, lng: result.lng },
    }));
  }, []);

  // Fetch event data if editing
  useEffect(() => {
    if (!id) return;

    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await eventService.getEventById(id);
        const event = res.data;

        // Parse date and time
        const eventDate = new Date(event.date);
        const datePart = eventDate.toISOString().slice(0, 10);
        const startTimePart = eventDate.toTimeString().slice(0, 5);

        let endTimePart = '21:00';
        if (event.endDate) {
          endTimePart = new Date(event.endDate).toTimeString().slice(0, 5);
        }

        // Parse seatMap vipRows
        const vipRowsStr = (event.seatMap?.vipRows || []).join(',');

        // Build initial ticket types list
        let ticketTypes = event.ticketTypes || [];
        if (ticketTypes.length === 0) {
          ticketTypes = [{ name: 'Regular', price: event.price || 0, quantity: event.totalSeats || 100 }];
          if (event.vipPrice) {
            ticketTypes.push({ name: 'VIP', price: event.vipPrice, quantity: 0 });
          }
        }

        setForm({
          title: event.title || '',
          description: event.description || '',
          category: event.category || 'anime',
          date: datePart,
          startTime: startTimePart,
          endTime: endTimePart,
          location: event.location || '',
          venue: event.venue || '',
          formattedAddress: event.formattedAddress || event.venue || '',
          coordinates: event.coordinates || null,
          organizer: event.organizer || '',
          price: event.price || 0,
          vipPrice: event.vipPrice || 0,
          totalSeats: event.totalSeats || 100,
          image: event.image || '',
          imagePublicId: event.imagePublicId || '',
          status: event.status === 'active' ? 'active' : 'draft',
          tags: (event.tags || []).join(', '),
          ticketTypes,
          seatMap: {
            rows: event.seatMap?.rows || 10,
            seatsPerRow: event.seatMap?.seatsPerRow || 12,
            vipRows: vipRowsStr,
          },
        });
      } catch (err) {
        toast.error('Lỗi khi lấy thông tin sự kiện');
        console.error(err);
        navigate('/admin/events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, navigate]);

  // Sync capacity and base price automatically when ticket types change
  useEffect(() => {
    const totalQty = form.ticketTypes.reduce((sum: number, type: any) => sum + (Number(type.quantity) || 0), 0);
    const basePrice = form.ticketTypes[0]?.price || 0;
    const vipPrice = form.ticketTypes.find((t: any) => t.name.toLowerCase() === 'vip')?.price || form.ticketTypes[1]?.price || 0;
    const normalizedSeatMap = buildNormalizedSeatMap(form.ticketTypes, form.seatMap);

    setForm((prev: any) => ({
      ...prev,
      totalSeats: totalQty,
      price: basePrice,
      vipPrice: vipPrice,
      seatMap: normalizedSeatMap,
    }));
  }, [form.ticketTypes]);

  // Handle dynamic ticket types edit
  const handleTicketTypeChange = (index: number, key: string, value: any) => {
    const updated = [...form.ticketTypes];
    updated[index] = { ...updated[index], [key]: value };
    setForm((prev: any) => ({ ...prev, ticketTypes: updated }));
  };

  const addTicketType = () => {
    const name = form.ticketTypes.length === 1 ? 'VIP' : `Loại vé #${form.ticketTypes.length + 1}`;
    setForm((prev: any) => ({
      ...prev,
      ticketTypes: [...prev.ticketTypes, { name, price: 0, quantity: 100 }]
    }));
  };

  const removeTicketType = (index: number) => {
    if (form.ticketTypes.length <= 1) return;
    const updated = form.ticketTypes.filter((_: any, i: number) => i !== index);
    setForm((prev: any) => ({ ...prev, ticketTypes: updated }));
  };

  // Image upload
  const handleFile = async (f?: File) => {
    if (!f) return;
    try {
      setUploading(true);
      const res = await uploadService.uploadImage(f);
      setForm((prev: any) => ({ ...prev, image: res.url, imagePublicId: res.public_id }));
      toast.success('Tải ảnh lên thành công');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload ảnh thất bại');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Form submit
  const handleSave = async () => {
    try {
      if (!form.title.trim()) return toast.error('Vui lòng nhập tiêu đề sự kiện');
      if (!form.description.trim()) return toast.error('Vui lòng nhập mô tả sự kiện');
      if (!form.category) return toast.error('Vui lòng chọn danh mục');
      if (!form.date) return toast.error('Vui lòng chọn ngày sự kiện');

      // Verify date (not earlier than today, not further than 3 years from today)
      const selectedDate = new Date(form.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 3);
      maxDate.setHours(23, 59, 59, 999);

      if (selectedDate < today) {
        return toast.error('Ngày sự kiện không được sớm hơn ngày hiện hành');
      }
      if (selectedDate > maxDate) {
        return toast.error('Ngày sự kiện không được cách quá ngày hiện hành 3 năm');
      }

      if (!form.startTime) return toast.error('Vui lòng chọn giờ bắt đầu');
      if (!form.endTime) return toast.error('Vui lòng chọn giờ kết thúc');
      if (!form.location.trim()) return toast.error('Vui lòng nhập địa điểm');
      if (!form.image) return toast.error('Vui lòng tải lên ảnh sự kiện');

      // Construct start/end dates
      const startDateStr = `${form.date}T${form.startTime}:00`;
      const endDateStr = `${form.date}T${form.endTime}:00`;

      // Handle tags
      const tagsArray = (form.tags || '')
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean);

      // Calculate total seats & price mapping
      const totalQty = form.ticketTypes.reduce((sum: number, type: any) => sum + (Number(type.quantity) || 0), 0);
      const firstPrice = Number(form.ticketTypes[0]?.price) || 0;
      const vipType = form.ticketTypes.find((t: any) => t.name.toLowerCase() === 'vip') || form.ticketTypes[1];
      const secondPrice = vipType ? Number(vipType.price) : 0;
      const normalizedSeatMap = buildNormalizedSeatMap(form.ticketTypes, form.seatMap);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        date: new Date(startDateStr),
        endDate: new Date(endDateStr),
        location: form.location.trim(),
        venue: form.venue.trim() || form.location.trim(), // fallback to location if venue is empty
        formattedAddress: form.formattedAddress?.trim() || form.venue?.trim() || form.location.trim(),
        ...(form.coordinates ? { coordinates: form.coordinates } : {}),
        organizer: form.organizer.trim() || 'JC-Ticket Organizers',
        price: firstPrice,
        vipPrice: secondPrice,
        totalSeats: totalQty,
        availableSeats: totalQty,
        image: form.image,
        imagePublicId: form.imagePublicId,
        status: form.status === 'active' ? 'active' : 'draft',
        tags: tagsArray,
        ticketTypes: form.ticketTypes.map((t: any) => ({
          name: t.name.trim(),
          price: Number(t.price),
          quantity: Number(t.quantity),
        })),
        seatMap: normalizedSeatMap,
      };

      setLoading(true);
      if (id) {
        await eventService.updateEvent(id, payload);
        toast.success('Cập nhật sự kiện thành công');
      } else {
        await eventService.createEvent(payload);
        toast.success('Tạo sự kiện thành công');
      }
      navigate('/admin/events');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu sự kiện');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cardBg = isDark ? 'bg-charcoal/80 border-zinc-800' : 'bg-white border-gray-200';
  const inputBg = isDark ? 'bg-midnight border-zinc-700 text-cream focus:border-akai' : 'bg-white border-gray-300 text-ink focus:border-akai';
  const labelColor = isDark ? 'text-cream/80' : 'text-charcoal/80';

  if (loading && id) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-akai border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full mx-auto">
      {/* Breadcrumb / Back Link */}
      <button
        onClick={() => navigate('/admin/events')}
        className="flex items-center gap-2 text-xs font-semibold opacity-60 hover:opacity-100 transition-opacity mb-5"
      >
        <ArrowLeft size={14} /> Quay lại danh sách sự kiện
      </button>

      {/* Main Card */}
      <div className={`p-6 md:p-8 rounded-2xl shadow-xl border ${cardBg}`}>
          <div className="space-y-6">
            {/* Tiêu đề sự kiện */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${labelColor}`}>
                Tiêu đề sự kiện <span className="text-akai">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Nhập tiêu đề sự kiện"
                className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${inputBg}`}
              />
            </div>

            {/* Mô tả */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${labelColor}`}>
                Mô tả <span className="text-akai">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Nhập mô tả sự kiện"
                rows={5}
                className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all resize-none ${inputBg}`}
              />
            </div>

            {/* Danh mục & Ngày */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelColor}`}>
                  Danh mục <span className="text-akai">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${inputBg}`}
                >
                  <option value="anime">Anime & Pop Culture</option>
                  <option value="traditional">Văn hóa truyền thống</option>
                  <option value="food">Lễ hội ẩm thực</option>
                  <option value="music">Âm nhạc & Concert</option>
                  <option value="travel">Du lịch & Tour</option>
                  <option value="seasonal">Lễ hội theo mùa</option>
                  <option value="cinema">Điện ảnh / Phim</option>
                  <option value="sports">Thể thao</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelColor}`}>
                  Ngày sự kiện <span className="text-akai">*</span>
                </label>
                <input
                  type="date"
                  value={form.date}
                  min={todayStr}
                  max={maxDateStr}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${inputBg}`}
                />
              </div>
            </div>

            {/* Giờ bắt đầu & Giờ kết thúc */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelColor}`}>
                  Giờ bắt đầu <span className="text-akai">*</span>
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelColor}`}>
                  Giờ kết thúc <span className="text-akai">*</span>
                </label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${inputBg}`}
                />
              </div>
            </div>

            {/* Địa điểm & Địa điểm cụ thể (Venue) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelColor}`}>
                  Địa điểm (Tỉnh/Thành) <span className="text-akai">*</span>
                </label>
                <select
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${inputBg}`}
                >
                  <option value="">-- Chọn Tỉnh/Thành --</option>
                  {VIETNAM_PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelColor}`}>
                  Địa điểm cụ thể (Venue)
                  <span className={`ml-2 text-xs font-normal ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                    — gõ để tìm &amp; chọn địa chỉ
                  </span>
                </label>
                <LocationAutocomplete
                  value={form.venue}
                  onChange={(val) => setForm((prev: any) => ({ ...prev, venue: val }))}
                  onSelect={handleLocationSelect}
                  placeholder="Ví dụ: SECC Quận 7, Hội trường..."
                  inputClassName={`py-2.5 rounded-xl border outline-none transition-all ${inputBg}`}
                />
              </div>
            </div>

            {/* Bản đồ preview khi đã chọn địa chỉ */}
            {form.coordinates?.lat && form.coordinates?.lng && (
              <div className="space-y-1.5">
                <p className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                  📍 Xem trước vị trí trên bản đồ
                </p>
                <MapPreview
                  lat={form.coordinates.lat}
                  lng={form.coordinates.lng}
                  address={form.formattedAddress || form.venue}
                  height={200}
                  zoom={15}
                />
              </div>
            )}

            {/* Sức chứa & Giá cơ bản */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelColor}`}>
                  Sức chứa (Capacity) <span className="text-akai">*</span>
                </label>
                <input
                  type="number"
                  disabled
                  value={form.totalSeats}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all opacity-70 bg-gray-100 dark:bg-zinc-800 ${isDark ? 'border-zinc-700 text-zinc-400' : 'border-gray-200 text-gray-500'}`}
                  title="Sức chứa được tính tự động từ tổng số lượng các loại vé."
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelColor}`}>
                  Giá cơ bản
                </label>
                <input
                  type="number"
                  disabled
                  value={form.price}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all opacity-70 bg-gray-100 dark:bg-zinc-800 ${isDark ? 'border-zinc-700 text-zinc-400' : 'border-gray-200 text-gray-500'}`}
                  title="Giá cơ bản được lấy tự động từ loại vé đầu tiên."
                />
              </div>
            </div>

            {/* Loại vé */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className={`text-sm font-semibold ${labelColor}`}>
                  Loại vé <span className="text-akai">*</span>
                </label>
                <button
                  type="button"
                  onClick={addTicketType}
                  className="text-xs text-akai hover:underline flex items-center gap-1 font-medium"
                >
                  <Plus size={14} /> Thêm loại vé
                </button>
              </div>

              <div className="space-y-3">
                {form.ticketTypes.map((type: any, index: number) => (
                  <div key={index} className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-xl border border-dashed dark:border-zinc-800 bg-cream/20 dark:bg-midnight/35">
                    <div className="flex-1">
                      <p className="text-xs opacity-50 mb-1">Tên loại vé (Ví dụ: Regular)</p>
                      <input
                        type="text"
                        value={type.name}
                        onChange={(e) => handleTicketTypeChange(index, 'name', e.target.value)}
                        placeholder="Regular"
                        className={`w-full px-3 py-1.5 rounded-lg border outline-none text-sm transition-all ${inputBg}`}
                      />
                    </div>
                    <div className="w-full md:w-36">
                      <p className="text-xs opacity-50 mb-1">Giá (VND)</p>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={type.price !== undefined && type.price !== null && type.price !== '' ? Number(type.price).toLocaleString('vi-VN') : ''}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, '');
                            handleTicketTypeChange(index, 'price', rawValue ? Number(rawValue) : '');
                          }}
                          placeholder="Giá"
                          className={`w-full pl-3 pr-8 py-1.5 rounded-lg border outline-none text-sm transition-all ${inputBg}`}
                        />
                        <div className="absolute right-1.5 flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              const currentVal = Number(type.price || 0);
                              handleTicketTypeChange(index, 'price', currentVal + 10000);
                            }}
                            className="p-0.5 hover:bg-cream/20 dark:hover:bg-midnight/20 rounded text-gray-400 hover:text-akai transition-colors"
                          >
                            <ChevronUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const currentVal = Number(type.price || 0);
                              handleTicketTypeChange(index, 'price', Math.max(0, currentVal - 10000));
                            }}
                            className="p-0.5 hover:bg-cream/20 dark:hover:bg-midnight/20 rounded text-gray-400 hover:text-akai transition-colors"
                          >
                            <ChevronDown size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-28">
                      <p className="text-xs opacity-50 mb-1">Số lượng</p>
                      <input
                        type="number"
                        value={type.quantity}
                        onChange={(e) => handleTicketTypeChange(index, 'quantity', Number(e.target.value))}
                        placeholder="Số lượng"
                        step={10}
                        min={0}
                        className={`w-full px-3 py-1.5 rounded-lg border outline-none text-sm transition-all ${inputBg}`}
                      />
                    </div>
                    {form.ticketTypes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTicketType(index)}
                        className="mt-4 md:mt-0 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg self-end md:self-center transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Checkbox Xuất bản ngay */}
            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="publishNow"
                checked={form.status === 'active'}
                onChange={(e) => setForm({ ...form, status: e.target.checked ? 'active' : 'draft' })}
                className="w-4.5 h-4.5 text-akai border-gray-300 dark:border-zinc-700 rounded focus:ring-akai focus:ring-2 cursor-pointer"
              />
              <label htmlFor="publishNow" className="text-sm font-semibold select-none cursor-pointer">
                Xuất bản ngay
              </label>
            </div>

            {/* Collapsible Advanced Settings */}
            <div className={`border-t pt-4 ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full py-2 text-sm font-semibold opacity-80 hover:opacity-100 transition-opacity"
              >
                <span className="text-base font-bold">⚙️ Cấu hình nâng cao & Sơ đồ ghế</span>
                {showAdvanced ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 pt-2">
                  {/* Ảnh sự kiện */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${labelColor}`}>
                      Ảnh sự kiện <span className="text-akai">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      {form.image ? (
                        <img src={form.image} alt="preview" className="w-48 h-28 object-cover rounded-xl border border-gray-200 dark:border-zinc-800 shadow" />
                      ) : (
                        <div className={`w-48 h-28 rounded-xl border border-dashed flex flex-col items-center justify-center text-xs opacity-50 ${isDark ? 'border-zinc-700' : 'border-gray-300'}`}>
                          <Image size={24} className="mb-2" />
                          Chưa có ảnh
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <label className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer text-xs font-semibold hover:bg-cream/10 dark:hover:bg-midnight/10 transition-colors ${inputBg}`}>
                          <Upload size={14} /> Chọn ảnh tải lên
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFile(e.target.files?.[0])}
                            className="hidden"
                          />
                        </label>
                        {uploading && <div className="text-xs text-akai animate-pulse font-medium">Đang tải lên...</div>}
                      </div>
                    </div>
                  </div>

                  {/* Tổ chức bởi & Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${labelColor}`}>
                        Tổ chức bởi
                      </label>
                      <input
                        type="text"
                        value={form.organizer}
                        onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                        placeholder="Nhập đơn vị tổ chức"
                        className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${inputBg}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${labelColor}`}>
                        Tags (cách nhau bằng dấu phẩy)
                      </label>
                      <input
                        type="text"
                        value={form.tags}
                        onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        placeholder="anime, matsuri, concert"
                        className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${inputBg}`}
                      />
                    </div>
                  </div>

                  {/* Seat Map Configuration */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'border-zinc-800 bg-midnight/20' : 'border-gray-150 bg-cream/10'}`}>
                    <h4 className="text-base font-bold mb-3">🎭 Thiết lập sơ đồ ghế (Seat Map)</h4>
                    <p className="text-sm opacity-60 mb-4">
                      Sơ đồ này quyết định hiển thị các hàng ghế trên trang chi tiết để khách chọn ghế.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm opacity-75 mb-1.5 font-semibold">Số hàng ghế</label>
                        <input
                          type="number"
                          value={form.seatMap.rows}
                          onChange={(e) => setForm({ ...form, seatMap: { ...form.seatMap, rows: Number(e.target.value) || 10 } })}
                          className={`w-full px-3 py-2 rounded-lg border outline-none text-base transition-all ${inputBg}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm opacity-75 mb-1.5 font-semibold">Số ghế mỗi hàng</label>
                        <input
                          type="number"
                          value={form.seatMap.seatsPerRow}
                          onChange={(e) => setForm({ ...form, seatMap: { ...form.seatMap, seatsPerRow: Number(e.target.value) || 12 } })}
                          className={`w-full px-3 py-2 rounded-lg border outline-none text-base transition-all ${inputBg}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm opacity-75 mb-1.5 font-semibold">Hàng VIP (0-based, cách nhau bằng dấu phẩy)</label>
                        <input
                          type="text"
                          value={form.seatMap.vipRows}
                          onChange={(e) => setForm({ ...form, seatMap: { ...form.seatMap, vipRows: e.target.value } })}
                          placeholder="0,1"
                          className={`w-full px-3 py-2 rounded-lg border outline-none text-base transition-all ${inputBg}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center items-center gap-4 pt-4">
              <button
                type="button"
                disabled={loading || uploading}
                onClick={handleSave}
                className="px-8 py-3 bg-akai hover:bg-sakura-dark text-white text-sm font-bold rounded-xl shadow-lg shadow-akai/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang lưu...' : id ? 'Lưu thay đổi' : 'Tạo sự kiện'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/events')}
                className="px-8 py-3 text-sm font-semibold opacity-60 hover:opacity-100 transition-opacity"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
