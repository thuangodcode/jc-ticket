/**
 * JC-Ticket Authentication Implementation Guide
 * 
 * This guide covers the new authentication system with Protected Components.
 * Built with React Context, TypeScript, and Framer Motion animations.
 */

// ============================================================================
// 1. SETUP & INTEGRATION
// ============================================================================

// The UserAuthProvider is already integrated in App.tsx:
// <ThemeProvider>
//   <UserAuthProvider>
//     <AuthModalProvider>
//       <AppContent />
//     </AuthModalProvider>
//   </UserAuthProvider>
// </ThemeProvider>

// ============================================================================
// 2. USING THE AUTH CONTEXT
// ============================================================================

// In any component, use the hook:
import { useUserAuth } from '@/contexts/UserAuthContext';

function MyComponent() {
  const { 
    user,              // Current logged-in user (null if not authenticated)
    isAuthenticated,   // Boolean flag
    isLoading,         // Loading state (true during login/logout/session restore)
    error,             // Error message if any
    login,             // Function: login(email, password) => Promise<void>
    logout,            // Function: logout() => Promise<void>
    resetError,        // Function: resetError() => void
  } = useUserAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated && user) {
    return (
      <div>
        <p>Welcome, {user.name}</p>
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
      </div>
    );
  }

  return <div>Please log in</div>;
}

// ============================================================================
// 3. USER DATA STRUCTURE
// ============================================================================

// User interface (from UserAuthContext.tsx):
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt: string;
}

// ============================================================================
// 4. PROTECTED BUTTON COMPONENT
// ============================================================================

// Use ProtectedButton for actions that require authentication:
// - Book Now buttons
// - Add to Wishlist buttons
// - Submit forms that need authentication

import { ProtectedButton, ProtectedButtonGroup } from '@/components';

function MyEventCard() {
  const handleBooking = () => {
    console.log('User is authenticated, proceed with booking');
    // Navigate to booking page or open booking modal
  };

  return (
    <div>
      {/* Single button */}
      <ProtectedButton
        onClick={handleBooking}
        variant="primary"
        showLockIcon={true}
        title="Click to book this event"
      >
        Book Now
      </ProtectedButton>

      {/* Button variants */}
      <ProtectedButton variant="primary">Primary</ProtectedButton>
      <ProtectedButton variant="secondary">Secondary</ProtectedButton>
      <ProtectedButton variant="outline">Outline</ProtectedButton>

      {/* Multiple buttons */}
      <ProtectedButtonGroup
        direction="horizontal"
        buttons={[
          { label: 'Book Now', onClick: handleBooking, variant: 'primary' },
          { label: 'Add to Wishlist', variant: 'secondary' },
        ]}
      />
    </div>
  );
}

// ProtectedButton Props:
// - children: ReactNode - Button text/content
// - onClick?: () => void - Handler when authenticated
// - variant?: 'primary' | 'secondary' | 'outline' - Button style
// - className?: string - Custom CSS classes
// - showLockIcon?: boolean - Show lock icon when not authenticated (default: true)
// - disabled?: boolean - Disable button
// - title?: string - Tooltip text

// Behavior:
// - When NOT authenticated: Button is disabled, shows lock icon, opens login modal on click
// - When authenticated: Button is enabled, color changes, click handler is called

// ============================================================================
// 5. REQUIRE AUTH COMPONENT
// ============================================================================

// Use RequireAuth to wrap content that needs authentication:

import { RequireAuth } from '@/components';

function MyBookingPage() {
  return (
    <RequireAuth showPrompt={true}>
      <div>
        <h1>Your Booking History</h1>
        {/* This content only shows if user is authenticated */}
      </div>
    </RequireAuth>
  );
}

// RequireAuth Props:
// - children: ReactNode - Content to show when authenticated
// - fallback?: ReactNode - Custom UI to show when not authenticated
// - showPrompt?: boolean - Show default "Please log in" message (default: true)

// ============================================================================
// 6. PROTECTED ROUTE COMPONENT
// ============================================================================

// Use ProtectedRoute for route-level protection:

