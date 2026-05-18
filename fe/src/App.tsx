import { useEffect, useState } from 'react';
import './i18n/config';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { UserAuthProvider } from './contexts/UserAuthContext';
import AuthModal from './components/AuthModal';

import {
  Navbar,
  HeroBanner,
  Categories,
  UpcomingEvents,
  FeaturedFestivals,
  WhyUs,
  Testimonials,
  Newsletter,
  Footer,
} from './components';
import api from './services/api';

// Type definitions
interface SearchFilters {
  query: string;
  date: string;
  location: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
}

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

interface Festival {
  id: string;
  name: string;
  image: string;
  description: string;
  date: string;
  highlight: string;
}

/**
 * App Component - Main Homepage for JC-Ticket
 */
function AppContent() {
  const { isDark } = useTheme();
  const [backendStatus, setBackendStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Connect to backend on mount
useEffect(() => {
  const checkBackend = async () => {
    try {
      const res = await api.get('/');
      setBackendStatus(res.data.message);
    } catch {
      setBackendStatus('Backend offline');
    } finally {
      setIsLoading(false);
    }
  };

  checkBackend();
}, []);

  const handleSearch = (filters: SearchFilters) => {
    console.log('Search filters:', filters);
  };

  const handleCategoryClick = (category: Category) => {
    console.log('Category clicked:', category);
  };

  const handleEventClick = (event: Event) => {
    console.log('Event clicked:', event);
  };

  const handleFestivalClick = (festival: Festival) => {
    console.log('Festival clicked:', festival);
  };

  const handleSubscribe = (email: string) => {
    console.log('Newsletter subscription:', email);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-ink text-cream' : 'bg-white text-ink'}`}>
      {/* Debug banner */}
      {!isLoading && backendStatus && (
        <div className="fixed top-20 right-4 z-30 bg-green-500/20 border border-green-500 text-green-700 px-4 py-2 rounded-lg text-xs font-semibold backdrop-blur">
          ✓ Backend: {backendStatus}
        </div>
      )}

      <Navbar onSearchClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })} />

      <HeroBanner
        onExploreClick={() => window.scrollTo({ top: 2800, behavior: 'smooth' })}
        onTicketClick={() => window.scrollTo({ top: 3800, behavior: 'smooth' })}
        onSearch={handleSearch}
      />

      <Categories onCategoryClick={handleCategoryClick} />
      <UpcomingEvents
        onEventClick={handleEventClick}
        onViewAll={() => console.log('View all events')}
      />
      <FeaturedFestivals onFestivalClick={handleFestivalClick} />
      <WhyUs />
      <Testimonials />
      <Newsletter onSubscribe={handleSubscribe} />
      <Footer />

      {/* Auth Modal - Luôn render ở root */}
      <AuthModal />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <UserAuthProvider>
        <AuthModalProvider>
          <AppContent />
        </AuthModalProvider>
      </UserAuthProvider>
    </ThemeProvider>
  );
}

export default App;