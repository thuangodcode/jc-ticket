import { motion } from 'framer-motion';
import { Shield, Zap, Users, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

interface Reason {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
}

/**
 * Why JC-Ticket Section - Professional Dark Mode
 * Dark Mode: bg-black/zinc-900 cards with zinc-800 borders, text-white/zinc-400
 * Light Mode: Clean white background
 * Features: Smooth animations, high contrast, accent color emphasis
 */
export const WhyUs: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const reasons: Reason[] = [
    {
      id: '1',
      title: t('whyUs.safety'),
      description: t('whyUs.safetyDesc'),
      icon: <Shield className="w-8 h-8" />,
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/20 to-blue-600/10',
    },
    {
      id: '2',
      title: t('whyUs.speed'),
      description: t('whyUs.speedDesc'),
      icon: <Zap className="w-8 h-8" />,
      color: 'text-yellow-400',
      bgGradient: 'from-yellow-500/20 to-yellow-600/10',
    },
    {
      id: '3',
      title: t('whyUs.community'),
      description: t('whyUs.communityDesc'),
      icon: <Users className="w-8 h-8" />,
      color: 'text-pink-400',
      bgGradient: 'from-pink-500/20 to-pink-600/10',
    },
    {
      id: '4',
      title: t('whyUs.exclusive'),
      description: t('whyUs.exclusiveDesc'),
      icon: <Trophy className="w-8 h-8" />,
      color: 'text-purple-400',
      bgGradient: 'from-purple-500/20 to-purple-600/10',
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
    <section 
      id="about" 
      className={`py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-b from-black via-gray-950 to-black' 
          : 'bg-gradient-to-b from-white to-gray-50'
      }`}
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
            {t('whyUs.title')}
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${
            isDark 
              ? 'text-zinc-400' 
              : 'text-charcoal/70'
          }`}>
            {t('whyUs.subtitle')}
          </p>
        </motion.div>

        {/* Reasons Grid - Professional Dark Mode Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {reasons.map((reason) => (
            <motion.div
              key={reason.id}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`group rounded-2xl transition-all duration-300 overflow-hidden ${
                isDark
                  ? 'bg-gradient-to-br from-zinc-900 to-gray-900 border border-zinc-800 hover:border-zinc-700 shadow-xl hover:shadow-2xl hover:shadow-akai/20'
                  : 'bg-white border border-gray-200 shadow-md hover:shadow-xl'
              }`}
            >
              {/* Card Background Accent */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${reason.bgGradient} pointer-events-none`} />

              {/* Card Content */}
              <div className="relative z-10 p-8 h-full flex flex-col items-center text-center">
                {/* Icon Container */}
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className={`mb-6 p-4 rounded-full transition-all duration-300 ${
                    isDark
                      ? `bg-gradient-to-br ${reason.bgGradient} border border-zinc-700 group-hover:border-zinc-600`
                      : 'bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span className={reason.color}>
                    {reason.icon}
                  </span>
                </motion.div>

                {/* Title */}
                <h3 className={`text-xl font-bold mb-3 transition-colors duration-300 ${
                  isDark 
                    ? 'text-white group-hover:text-akai' 
                    : 'text-ink group-hover:text-akai'
                }`}>
                  {reason.title}
                </h3>

                {/* Description */}
                <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                  isDark 
                    ? 'text-zinc-400 group-hover:text-zinc-300' 
                    : 'text-charcoal/70'
                }`}>
                  {reason.description}
                </p>

                {/* Hover Indicator Line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  className="mt-6 h-1 w-12 rounded-full bg-akai"
                  style={{ originX: 0.5 }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className={`text-lg mb-8 ${
            isDark 
              ? 'text-zinc-400' 
              : 'text-charcoal/70'
          }`}>
            {t('whyUs.trustLine')}
          </p>
          <motion.button
            whileHover={{ 
              scale: 1.05, 
              boxShadow: isDark ? '0 20px 25px -5px rgba(220, 20, 60, 0.3)' : 'none'
            }}
            whileTap={{ scale: 0.95 }}
            className={`px-8 py-4 font-semibold rounded-lg transition-all duration-300 ${
              isDark
                ? 'bg-akai text-white hover:bg-red-700 shadow-lg shadow-akai/50'
                : 'bg-akai text-white hover:bg-red-700'
            }`}
          >
            {t('whyUs.cta')}
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};
