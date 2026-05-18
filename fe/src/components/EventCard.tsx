import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { ProtectedButton } from './ProtectedButton';

interface EventCardProps {
  id: string;
  title: string;
  image: string;
  date: string;
  location: string;
  price: number;
  attendees: number;
  rating: number;
  category: string;
  onClick?: () => void;
}

/**
 * EventCard Component - Individual event card for grid display
 * Shows event details: image, date, location, price, rating
 */
export const EventCard: React.FC<EventCardProps> = ({
  title,
  image,
  date,
  location,
  price,
  attendees,
  rating,
  category,
  onClick,
}) => {
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -10 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`group cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 ${
        isDark
          ? 'bg-gradient-to-br from-zinc-900 to-gray-900 border border-zinc-800 hover:border-zinc-700 shadow-xl hover:shadow-2xl hover:shadow-akai/20'
          : 'bg-white border border-gray-200 shadow-md hover:shadow-xl'
      }`}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-cream to-sakura">
        <motion.img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />

        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-akai text-white px-3 py-1 rounded-full text-xs font-semibold">
          {category}
        </div>

        {/* Rating Badge */}
        <div className={`absolute top-3 right-3 backdrop-blur px-2 py-1 rounded-lg flex items-center space-x-1 ${
          isDark 
            ? 'bg-zinc-900/90 text-yellow-400' 
            : 'bg-white/90 text-charcoal'
        }`}>
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-bold">{rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className={`font-bold text-lg mb-3 line-clamp-2 group-hover:text-akai transition-colors ${isDark ? 'text-white' : 'text-ink'}`}>
          {title}
        </h3>

        {/* Details */}
        <div className="space-y-2 mb-4">
          {/* Date */}
          <div className={`flex items-center space-x-2 text-sm ${isDark ? 'text-zinc-400' : 'text-charcoal/70'}`}>
            <Calendar size={16} className="text-akai" />
            <span>{date}</span>
          </div>

          {/* Location */}
          <div className={`flex items-center space-x-2 text-sm ${isDark ? 'text-zinc-400' : 'text-charcoal/70'}`}>
            <MapPin size={16} className="text-akai" />
            <span>{location}</span>
          </div>

          {/* Attendees */}
          <div className={`flex items-center space-x-2 text-sm ${isDark ? 'text-zinc-400' : 'text-charcoal/70'}`}>
            <Users size={16} className="text-akai" />
            <span>{attendees.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} {t('eventCard.joined')}</span>
          </div>
        </div>

        {/* Divider */}
        <div className={`border-t my-4 ${isDark ? 'border-zinc-800' : 'border-cream'}`} />

        {/* Footer - Price and Button */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-charcoal/60'}`}>{t('eventCard.from')}</span>
            <span className="text-xl font-bold text-akai">
              {price.toLocaleString('vi-VN')}₫
            </span>
          </div>
          <ProtectedButton
            onClick={onClick}
            variant="primary"
            showLockIcon
            className="px-4 py-2 text-sm shadow-lg shadow-akai/50 hover:shadow-xl hover:shadow-akai/70"
            title="Click to book this ticket"
          >
            {t('eventCard.buyTicket')}
          </ProtectedButton>
        </div>
      </div>
    </motion.div>
  );
};
