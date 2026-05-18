/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Japanese Modern Color Palette
        'akai': '#DC143C', // 赤 - Japanese Red
        'sakura': '#FFB7C5', // 桜 - Sakura Pink
        'sakura-dark': '#FF69B4', // Deep Sakura
        'cream': '#FFF8F0', // 象牙色 - Cream
        'midnight': '#0A0E27', // Deep Navy
        'charcoal': '#2D2D2D', // 炭 - Charcoal
        'gold': '#D4AF37', // Gold accent
        'light-gold': '#F0E68C', // Light Gold
        'ink': '#1A1A1A', // 墨 - Ink Black
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'elegant': ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in',
        'slide-up': 'slideUp 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(220, 20, 60, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(220, 20, 60, 0.6)' },
        },
      },
      spacing: {
        '128': '32rem',
      },
    },
  },
  plugins: [],
}
