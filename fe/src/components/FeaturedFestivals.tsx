import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

interface Festival {
  id: string;
  name: string;
  image: string;
  description: string;
  date: string;
  highlight: string;
}

interface FeaturedFestivalsProps {
  onFestivalClick?: (festival: Festival) => void;
}

/**
 * Featured Festivals Section - Showcase special/premium festivals
 * Large format with carousel-style layout
 */
export const FeaturedFestivals: React.FC<FeaturedFestivalsProps> = ({
  onFestivalClick,
}) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const festivals: Festival[] = [
    {
      id: '1',
      name: t('festivals.items.1.name'),
      image: 'https://images.unsplash.com/photo-1545809980-e44ff8b7f02d?w=800&h=500&fit=crop',
      description: t('festivals.items.1.description'),
      date: t('festivals.items.1.date'),
      highlight: t('festivals.items.1.highlight'),
    },
    {
      id: '2',
      name: t('festivals.items.2.name'),
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop',
      description: t('festivals.items.2.description'),
      date: t('festivals.items.2.date'),
      highlight: t('festivals.items.2.highlight'),
    },
    {
      id: '3',
      name: t('festivals.items.3.name'),
      image: 'https://images.unsplash.com/photo-1545809983-2c3e0ea20e50?w=800&h=500&fit=crop',
      description: t('festivals.items.3.description'),
      date: t('festivals.items.3.date'),
      highlight: t('festivals.items.3.highlight'),
    },
  ];

  return (
    <section
      id="festivals"
      className={`py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark ? 'bg-gradient-to-b from-gray-950 via-black to-gray-950' : 'bg-gradient-to-b from-white to-gray-50'}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className={`text-4xl md:text-5xl font-bold font-elegant mb-4 ${
            isDark 
              ? 'text-white' 
              : 'text-ink'
          }`}>
            {t('festivals.title')}
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${
            isDark 
              ? 'text-zinc-400' 
              : 'text-charcoal/70'
          }`}>
            {t('festivals.subtitle')}
          </p>
        </motion.div>

        {/* Festivals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {festivals.map((festival, idx) => (
            <motion.div
              key={festival.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => onFestivalClick?.(festival)}
              className={`group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 ${
                isDark
                  ? 'bg-gradient-to-br from-zinc-900 to-gray-900 border border-zinc-800 hover:border-zinc-700 shadow-xl hover:shadow-2xl hover:shadow-akai/20'
                  : 'bg-white border border-gray-200 shadow-md hover:shadow-xl'
              }`}
            >
              {/* Image Container */}
              <div className="relative h-64 overflow-hidden bg-gradient-to-br from-akai/20 to-sakura/20">
                <motion.img
                  src={festival.image}
                  alt={festival.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />

                {/* Highlight Badge */}
                <div className="absolute bottom-4 left-4 bg-akai text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-akai/50">
                  ✦ {festival.highlight}
                </div>

                {/* Overlay gradient */}
                <div className={`absolute inset-0 bg-gradient-to-t transition-opacity ${
                  isDark 
                    ? 'from-zinc-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100' 
                    : 'from-black/40 to-transparent opacity-0 group-hover:opacity-100'
                }`} />
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col h-full">
                {/* Date */}
                <p className="text-sm font-semibold text-akai mb-3">
                  📅 {festival.date}
                </p>

                {/* Title */}
                <h3 className={`text-xl font-bold mb-3 group-hover:text-akai transition-colors line-clamp-2 ${isDark ? 'text-white' : 'text-ink'}`}>
                  {festival.name}
                </h3>

                {/* Description */}
                <p className={`text-sm mb-4 flex-1 line-clamp-3 ${isDark ? 'text-zinc-400' : 'text-charcoal/70'}`}>
                  {festival.description}
                </p>

                {/* Divider */}
                <div className={`border-t my-4 ${isDark ? 'border-zinc-800' : 'border-gray-200'}`} />

                {/* CTA Link */}
                <motion.button
                  whileHover={{ x: 5 }}
                  className={`inline-flex items-center space-x-2 font-semibold transition-colors self-start ${
                    isDark 
                      ? 'text-akai hover:text-sakura-dark' 
                      : 'text-akai hover:text-sakura-dark'
                  }`}
                >
                  <span>{t('festivals.viewDetails')}</span>
                  <ChevronRight size={18} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
