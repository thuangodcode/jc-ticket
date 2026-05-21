import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import './i18n/config';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { UserAuthProvider } from './contexts/UserAuthContext';
const AuthModal = lazy(() => import('./components/AuthModal'));

// Homepage Components
import {
  Navbar, HeroBanner, Categories, UpcomingEvents, FeaturedFestivals,
  WhyUs, Testimonials, Newsletter, Footer,
} from './components';

// Pages
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const PaymentResultPage = lazy(() => import('./pages/PaymentResultPage'));
const MyTicketsPage = lazy(() => import('./pages/MyTicketsPage'));
const TicketDetailPage = lazy(() => import('./pages/TicketDetailPage'));

// Admin Pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminTickets = lazy(() => import('./pages/admin/AdminTickets'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'));

// Types
interface SearchFilters { query: string; date: string; location: string; }
interface Category { id: string; name: string; icon: string; count: number; color: string; }

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      return;
    }

    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname, location.hash]);

  return null;
}

/**
 * Homepage Component
 */
function HomePage() {
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const handleSearch = (filters: SearchFilters) => { console.log('Search:', filters); };
  const handleCategoryClick = (category: Category) => { console.log('Category:', category); };
  const handleEventClick = () => { navigate('/events'); };
  const handleFestivalClick = () => { console.log('Festival selected'); };
  const handleSubscribe = (email: string) => { console.log('Subscribe:', email); };

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (!hash) return;

    const timer = window.setTimeout(() => {
      const element = document.getElementById(hash);
      if (element) {
        const yOffset = 88;
        const y = element.getBoundingClientRect().top + window.scrollY - yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.hash]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-ink text-cream' : 'bg-white text-ink'}`}>
      <Navbar onSearchClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })} />
      <HeroBanner onExploreClick={() => navigate('/events')} onTicketClick={() => window.scrollTo({ top: 3800, behavior: 'smooth' })} onSearch={handleSearch} />
      <Categories onCategoryClick={handleCategoryClick} />
      <UpcomingEvents onEventClick={handleEventClick} onViewAll={() => navigate('/events')} />
      <FeaturedFestivals onFestivalClick={handleFestivalClick} />
      <WhyUs />
      <Testimonials />
      <Newsletter onSubscribe={handleSubscribe} />
      <Footer />
    </div>
  );
}

/**
 * App Component with Router
 */
function AppContent() {
  return (
    <>
      <ScrollToTop />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-white text-ink">
            <div className="w-12 h-12 border-4 border-akai border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/checkout/:bookingId" element={<CheckoutPage />} />
          <Route path="/payment/result" element={<PaymentResultPage />} />
          <Route path="/my-tickets" element={<MyTicketsPage />} />
          <Route path="/my-tickets/:ticketCode" element={<TicketDetailPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="events" element={<AdminEvents />} />
          </Route>
        </Routes>
        <AuthModal />
      </Suspense>
    </>
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