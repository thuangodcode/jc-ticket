import type { FC, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useUserAuth } from '../contexts/useUserAuth';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useTheme } from '../contexts/ThemeContext';
import { AlertCircle } from 'lucide-react';

/**
 * RequireAuth Component
 * Wraps components that require authentication.
 * If user is not authenticated, shows a message and prompts login.
 */
interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
  showPrompt?: boolean; // Show "Please login" message
}

export const RequireAuth: FC<RequireAuthProps> = ({
  children,
  fallback,
  showPrompt = true,
}) => {
  const { isAuthenticated, isLoading } = useUserAuth();
  const { openModal } = useAuthModal();
  const { isDark } = useTheme();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">
          <div className="w-8 h-8 border-4 border-akai border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // User is authenticated - render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // User is not authenticated - show fallback or message
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback - show message with login button
  if (showPrompt) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg p-6 border ${
          isDark
            ? 'bg-midnight/50 border-midnight text-cream'
            : 'bg-cream/50 border-cream text-charcoal'
        }`}
      >
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-akai flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Authentication Required</h3>
            <p className="text-sm opacity-75 mb-4">
              Please log in to access this feature. It only takes a moment!
            </p>
            <motion.button
              onClick={() => openModal('login')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-akai text-white rounded-lg font-medium hover:bg-sakura-dark transition-colors"
            >
              Log In Now
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};

/**
 * ProtectedRoute Component
 * Higher-order component to protect routes.
 * If not authenticated, redirects to home or shows message.
 */
interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useUserAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="w-8 h-8 border-4 border-akai border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // User is authenticated - render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Not authenticated - redirect (in real app, use React Router)
  // For now, return nothing as this should be handled by React Router
  return null;
};

export default RequireAuth;
