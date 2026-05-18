import { useState } from 'react';
import { Search, MapPin, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  onSearch?: (filters: SearchFilters) => void;
}

interface SearchFilters {
  query: string;
  date: string;
  location: string;
}

/**
 * Search Bar - Prominent search section for finding events
 * Supports search by name, date, and location
 */
export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    date: '',
    location: '',
  });

  const handleSearch = () => {
    onSearch?.(filters);
  };

  return (
    <section className="relative -mt-12 z-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="card-elegant p-6 md:p-8"
        >
          <h3 className="text-xl font-bold text-ink mb-6 flex items-center space-x-2">
            <Search className="text-akai" size={24} />
            <span>{t('search.title')}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Event Name Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-charcoal dark:text-cream mb-2">
                {t('search.eventName')}
              </label>
              <input
                type="text"
                placeholder={t('search.eventNamePlaceholder')}
                value={filters.query}
                onChange={(e) =>
                  setFilters({ ...filters, query: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border-2 border-cream focus:border-akai focus:outline-none transition-colors bg-white dark:bg-charcoal text-ink dark:text-cream"
              />
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-semibold text-charcoal dark:text-cream mb-2">
                {t('search.date')}
              </label>
              <div className="relative">
                <Calendar
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-akai pointer-events-none"
                />
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) =>
                    setFilters({ ...filters, date: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-cream focus:border-akai focus:outline-none transition-colors bg-white dark:bg-charcoal text-ink dark:text-cream"
                />
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-semibold text-charcoal dark:text-cream mb-2">
                {t('search.location')}
              </label>
              <div className="relative">
                <MapPin
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-akai pointer-events-none"
                />
                <select
                  value={filters.location}
                  onChange={(e) =>
                    setFilters({ ...filters, location: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-cream focus:border-akai focus:outline-none transition-colors appearance-none bg-white dark:bg-charcoal text-ink dark:text-cream"
                >
                  <option value="">{t('search.allLocations')}</option>
                  <option value="hanoi">{t('search.locationHanoi')}</option>
                  <option value="saigon">{t('search.locationSaigon')}</option>
                  <option value="danang">{t('search.locationDanang')}</option>
                  <option value="japan">{t('search.locationJapan')}</option>
                </select>
              </div>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearch}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <Search size={18} />
                <span>{t('search.search')}</span>
              </motion.button>
            </div>
          </div>

          {/* Popular searches */}
          <div className="mt-6 pt-6 border-t border-cream">
            <p className="text-sm text-charcoal/60 mb-3">{t('search.popular')}:</p>
            <div className="flex flex-wrap gap-2">
              {[
                t('search.popular1'),
                t('search.popular2'),
                t('search.popular3'),
                t('search.popular4'),
              ].map(
                (search) => (
                  <motion.button
                    key={search}
                    whileHover={{ scale: 1.05 }}
                    onClick={() =>
                      setFilters({ ...filters, query: search })
                    }
                    className="px-4 py-2 rounded-full bg-cream hover:bg-akai/10 text-charcoal hover:text-akai transition-colors text-sm font-medium"
                  >
                    {search}
                  </motion.button>
                )
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
