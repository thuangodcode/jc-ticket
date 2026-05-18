/**
 * AUTHENTICATION USAGE EXAMPLES
 * 
 * Real-world examples of how to use the new authentication system
 */

// ============================================================================
// EXAMPLE 1: Event Booking with ProtectedButton
// ============================================================================

import { ProtectedButton } from '@/components';
import { useUserAuth } from '@/contexts/useUserAuth';
import { useState } from 'react';

function EventDetailPage({ eventId }: { eventId: string }) {
  const { user, isAuthenticated } = useUserAuth();
  const [showBookingForm, setShowBookingForm] = useState(false);

  const handleBookClick = () => {
    console.log(`${user?.name} is booking event ${eventId}`);
    setShowBookingForm(true);
    // Navigate to booking page or open booking modal
  };

  return (
    <div className="event-detail">
      <h1>Concert Night 2024</h1>
      <p>Amazing concert event...</p>

      {isAuthenticated && showBookingForm && (
        <BookingForm eventId={eventId} />
      )}

      <ProtectedButton
        onClick={handleBookClick}
        variant="primary"
        showLockIcon={true}
        className="mt-6 px-6 py-3 text-lg"
      >
        🎫 Book Your Ticket Now
      </ProtectedButton>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Protected User Dashboard
// ============================================================================

import { RequireAuth } from '@/components';

function UserDashboard() {
  const { user } = useUserAuth();

  return (
    <RequireAuth
      showPrompt={true}
      fallback={
        <div className="p-8 text-center">
          <h2>Access Denied</h2>
          <p>You need to log in to view your dashboard</p>
        </div>
      }
    >
      <div className="dashboard">
        <h1>Welcome, {user?.name}!</h1>
        
        <section className="my-bookings">
          <h2>My Bookings</h2>
          {/* Your bookings list here */}
        </section>

        <section className="my-wishlist">
          <h2>My Wishlist</h2>
          {/* Your wishlist here */}
        </section>

        <section className="account-settings">
          <h2>Account Settings</h2>
          {/* Settings form here */}
        </section>
      </div>
    </RequireAuth>
  );
}

// ============================================================================
// EXAMPLE 3: Conditional UI Based on Auth State
// ============================================================================

function Homepage() {
  const { user, isAuthenticated, isLoading } = useUserAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      {/* Hero section - visible to all users */}
      <HeroBanner />

      {/* Featured events - visible to all users */}
      <FeaturedFestivals />

      {/* Personalized content - only for logged-in users */}
      {isAuthenticated && (
        <section className="personalized-section">
          <h2>Welcome back, {user?.name}! 👋</h2>
          <div className="recommended-for-you">
            {/* Show recommendations based on user's wishlist */}
          </div>
          <div className="continue-booking">
            {/* Show incomplete bookings to continue */}
          </div>
        </section>
      )}

      {/* Generic CTA for non-authenticated users */}
      {!isAuthenticated && (
        <section className="cta-section">
          <h2>Start Booking Today!</h2>
          <p>Create an account to access exclusive deals and save your favorites</p>
        </section>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Protected Route with React Router
// ============================================================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Homepage />} />
        <Route path="/events" element={<EventListPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-tickets"
          element={
            <ProtectedRoute>
              <MyTicketsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/booking/:eventId"
          element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

// ============================================================================
// EXAMPLE 5: Form Submission Requiring Auth
// ============================================================================

import { ProtectedButtonGroup } from '@/components';
import { useState } from 'react';

function ReviewForm({ eventId }: { eventId: string }) {
  const { user } = useUserAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmitReview = async () => {
    // Only called if user is authenticated
    const response = await fetch(`/api/events/${eventId}/reviews`, {
      method: 'POST',
      credentials: 'include', // Include cookies
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating,
        comment,
        userId: user?.id,
      }),
    });
    // Handle response...
  };

  const handleCancelReview = () => {
    setRating(5);
    setComment('');
  };

  return (
    <div className="review-form">
      <h3>Share Your Experience</h3>

      <div className="form-group">
        <label>Rating</label>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          <option value="1">⭐ 1 - Poor</option>
          <option value="2">⭐⭐ 2 - Fair</option>
          <option value="3">⭐⭐⭐ 3 - Good</option>
          <option value="4">⭐⭐⭐⭐ 4 - Very Good</option>
          <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent</option>
        </select>
      </div>

      <div className="form-group">
        <label>Your Review</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about this event..."
          rows={5}
        />
      </div>

      <ProtectedButtonGroup
        direction="horizontal"
        buttons={[
          {
            label: '✅ Submit Review',
            onClick: handleSubmitReview,
            variant: 'primary',
          },
          {
            label: '❌ Cancel',
            onClick: handleCancelReview,
            variant: 'secondary',
          },
        ]}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Wishlist with Protected Interactions
// ============================================================================

interface WishlistItemProps {
  eventId: string;
  title: string;
  image: string;
  isFavorite: boolean;
}

function WishlistItem({ eventId, title, image, isFavorite }: WishlistItemProps) {
  const { isAuthenticated } = useUserAuth();
  const [saved, setSaved] = useState(isFavorite);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) return; // Won't be called anyway with ProtectedButton

    const response = await fetch(`/api/wishlist/${eventId}`, {
      method: saved ? 'DELETE' : 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      setSaved(!saved);
    }
  };

  return (
    <div className="wishlist-item">
      <img src={image} alt={title} />
      <h3>{title}</h3>

      <div className="actions">
        {/* Add to Wishlist button - disabled when not authenticated */}
        <ProtectedButton
          onClick={handleToggleFavorite}
          variant={saved ? 'primary' : 'outline'}
          showLockIcon={!saved}
        >
          {saved ? '❤️ Saved' : '🤍 Save'}
        </ProtectedButton>

        {/* Book button - disabled when not authenticated */}
        <ProtectedButton
          onClick={() => {
            // Navigate to booking page
          }}
          variant="primary"
        >
          Book Now
        </ProtectedButton>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Error Handling in Auth Context
// ============================================================================

function LoginPageWithErrorHandling() {
  const { error, resetError } = useUserAuth();

  return (
    <div className="login-page">
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={resetError}>Dismiss</button>
        </div>
      )}

      <LoginForm />

      <div className="help-section">
        <h3>Need Help?</h3>
        <p>
          If you're having trouble logging in, please check:
          <ul>
            <li>Your email address is correct</li>
            <li>Your password is spelled correctly</li>
            <li>Your account has been verified via email</li>
            <li>You don't have too many failed login attempts (wait 15 minutes)</li>
          </ul>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: User Profile with Protected Updates
// ============================================================================

function EditProfileForm() {
  const { user, logout } = useUserAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
  });

  const handleSaveProfile = async () => {
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      // Update succeeded
      console.log('Profile updated');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      return;
    }

    const response = await fetch('/api/users/account', {
      method: 'DELETE',
      credentials: 'include',
    });

    if (response.ok) {
      // Account deleted, logout
      await logout();
      // Redirect to home
    }
  };

  return (
    <div className="profile-form">
      <h2>Edit Your Profile</h2>

      <div className="form-group">
        <label>Full Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Email (Not editable for security)</label>
        <input type="email" value={formData.email} disabled />
      </div>

      <ProtectedButtonGroup
        direction="vertical"
        buttons={[
          {
            label: '💾 Save Changes',
            onClick: handleSaveProfile,
            variant: 'primary',
          },
          {
            label: '🔐 Change Password',
            variant: 'secondary',
          },
          {
            label: '🗑️ Delete Account',
            onClick: handleDeleteAccount,
            variant: 'outline',
          },
        ]}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 9: Navigation with Auth Status
// ============================================================================

import { Link } from 'react-router-dom';

function MainNavigation() {
  const { isAuthenticated, user } = useUserAuth();

  return (
    <nav className="main-nav">
      <Link to="/">Home</Link>
      <Link to="/events">Browse Events</Link>

      {isAuthenticated ? (
        <>
          <Link to="/my-tickets">My Tickets ({user?.id})</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/profile">Profile</Link>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}

// ============================================================================
// EXAMPLE 10: Search Results with Booking Actions
// ============================================================================

interface SearchResult {
  id: string;
  title: string;
  date: string;
  price: number;
}

function SearchResults({ results }: { results: SearchResult[] }) {
  const { isAuthenticated } = useUserAuth();

  return (
    <div className="search-results">
      {results.length === 0 ? (
        <p>No events found</p>
      ) : (
        results.map((event) => (
          <div key={event.id} className="result-item">
            <div>
              <h3>{event.title}</h3>
              <p>{event.date}</p>
              <p className="price">${event.price}</p>
            </div>

            <div className="actions">
              <ProtectedButton
                onClick={() => {
                  // Open booking modal or navigate
                }}
                variant="primary"
              >
                Book Ticket
              </ProtectedButton>

              <ProtectedButton
                variant="outline"
              >
                Add to Wishlist
              </ProtectedButton>
            </div>
          </div>
        ))
      )}

      {!isAuthenticated && (
        <div className="login-prompt">
          <p>Sign in to save your favorites and complete bookings faster</p>
        </div>
      )}
    </div>
  );
}

export {
  EventDetailPage,
  UserDashboard,
  Homepage,
  AppRouter,
  ReviewForm,
  WishlistItem,
  LoginPageWithErrorHandling,
  EditProfileForm,
  MainNavigation,
  SearchResults,
};
