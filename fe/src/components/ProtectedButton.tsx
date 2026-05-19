import type { FC, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useUserAuth } from '../contexts/useUserAuth';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useTheme } from '../contexts/ThemeContext';
import { Lock } from 'lucide-react';

/**
 * ProtectedButton Component
 * A button that triggers auth modal if user is not authenticated.
 * Displays locked state and helpful message when not authenticated.
 *
 * Use cases:
 * - "Book Now" buttons
 * - "Add to Wishlist" buttons
 * - "Book Ticket" buttons
 */
interface ProtectedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  showLockIcon?: boolean;
  disabled?: boolean;
  title?: string;
}

export const ProtectedButton: FC<ProtectedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  showLockIcon = true,
  disabled = false,
  title,
}) => {
  const { isAuthenticated } = useUserAuth();
  const { openModal } = useAuthModal();
  const { isDark } = useTheme();

  /**
   * Handle button click
   * If not authenticated, open login modal
   * If authenticated, call the provided onClick handler
   */
  const handleClick = () => {
    if (!isAuthenticated) {
      // Show login modal with message
      openModal('login');
      return;
    }

    // User is authenticated, call the handler
    if (onClick) {
      onClick();
    }
  };

  // Base styles
  const baseStyles =
    'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2';

  // Variant styles
  let variantStyles = '';
  if (variant === 'primary') {
    variantStyles = isAuthenticated
      ? 'bg-akai text-white hover:bg-sakura-dark shadow-md'
      : `${isDark ? 'bg-midnight/50 text-cream' : 'bg-cream/50 text-charcoal'} opacity-75`;
  } else if (variant === 'secondary') {
    variantStyles = isAuthenticated
      ? `${isDark ? 'bg-midnight text-cream hover:bg-ink' : 'bg-cream text-charcoal hover:bg-cream/70'}`
      : `${isDark ? 'bg-midnight/50 text-cream/50' : 'bg-cream/50 text-charcoal/50'} opacity-75`;
  } else if (variant === 'outline') {
    variantStyles = isAuthenticated
      ? `border-2 ${isDark ? 'border-cream text-cream hover:bg-cream/10' : 'border-charcoal text-charcoal hover:bg-charcoal/5'}`
      : `border-2 ${isDark ? 'border-cream/50 text-cream/50' : 'border-charcoal/50 text-charcoal/50'} opacity-75`;
  }

  // Combine all styles
  const buttonStyles = `${baseStyles} ${variantStyles} ${className}`;

  // Tooltip message
  const tooltipMessage = isAuthenticated
    ? title
    : 'Please log in to access this feature';

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || !isAuthenticated}
      whileHover={isAuthenticated ? { scale: 1.05 } : undefined}
      whileTap={isAuthenticated ? { scale: 0.95 } : undefined}
      className={buttonStyles}
      title={tooltipMessage}
    >
      {showLockIcon && !isAuthenticated && (
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.6, delay: 0 }}
        >
          <Lock size={16} />
        </motion.div>
      )}
      {children}
    </motion.button>
  );
};

/**
 * ProtectedButtonGroup Component
 * Multiple protected buttons with consistent styling
 */
interface ProtectedButtonGroupProps {
  buttons: Array<{
    label: ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  }>;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export const ProtectedButtonGroup: React.FC<ProtectedButtonGroupProps> = ({
  buttons,
  direction = 'horizontal',
  className = '',
}) => {
  const containerClass =
    direction === 'horizontal'
      ? 'flex items-center space-x-2'
      : 'flex flex-col space-y-2';

  return (
    <div className={`${containerClass} ${className}`}>
      {buttons.map((button, index) => (
        <ProtectedButton
          key={index}
          onClick={button.onClick}
          variant={button.variant || 'primary'}
        >
          {button.label}
        </ProtectedButton>
      ))}
    </div>
  );
};

export default ProtectedButton;
