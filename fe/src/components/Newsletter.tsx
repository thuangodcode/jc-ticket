import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

interface NewsletterProps {
  onSubscribe?: (email: string) => void;
}

/**
 * Newsletter Section - Email subscription for event updates
 * Allows users to subscribe for latest event notifications
 */
export const Newsletter: React.FC<NewsletterProps> = ({ onSubscribe }) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (email) {
      onSubscribe?.(email);
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubscribe();
    }
  };

  return (
    <section
      id="contact"
      className={`scroll-mt-24 py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDark ? 'bg-gradient-to-b from-black via-gray-950 to-black' : 'bg-gradient-to-b from-white to-gray-50'}`}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className={`rounded-2xl p-8 md:p-12 text-center relative overflow-hidden transition-all duration-300 ${
            isDark
              ? 'bg-gradient-to-br from-zinc-900 to-gray-900 border border-zinc-800 shadow-xl'
              : 'bg-white border border-gray-200 shadow-md'
          }`}
        >
          {/* Background decoration */}
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl ${isDark ? 'bg-akai/10' : 'bg-akai/5'}`} />
          <div className={`absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl ${isDark ? 'bg-sakura/10' : 'bg-sakura/5'}`} />

          {/* Content */}
          <div className="relative z-10">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-br from-akai to-sakura rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-akai/50"
            >
              <Mail size={32} className="text-white" />
            </motion.div>

            {/* Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={`text-3xl md:text-4xl font-bold mb-3 font-elegant ${isDark ? 'text-white' : 'text-ink'}`}
            >
              {t('newsletter.title')}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`mb-8 text-lg ${isDark ? 'text-zinc-400' : 'text-charcoal/70'}`}
            >
              {t('newsletter.description')}
            </motion.p>

            {/* Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
              <div className="flex-1 relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-akai pointer-events-none"
                />
                <input
                  type="email"
                  placeholder={t('newsletter.placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className={`w-full pl-12 pr-4 py-4 rounded-lg border-2 focus:outline-none transition-colors font-medium ${
                    isDark 
                      ? 'bg-zinc-800 text-white border-zinc-700 focus:border-akai placeholder-zinc-500' 
                      : 'bg-white text-ink border-cream focus:border-akai placeholder-charcoal/50'
                  }`}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubscribe}
                disabled={!email}
                className="px-8 py-4 bg-akai text-white rounded-lg font-semibold hover:bg-sakura-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 whitespace-nowrap"
              >
                <span>{isSubscribed ? t('newsletter.subscribed') : t('newsletter.subscribe')}</span>
                <Send size={18} />
              </motion.button>
            </motion.div>

            {/* Confirmation message */}
            {isSubscribed && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-akai font-semibold mt-4"
              >
                {t('newsletter.success')}
              </motion.p>
            )}

            {/* Privacy note */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className={`text-xs mt-6 ${isDark ? 'text-zinc-500' : 'text-charcoal/50'}`}
            >
              {t('newsletter.privacy')}
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
