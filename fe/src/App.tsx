import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import './i18n/config';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthModalProvider } from './contexts/AuthModalContext';
import { UserAuthProvider } from './contexts/UserAuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { useUserAuth } from './contexts/useUserAuth';
const AuthModal = lazy(() => import('./components/AuthModal'));
const UserAIChat = lazy(() => import('./components/UserAIChat'));

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
const VerifyTicketPage = lazy(() => import('./pages/VerifyTicketPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Admin Pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminTickets = lazy(() => import('./pages/admin/AdminTickets'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'));
const AdminEventFormPage = lazy(() => import('./pages/admin/AdminEventFormPage'));
const AdminUserManagement = lazy(() => import('./pages/admin/AdminUserManagement'));
const AdminSystemStats = lazy(() => import('./pages/admin/AdminSystemStats'));
const AdminScanPage = lazy(() => import('./pages/admin/AdminScanPage'));
const AdminSupportPage = lazy(() => import('./pages/admin/AdminSupportPage'));
const AdminAISupport = lazy(() => import('./pages/admin/AdminAISupport'));

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
  const handleCategoryClick = (category: Category) => { navigate(`/events?category=${category.id}`); };
  const handleEventClick = (event: any) => { navigate(`/events/${event.id}`); };
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
      <Categories onCategoryClick={handleCategoryClick} onViewAllClick={() => navigate('/events')} />
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
  const { isLoading } = useUserAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-ink">
        <div className="w-12 h-12 border-4 border-akai border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
          <Route path="/verify-ticket/:ticketCode" element={<VerifyTicketPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/system-stats" replace />} />
            <Route path="users" element={<AdminUserManagement />} />
            <Route path="system-stats" element={<AdminSystemStats />} />
            <Route path="ai-support" element={<AdminAISupport />} />
            <Route path="support" element={<AdminSupportPage />} />
          </Route>

          {/* Event Admin Routes */}
          <Route path="/event-admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="events/create" element={<AdminEventFormPage />} />
            <Route path="events/edit/:id" element={<AdminEventFormPage />} />
            <Route path="ai-support" element={<AdminAISupport />} />
          </Route>

          {/* Staff Routes */}
          <Route path="/staff" element={<AdminLayout />}>
            <Route path="check-in" element={<AdminScanPage />} />
            <Route path="support" element={<AdminSupportPage />} />
          </Route>
        </Routes>
        <AuthModal />
        {/* User AI Chat Widget — only on non-admin/staff pages */}
        {!location.pathname.startsWith('/admin') && !location.pathname.startsWith('/staff') && !location.pathname.startsWith('/event-admin') && (
          <UserAIChat />
        )}
      </Suspense>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <UserAuthProvider>
        <SocketProvider>
          <AuthModalProvider>
            <AppContent />
          </AuthModalProvider>
        </SocketProvider>
      </UserAuthProvider>
    </ThemeProvider>
  );
}

export default App;