import { Routes, Route } from 'react-router-dom';
import './i18n/config';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { UserAuthProvider } from './contexts/UserAuthContext';
import AuthModal from './components/AuthModal';

// Homepage Components
import {
  Navbar, HeroBanner, Categories, UpcomingEvents, FeaturedFestivals,
  WhyUs, Testimonials, Newsletter, Footer,
} from './components';

// Pages
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentResultPage from './pages/PaymentResultPage';
import MyTicketsPage from './pages/MyTicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminTickets from './pages/admin/AdminTickets';
import AdminEvents from './pages/admin/AdminEvents';

// Types
interface SearchFilters { query: string; date: string; location: string; }
interface Category { id: string; name: string; icon: string; count: number; color: string; }
interface Event { id: string; title: string; image: string; date: string; location: string; price: number; attendees: number; rating: number; category: string; }
interface Festival { id: string; name: string; image: string; description: string; date: string; highlight: string; }

/**
 * Homepage Component
 */
function HomePage() {
  const { isDark } = useTheme();
  const handleSearch = (filters: SearchFilters) => { console.log('Search:', filters); };
  const handleCategoryClick = (category: Category) => { console.log('Category:', category); };
  const handleEventClick = (_event: Event) => { window.location.href = `/events`; };
  const handleFestivalClick = (_festival: Festival) => { console.log('Festival selected'); };
  const handleSubscribe = (email: string) => { console.log('Subscribe:', email); };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-ink text-cream' : 'bg-white text-ink'}`}>
      <Navbar onSearchClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })} />
      <HeroBanner onExploreClick={() => window.location.href = '/events'} onTicketClick={() => window.scrollTo({ top: 3800, behavior: 'smooth' })} onSearch={handleSearch} />
      <Categories onCategoryClick={handleCategoryClick} />
      <UpcomingEvents onEventClick={handleEventClick} onViewAll={() => window.location.href = '/events'} />
      <FeaturedFestivals onFestivalClick={handleFestivalClick} />
      <WhyUs />
      <Testimonials />
      <Newsletter onSubscribe={handleSubscribe} />
      <Footer />
      <AuthModal />
    </div>
  );
}

/**
 * App Component with Router
 */
function AppContent() {
  return (
    <>
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