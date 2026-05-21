import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

/**
 * EventsPage - Trang danh sách tất cả sự kiện
 */
export default function EventsPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    { id: '', label: 'Tất cả', icon: '🎯' },
    { id: 'anime', label: 'Anime', icon: '🎌' },
    { id: 'music', label: 'Âm nhạc', icon: '🎵' },
    { id: 'traditional', label: 'Truyền thống', icon: '⛩️' },
    { id: 'food', label: 'Ẩm thực', icon: '🍜' },
    { id: 'travel', label: 'Du lịch', icon: '🗻' },
    { id: 'seasonal', label: 'Theo mùa', icon: '🌸' },
  ];

  // Reset page to 1 when category changes
  useEffect(() => {
    setPage(1);
  }, [category]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12 };
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await eventService.getEvents(params);
      setEvents(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error('Fetch events error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [page, category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleCategoryChange = (catId: string) => {
    setSearchParams((prev) => {
      if (catId) {
        prev.set('category', catId);
      } else {
        prev.delete('category');
      }
      prev.set('page', '1');
      return prev;
    });
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-ink text-cream' : 'bg-gray-50 text-ink'}`}>
      <Navbar />

      {/* Hero Header */}
      <section className={`pt-24 pb-12 px-4 ${isDark ? 'bg-gradient-to-br from-midnight via-ink to-charcoal' : 'bg-gradient-to-br from-cream via-white to-sakura/20'}`}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold font-elegant mb-3">
              🎌 Khám phá <span className="text-akai">Sự kiện</span>
            </h1>
            <p className={`text-lg ${isDark ? 'text-cream/70' : 'text-charcoal/70'}`}>
              Tìm kiếm và đặt vé cho những sự kiện văn hóa Nhật Bản hấp dẫn nhất
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`max-w-2xl mx-auto flex items-center gap-3 p-2 rounded-2xl ${isDark ? 'bg-charcoal/80 border border-zinc-700' : 'bg-white border border-gray-200'} shadow-lg`}
          >
            <div className="flex-1 flex items-center gap-2 px-4">
              <Search size={20} className="text-akai" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm sự kiện..."
                className={`w-full bg-transparent outline-none text-sm py-2 ${isDark ? 'text-cream placeholder:text-zinc-500' : 'text-ink placeholder:text-gray-400'}`}
              />
              {search && (
                <button type="button" onClick={() => { setSearch(''); setPage(1); }} className="text-gray-400 hover:text-akai">
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-akai text-white rounded-xl font-semibold text-sm hover:bg-sakura-dark transition-colors"
            >
              Tìm kiếm
            </button>
          </motion.form>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  category === cat.id
                    ? 'bg-akai text-white shadow-lg shadow-akai/30'
                    : isDark
                      ? 'bg-charcoal text-cream/80 hover:bg-midnight border border-zinc-700'
                      : 'bg-white text-charcoal hover:bg-cream border border-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`animate-pulse rounded-2xl h-96 ${isDark ? 'bg-charcoal' : 'bg-gray-200'}`} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">🔍</p>
              <p className={`text-xl ${isDark ? 'text-cream/60' : 'text-charcoal/60'}`}>
                Không tìm thấy sự kiện nào
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event, index) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    onClick={() => navigate(`/events/${event._id}`)}
                    className={`cursor-pointer rounded-2xl overflow-hidden transition-all ${
                      isDark
                        ? 'bg-gradient-to-br from-zinc-900 to-gray-900 border border-zinc-800 hover:border-akai/50 shadow-xl hover:shadow-2xl hover:shadow-akai/10'
                        : 'bg-white border border-gray-200 shadow-md hover:shadow-xl'
                    }`}
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      <div className="absolute top-3 left-3 px-3 py-1 bg-akai text-white rounded-full text-xs font-semibold">
                        {event.category}
                      </div>
                      {event.availableSeats <= 10 && (
                        <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-500 text-white rounded-full text-xs font-bold animate-pulse">
                          ⚡ Sắp hết vé
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className={`font-bold text-lg mb-2 line-clamp-2 ${isDark ? 'text-white' : 'text-ink'}`}>
                        {event.title}
                      </h3>
                      <div className="space-y-1.5 mb-4">
                        <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-zinc-400' : 'text-charcoal/70'}`}>
                          <Calendar size={14} className="text-akai" />
                          <span>{new Date(event.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        </div>
                        <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-zinc-400' : 'text-charcoal/70'}`}>
                          <MapPin size={14} className="text-akai" />
                          <span>{event.location}</span>
                        </div>
                      </div>

                      <div className={`border-t pt-4 flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
                        <div>
                          <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-charcoal/50'}`}>Từ</span>
                          <p className="text-xl font-bold text-akai">
                            {event.price.toLocaleString('vi-VN')}₫
                          </p>
                        </div>
                        <div className="px-4 py-2 bg-akai text-white rounded-xl text-sm font-semibold hover:bg-sakura-dark transition-colors">
                          Đặt vé →
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                        page === p
                          ? 'bg-akai text-white'
                          : isDark
                            ? 'bg-charcoal text-cream hover:bg-midnight'
                            : 'bg-white text-charcoal hover:bg-cream border border-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
