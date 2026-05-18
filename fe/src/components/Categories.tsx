import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
}

interface CategoriesProps {
  onCategoryClick?: (category: Category) => void;
}

/**
 * Categories Section - Display different event types/genres
 * Shows popular categories with icons and event counts
 */
export const Categories: React.FC<CategoriesProps> = ({ onCategoryClick }) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const categories: Category[] = [
    {
      id: 'anime',
      name: t('categories.anime'),
      icon: '🎌',
      count: 85,
      color: 'from-pink-500 to-sakura',
    },
    {
      id: 'traditional',
      name: t('categories.traditional'),
      icon: '⛩️',
      count: 42,
      color: 'from-red-600 to-akai',
    },
    {
      id: 'food',
      name: t('categories.food'),
      icon: '🍜',
      count: 67,
      color: 'from-orange-500 to-yellow-500',
    },
    {
      id: 'music',
      name: t('categories.music'),
      icon: '🎵',
      count: 58,
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'travel',
      name: t('categories.travel'),
      icon: '🗻',
      count: 34,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'seasonal',
      name: t('categories.seasonal'),
      icon: '🌸',
      count: 51,
      color: 'from-rose-500 to-sakura-dark',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.6 } 
    },
  };

  return (
    <section className={`py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark ? 'bg-gradient-to-b from-black via-gray-950 to-black' : 'bg-gradient-to-b from-white to-gray-50'}`}>
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
            {t('categories.title')}
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${
            isDark 
              ? 'text-zinc-400' 
              : 'text-charcoal/70'
          }`}>
            {t('categories.subtitle')}
          </p>
        </motion.div>

        {/* Categories Grid - Professional Dark Mode */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {categories.map((category) => (
            <motion.div
              key={category.id}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => onCategoryClick?.(category)}
              className={`group cursor-pointer rounded-2xl transition-all duration-300 overflow-hidden ${
                isDark
                  ? 'bg-gradient-to-br from-zinc-900 to-gray-900 border border-zinc-800 hover:border-zinc-700 shadow-xl hover:shadow-2xl hover:shadow-akai/20'
                  : `bg-gradient-to-br ${category.color} shadow-md hover:shadow-xl`
              }`}
            >
              {/* Card Background Accent */}
              {isDark && (
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${category.color.replace('from-', 'from-').replace('to-', 'to-').replace('500', '500/20').replace('600', '600/10')} pointer-events-none`} />
              )}

              {/* Card Content */}
              <div className="relative z-10 p-8 h-full flex flex-col items-center justify-center text-center">
                {/* Icon Container */}
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className={`mb-6 text-6xl transform group-hover:scale-125 transition-transform ${
                    isDark
                      ? 'group-hover:drop-shadow-[0_0_20px_rgba(220,20,60,0.5)]'
                      : ''
                  }`}
                >
                  {category.icon}
                </motion.div>

                {/* Title */}
                <h3 className={`text-xl font-bold mb-3 transition-colors ${
                  isDark 
                    ? 'text-white group-hover:text-akai' 
                    : 'text-white group-hover:scale-105'
                }`}>
                  {category.name}
                </h3>

                {/* Count */}
                <p className={`text-sm transition-colors ${
                  isDark 
                    ? 'text-zinc-400 group-hover:text-zinc-300' 
                    : 'text-white/80'
                }`}>
                  {category.count} {t('categories.events')}
                </p>

                {/* Hover Indicator Line */}
                {isDark && (
                  <motion.div
                    className="absolute bottom-0 left-1/2 h-1 w-0 bg-gradient-to-r from-akai to-sakura group-hover:w-16 transition-all duration-300"
                    style={{ originX: 0.5 }}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Browse All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <button className="btn-secondary">
            {t('categories.viewAll')}
          </button>
        </motion.div>
      </div>
    </section>
  );
};
