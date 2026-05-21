import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EventCard } from './EventCard';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { eventService } from '../services/eventService';

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

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Sample events data to fallback to if DB is empty/fails
  const sampleEvents: Event[] = [
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

  useEffect(() => {
    let isMounted = true;
    const fetchUpcoming = async () => {
      try {
        const res = await eventService.getEvents({ page: 1, limit: 6 });
        if (isMounted) {
          if (res && res.data && res.data.length > 0) {
            const mapped = res.data.map((evt: any) => ({
              id: evt._id,
              title: evt.title,
              image: evt.image,
              date: new Date(evt.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
              location: evt.location,
              price: evt.price,
              attendees: evt.attendees || 0,
              rating: evt.rating || 4.5,
              category: evt.category,
            }));
            setEvents(mapped);
          } else {
            setEvents(sampleEvents);
          }
        }
      } catch (err) {
        console.error('Error fetching upcoming events:', err);
        if (isMounted) {
          setEvents(sampleEvents);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUpcoming();
    return () => {
      isMounted = false;
    };
  }, [t]);

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
          className="flex flex-col items-center text-center mb-12"
        >
          <div className="max-w-3xl mx-auto">
            <h2 className={`text-4xl md:text-5xl font-bold font-elegant mb-4 ${
              isDark 
                ? 'text-white' 
                : 'text-ink'
            }`}>
              {t('events.title')}
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${
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
            className="mt-6 btn-ghost flex items-center space-x-2"
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
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className={`animate-pulse rounded-2xl h-[420px] ${isDark ? 'bg-zinc-800' : 'bg-gray-200'}`} />
            ))
          ) : (
            events.map((event) => (
              <motion.div
                key={event.id}
                variants={itemVariants}
              >
                <EventCard
                  {...event}
                  onClick={() => onEventClick?.(event)}
                />
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </section>
  );
};
