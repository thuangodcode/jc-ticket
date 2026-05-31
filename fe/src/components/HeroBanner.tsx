import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { SearchBar } from './SearchBar';

interface HeroBannerProps {
  onExploreClick?: () => void;
  onTicketClick?: () => void;
  onSearch?: (filters: { query: string; date: string; location: string }) => void;
}

/**
 * HeroBanner (Upgraded)
 * Japanese Modern Luxury: clean, balanced, animated with Framer Motion
 * Includes: heading, subtitle, CTAs, stats, embedded SearchBar, decorative Torii
 */
export const HeroBanner: React.FC<HeroBannerProps> = ({ onExploreClick, onTicketClick, onSearch }) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // animation variants (typed as any to avoid strict framer-motion variant type issues)
  const container: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };

  const fadeUp: any = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
  };

  const statVariant = (delay = 0): any => ({
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, delay } },
  });

  return (
    <section className={`relative pt-20 pb-12 lg:pb-20 overflow-hidden ${isDark ? 'bg-midnight' : 'bg-cream'}`}>
      {/* Background subtle gradient + decorative shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute inset-0 transition-colors ${isDark ? 'bg-gradient-to-br from-midnight via-ink to-charcoal/80' : 'bg-gradient-to-br from-cream via-white to-sakura/40'}`} />
        {/* floating torii - decorative */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0.6, y: 0 }}
          animate={{ y: [-6, 6, -6] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-6 bottom-6 w-48 opacity-60 lg:w-64"
        >
          {/* Simple Torii SVG */}
          <svg viewBox="0 0 64 64" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg" fill="none">
            <path d="M4 12h56" stroke="#DC143C" strokeWidth="3" strokeLinecap="round" />
            <path d="M10 20h44" stroke="#DC143C" strokeWidth="3" strokeLinecap="round" />
            <path d="M12 20v28" stroke="#DC143C" strokeWidth="3" strokeLinecap="round" />
            <path d="M52 20v28" stroke="#DC143C" strokeWidth="3" strokeLinecap="round" />
            <rect x="18" y="36" width="28" height="8" rx="1" fill="#DC143C" opacity="0.12" />
          </svg>
        </motion.div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left content */}
          <div className="lg:col-span-7">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-akai text-white/95">✦</span>
              <span className={`text-sm font-medium tracking-wide ${isDark ? 'text-cream/80' : 'text-ink/80'}`}>{t('hero.slogan')}</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className={`text-4xl sm:text-5xl lg:text-6xl font-elegant font-extrabold leading-tight ${isDark ? 'text-cream' : 'text-ink'}`}>
              {t('hero.slogan')}
            </motion.h1>

            <motion.p variants={fadeUp} className={`mt-4 max-w-2xl text-lg ${isDark ? 'text-cream/70' : 'text-charcoal/70'}`}>
              {t('hero.subtitle')}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-3">
              <button
                onClick={onExploreClick}
                className="inline-flex items-center gap-3 px-6 py-3 bg-akai text-white rounded-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 text-sm font-semibold"
              >
                {t('hero.cta')}
                <ArrowRight size={16} />
              </button>

              <button
                onClick={onTicketClick}
                className="inline-flex items-center gap-3 px-5 py-3 border rounded-lg text-sm font-medium transition-colors duration-200 bg-transparent hover:bg-akai/10"
              >
                {t('hero.cta2')}
              </button>
            </motion.div>

            {/* Stats */}
            <div className="mt-8">
              <div className="grid grid-cols-3 gap-4 max-w-md">
                <motion.div variants={statVariant(0)} className="text-center">
                  <div className="text-2xl font-bold text-akai">500+</div>
                  <div className={`text-sm mt-1 ${isDark ? 'text-cream/70' : 'text-charcoal/70'}`}>{t('hero.events')}</div>
                </motion.div>
                <motion.div variants={statVariant(0.08)} className="text-center">
                  <div className="text-2xl font-bold text-akai">100K+</div>
                  <div className={`text-sm mt-1 ${isDark ? 'text-cream/70' : 'text-charcoal/70'}`}>{t('hero.attendees')}</div>
                </motion.div>
                <motion.div variants={statVariant(0.16)} className="text-center">
                  <div className="text-2xl font-bold text-akai">4.8★</div>
                  <div className={`text-sm mt-1 ${isDark ? 'text-cream/70' : 'text-charcoal/70'}`}>{t('hero.uptime')}</div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Right visual column */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <motion.div variants={fadeUp} className="w-full max-w-md bg-gradient-to-br from-white/60 to-cream/30 backdrop-blur rounded-2xl p-4 shadow-xl border border-cream/40">
              {/* Decorative scene - subtle background image placeholder */}
              <div className="w-full h-56 rounded-xl overflow-hidden relative bg-[url('https://d1g90p0r985xbs.cloudfront.net/general/_1280x698_crop_center-center_45_line/Image_fx-4.jpg.webp')] bg-cover bg-center">
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              <div className="mt-4 text-sm text-charcoal/60">
                <p className={`${isDark ? 'text-cream/70' : 'text-charcoal/70'}`}>{t('JC.TICKET') || ''}</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Embedded Search Bar under hero (moved down slightly for better spacing) */}
        <div className="mt-16 lg:mt-20">
          <SearchBar onSearch={onSearch} />
        </div>
      </div>
    </section>
  );
};
