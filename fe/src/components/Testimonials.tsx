import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

interface Testimonial {
  id: string;
  author: string;
  role: string;
  content: string;
  image: string;
  rating: number;
}

/**
 * Testimonials Section - Professional Dark Mode
 * Dark Mode: bg-black/zinc-900 cards with zinc-800 borders, text-white/zinc-400
 * Features: Star ratings, customer photos, smooth transitions, high contrast
 */
export const Testimonials: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const testimonials: Testimonial[] = [
    {
      id: '1',
      author: t('testimonials.items.1.author'),
      role: t('testimonials.items.1.role'),
      content: t('testimonials.items.1.content'),
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      rating: 5,
    },
    {
      id: '2',
      author: t('testimonials.items.2.author'),
      role: t('testimonials.items.2.role'),
      content: t('testimonials.items.2.content'),
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
      rating: 5,
    },
    {
      id: '3',
      author: t('testimonials.items.3.author'),
      role: t('testimonials.items.3.role'),
      content: t('testimonials.items.3.content'),
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
      rating: 5,
    },
    {
      id: '4',
      author: t('testimonials.items.4.author'),
      role: t('testimonials.items.4.role'),
      content: t('testimonials.items.4.content'),
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
      rating: 4.5,
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
    hidden: { opacity: 0, y: 20, rotateX: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      rotateX: 0,
      transition: { duration: 0.6 } 
    },
  };

  return (
    <section className={`py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-b from-gray-950 via-black to-gray-950' 
        : 'bg-gradient-to-b from-white to-gray-50'
    }`}>
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
            {t('testimonials.title')}
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${
            isDark 
              ? 'text-zinc-400' 
              : 'text-charcoal/70'
          }`}>
            {t('testimonials.subtitle')}
          </p>
        </motion.div>

        {/* Testimonials Grid - Professional Dark Mode Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.02 }}
              className={`group rounded-2xl transition-all duration-300 overflow-hidden ${
                isDark
                  ? 'bg-gradient-to-br from-zinc-900 to-gray-900 border border-zinc-800 hover:border-zinc-700 shadow-xl hover:shadow-2xl hover:shadow-akai/20'
                  : 'bg-white border border-gray-200 shadow-md hover:shadow-xl'
              }`}
            >
              {/* Card Content */}
              <div className="p-6 h-full flex flex-col">
                {/* Rating Stars */}
                <div className="flex items-center space-x-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <Star
                        size={16}
                        className={`transition-all duration-300 ${
                          i < Math.floor(testimonial.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : isDark ? 'text-zinc-700' : 'text-gray-300'
                        }`}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Quote - Italic with proper contrast in dark mode */}
                <p className={`text-sm mb-6 italic leading-relaxed flex-grow transition-colors duration-300 ${
                  isDark 
                    ? 'text-zinc-300' 
                    : 'text-charcoal/70'
                }`}>
                  "{testimonial.content}"
                </p>

                {/* Divider */}
                <div className={`my-4 h-px ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`} />

                {/* Author Section */}
                <div className="flex items-center space-x-3">
                  {/* Avatar with border */}
                  <motion.img
                    src={testimonial.image}
                    alt={testimonial.author}
                    className="w-12 h-12 rounded-full object-cover border-2 border-akai"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  />
                  <div>
                    {/* Author Name - White in dark mode */}
                    <p className={`font-semibold text-sm transition-colors duration-300 ${
                      isDark 
                        ? 'text-white group-hover:text-akai' 
                        : 'text-ink group-hover:text-akai'
                    }`}>
                      {testimonial.author}
                    </p>
                    {/* Author Role - zinc-400 in dark mode */}
                    <p className={`text-xs transition-colors duration-300 ${
                      isDark 
                        ? 'text-zinc-500 group-hover:text-zinc-400' 
                        : 'text-charcoal/60'
                    }`}>
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
