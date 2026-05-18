import { motion } from 'framer-motion';
import { EventCard } from './EventCard';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

interface Event {
  id: string;
  title: string;
  image: string;
  date: string;
  location: string;
  price: number;
  attendees: number;
  rating: number;
  category: string;
}

interface UpcomingEventsProps {
  onEventClick?: (event: Event) => void;
  onViewAll?: () => void;
}

/**
 * Upcoming Events Section - Display grid of upcoming events
 * Shows the soonest events happening
 */
export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  onEventClick,
  onViewAll,
}) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // Sample events data
  const events: Event[] = [
    {
      id: '1',
      title: t('upcoming.items.1.title'),
      image: 'https://images.unsplash.com/photo-1611339555312-e607c849352d?w=500&h=400&fit=crop',
      date: t('upcoming.items.1.date'),
      location: t('upcoming.items.1.location'),
      price: 250000,
      attendees: 5200,
      rating: 4.8,
      category: t('upcoming.items.1.category'),
    },
    {
      id: '2',
      title: t('upcoming.items.2.title'),
      image: 'https://images.unsplash.com/photo-1522383150241-6c85ef20cecc?w=500&h=400&fit=crop',
      date: t('upcoming.items.2.date'),
      location: t('upcoming.items.2.location'),
      price: 1200000,
      attendees: 8900,
      rating: 4.9,
      category: t('upcoming.items.2.category'),
    },
    {
      id: '3',
      title: t('upcoming.items.3.title'),
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=400&fit=crop',
      date: t('upcoming.items.3.date'),
      location: t('upcoming.items.3.location'),
      price: 450000,
      attendees: 3400,
      rating: 4.7,
      category: t('upcoming.items.3.category'),
    },
    {
      id: '4',
      title: t('upcoming.items.4.title'),
      image: 'https://images.unsplash.com/photo-1579584425555-c3ce017fd4351?w=500&h=400&fit=crop',
      date: t('upcoming.items.4.date'),
      location: t('upcoming.items.4.location'),
      price: 150000,
      attendees: 2800,
      rating: 4.6,
      category: t('upcoming.items.4.category'),
    },
    {
      id: '5',
      title: t('upcoming.items.5.title'),
      image: 'https://images.unsplash.com/photo-1533636786983-cbca32511b39?w=500&h=400&fit=crop',
      date: t('upcoming.items.5.date'),
      location: t('upcoming.items.5.location'),
      price: 180000,
      attendees: 1950,
      rating: 4.5,
      category: t('upcoming.items.5.category'),
    },
    {
      id: '6',
      title: t('upcoming.items.6.title'),
      image: 'https://images.unsplash.com/photo-1493976040803-0f6688e74d11?w=500&h=400&fit=crop',
      date: t('upcoming.items.6.date'),
      location: t('upcoming.items.6.location'),
      price: 2500000,
      attendees: 456,
      rating: 4.9,
      category: t('upcoming.items.6.category'),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section
      id="events"
      className={`py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark ? 'bg-gradient-to-b from-gray-950 via-black to-gray-950' : 'bg-white'}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-12"
        >
          <div>
            <h2 className={`text-4xl md:text-5xl font-bold font-elegant mb-4 ${
              isDark 
                ? 'text-white' 
                : 'text-ink'
            }`}>
              {t('events.title')}
            </h2>
            <p className={`text-lg max-w-2xl ${
              isDark 
                ? 'text-zinc-400' 
                : 'text-charcoal/70'
            }`}>
              {t('events.subtitle')}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onViewAll}
            className="mt-6 md:mt-0 btn-ghost flex items-center space-x-2"
          >
            <span>{t('events.viewAll')}</span>
            <ArrowRight size={18} />
          </motion.button>
        </motion.div>

        {/* Events Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {events.map((event) => (
            <motion.div
              key={event.id}
              variants={itemVariants}
            >
              <EventCard
                {...event}
                onClick={() => onEventClick?.(event)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