import { ProtectedRoute } from '@/components';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/events" element={<EventList />} />
      <Route 
        path="/my-tickets" 
        element={
          <ProtectedRoute>
            <MyTicketsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/booking/:id" 
        element={
          <ProtectedRoute>
            <BookingPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

// ============================================================================
// 7. NAVBAR AUTO-UPDATES
// ============================================================================

// The Navbar automatically shows:
// - When NOT authenticated:
//   - "Login" button
//   - "Register" button
// 
// - When authenticated:
//   - User avatar circle with first letter of name
//   - User name (hidden on mobile)
//   - Dropdown menu with:
//     - User info (name + email)
//     - Profile link
//     - My Tickets link
//     - Logout button

// ============================================================================
// 8. LOGIN FLOW
// ============================================================================

// When user clicks Login:
// 1. LoginModal opens with email/password form
// 2. User enters credentials and clicks "Login"
// 3. LoginModal calls useUserAuth.login(email, password)
// 4. UserAuthContext makes API call to backend /api/auth/login
// 5. Backend sets httpOnly cookie with JWT token
// 6. If successful:
//    - User data is stored in context
//    - Modal closes automatically
//    - Navbar updates to show user menu
// 7. If fails:
//    - Error message shows in modal
//    - User can retry

// ============================================================================
// 9. LOGOUT FLOW
// ============================================================================

// When user clicks Logout in navbar dropdown:
// 1. Navbar calls handleLogout()
// 2. useUserAuth.logout() is called
// 3. UserAuthContext makes API call to backend /api/auth/logout
// 4. Backend clears the httpOnly cookie
// 5. User state is cleared in context
// 6. Navbar updates back to show Login/Register buttons
// 7. User is redirected to home page (optional)

// ============================================================================
// 10. SESSION PERSISTENCE
// ============================================================================

// When page is reloaded:
// 1. UserAuthProvider mounts
// 2. useEffect calls restoreSession()
// 3. restoreSession() calls /api/auth/me
// 4. Backend checks if valid JWT exists in httpOnly cookie
// 5. If valid:
//    - User data is returned
//    - Context state is updated
//    - User remains logged in
// 6. If invalid:
//    - 401 error is returned
//    - Context state remains empty
//    - User sees login prompt

// ============================================================================
// 11. ERROR HANDLING
// ============================================================================

// Authentication errors include:
// - Invalid email/password
// - Email not verified
// - Too many login attempts (rate limited)
// - Network errors
// - Server errors

// Use error state:
import { useUserAuth } from '@/contexts/UserAuthContext';

function LoginForm() {
  const { error, resetError } = useUserAuth();

  return (
    <div>
      {error && (
        <div className="error-message">
          {error}
          <button onClick={resetError}>Dismiss</button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 12. BEST PRACTICES
// ============================================================================

// 1. Always use ProtectedButton for booking/sensitive actions
// 2. Wrap protected pages/sections with RequireAuth or ProtectedRoute
// 3. Use the User object to display personalized content
// 4. Check isLoading before rendering to avoid flicker
// 5. Handle errors with user-friendly messages
// 6. Clear form data after successful login
// 7. Don't store sensitive data in localStorage (use httpOnly cookies)
// 8. Always handle logout errors gracefully
// 9. Use the theme context for styling consistency
// 10. Test with browser devtools: Application > Cookies to verify httpOnly cookie

// ============================================================================
// 13. BACKEND INTEGRATION CHECKLIST
// ============================================================================

// Ensure these endpoints exist and are protected:
// ✅ POST /api/auth/login - Login endpoint
// ✅ POST /api/auth/register - Register endpoint
// ✅ POST /api/auth/logout - Logout endpoint (clears cookie)
// ✅ GET /api/auth/me - Get current user (protected by middleware)
// ✅ POST /api/auth/forgot-password - Send OTP for password reset
// ✅ POST /api/auth/reset-password - Reset password
// ✅ POST /api/booking - Protected endpoint
// ✅ GET /api/booking - Get user's bookings (protected)
// 
// Middleware:
// ✅ protect() - Verifies JWT from httpOnly cookie
// ✅ rateLimiter - Rate limiting for auth endpoints

// ============================================================================
// 14. STYLING & DARK MODE
// ============================================================================

// All components support dark mode via useTheme():
const { isDark } = useTheme();

// Color palette:
// - Primary: akai (red) - #D32F2F
// - Secondary: sakura - #F5547C
// - Background (dark): charcoal/midnight
// - Background (light): cream
// - Text (dark): cream
// - Text (light): ink/charcoal
// - Accent: gold

// ============================================================================
// 15. FILE STRUCTURE
// ============================================================================

/*
fe/src/
├── contexts/
│   ├── UserAuthContext.tsx ✅ Global auth state
│   ├── AuthModalContext.tsx (existing)
│   └── ThemeContext.tsx (existing)
├── components/
│   ├── Navbar.tsx ✅ Updated with user menu
│   ├── RequireAuth.tsx ✅ Protected content wrapper
│   ├── ProtectedButton.tsx ✅ Protected button component
│   ├── EventCard.tsx ✅ Updated with ProtectedButton
│   ├── auth/
│   │   ├── LoginModal.tsx ✅ Updated with context integration
│   │   └── ...
│   └── index.ts ✅ Updated exports
├── services/
│   ├── authService.ts ✅ Updated with authService object
│   └── api.ts (existing)
└── App.tsx ✅ Updated with UserAuthProvider
*/

// ============================================================================
// 16. TESTING
// ============================================================================

// Test scenarios:
// 1. Fresh page load -> should show login button
// 2. Enter credentials -> login modal should close, navbar should update
// 3. Reload page -> user should still be logged in (session restore)
// 4. Click logout -> user should be logged out, navbar should show login button
// 5. Click "Book Now" when not logged in -> should open login modal
// 6. Click "Book Now" when logged in -> should trigger onClick handler
// 7. Switch dark/light mode -> should work with all components

// Browser DevTools checks:
// - Application > Cookies > Check for 'token' or auth cookie with httpOnly flag
// - Console > Should not show any auth-related errors
// - Network > POST /api/auth/login, GET /api/auth/me should include credentials

// ============================================================================
// 17. FUTURE ENHANCEMENTS
// ============================================================================

// - Add toast notifications for login/logout success
// - Add "Remember Me" checkbox in login form
// - Add multi-device login session management
// - Add login attempt tracking and security alerts
// - Add social login (Google, Facebook)
// - Add two-factor authentication
// - Add profile edit page with avatar upload
// - Add password change functionality
// - Add login history/activity page
// - Add account deletion with confirmation
