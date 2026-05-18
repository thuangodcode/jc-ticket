import { motion } from 'framer-motion';
import { Mail, Share2, ExternalLink, MapPin, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Footer Component - Bottom section with links, info, and social media
 * Includes company info, quick links, support, and social links
 */
export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerSections = [
    {
      titleKey: 'footer.company',
      links: [
        { labelKey: 'footer.about', href: '#' },
        { labelKey: 'footer.blog', href: '#' },
        { labelKey: 'footer.help', href: '#' },
        { labelKey: 'footer.careers', href: '#' },
      ],
    },
    {
      titleKey: 'footer.support',
      links: [
        { labelKey: 'footer.help', href: '#' },
        { labelKey: 'footer.faq', href: '#' },
        { labelKey: 'footer.contact', href: '#' },
        { labelKey: 'footer.privacy', href: '#' },
      ],
    },
    {
      titleKey: 'footer.legal',
      links: [
        { labelKey: 'footer.terms', href: '#' },
        { labelKey: 'footer.privacy', href: '#' },
        { labelKey: 'footer.cookies', href: '#' },
        { labelKey: 'footer.press', href: '#' },
      ],
    },
  ];

  const socialLinks = [
    { icon: Mail, label: 'Email', href: '#', emoji: '📧' },
    { icon: Share2, label: 'Social', href: '#', emoji: '🌐' },
    { icon: ExternalLink, label: 'Website', href: '#', emoji: '🔗' },
    { icon: MapPin, label: 'Location', href: '#', emoji: '📍' },
  ];

  return (
    <footer className={`transition-colors duration-300 ${isDark ? 'bg-ink text-cream' : 'bg-midnight text-cream'}`}>
      {/* Top scroll button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 w-12 h-12 bg-akai rounded-full flex items-center justify-center hover:bg-sakura-dark transition-colors z-40 shadow-lg"
      >
        <ArrowUp size={20} />
      </motion.button>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-akai rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg font-elegant">✦</span>
              </div>
              <span className="text-xl font-bold font-elegant">JC-Ticket</span>
            </div>
            <p className={`mb-6 leading-relaxed ${isDark ? 'text-cream/70' : 'text-white/70'}`}>
              {t('footer.brandDescription')}
            </p>
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    whileHover={{ scale: 1.2, color: '#DC143C' }}
                    className={`transition-colors ${isDark ? 'text-cream hover:text-akai' : 'text-white hover:text-akai'}`}
                    title={social.label}
                  >
                    <Icon size={20} />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Footer sections */}
          {footerSections.map((section, idx) => (
            <motion.div
              key={section.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: (idx + 1) * 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className={`font-bold mb-4 text-sm uppercase tracking-wide ${isDark ? 'text-cream' : 'text-white'}`}>
                {t(section.titleKey)}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.labelKey}>
                    <a
                      href={link.href}
                      className={`transition-colors text-sm ${isDark ? 'text-cream/70 hover:text-akai' : 'text-white/70 hover:text-akai'}`}
                    >
                      {t(link.labelKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className={`border-t mb-8 ${isDark ? 'border-white/10' : 'border-white/10'}`} />

        {/* Bottom section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
          {/* Copyright */}
          <p className={`text-sm ${isDark ? 'text-cream/60' : 'text-white/60'}`}>
            {t('footer.rights')}
          </p>

          {/* Payment methods / Certifications */}
          <div className="flex items-center space-x-4">
            <span className={`text-xs font-semibold uppercase ${isDark ? 'text-cream/60' : 'text-white/60'}`}>{t('footer.trustedBy')}</span>
            <div className="flex space-x-2">
              {['🏦', '💳', '🔒', '⭐'].map((emoji, idx) => (
                <span key={idx} className="text-xl opacity-70">
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div className={`border-t bg-black/50 backdrop-blur ${isDark ? 'border-white/10' : 'border-white/10'}`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs ${isDark ? 'text-cream/50' : 'text-white/50'}`}>
          {t('footer.madeWith')}
        </div>
      </div>
    </footer>
  );
};
