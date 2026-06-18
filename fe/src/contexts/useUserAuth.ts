import { createContext, useContext } from 'react';
import type { User } from './UserAuthContext';

/**
 * Auth context value type
 */
export interface UserAuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<User>;
  autoLogin: (email: string, password: string) => Promise<User>; // For OTP flow
  register: (name: string, phone: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetError: () => void;
  updateProfile: (name: string, phone?: string, avatar?: string) => Promise<User>;
  changePassword: (oldPassword?: string, newPassword?: string) => Promise<void>;

  // Session recovery
  restoreSession: () => Promise<void>;
}

/**
 * Default context value
 */
const defaultContextValue: UserAuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: async () => ({} as User),
  autoLogin: async () => ({} as User),
  register: async () => {},
  logout: async () => {},
  resetError: () => {},
  updateProfile: async () => ({} as User),
  changePassword: async () => {},
  restoreSession: async () => {},
};

/**
 * Create UserAuth Context
 */
export const UserAuthContext = createContext<UserAuthContextType>(defaultContextValue);

/**
 * Hook to use UserAuth context
 * Must be called inside a component wrapped by UserAuthProvider
 *
 * @returns {UserAuthContextType} The UserAuth context value
 * @throws {Error} If used outside of UserAuthProvider
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useUserAuth();
 */
export const useUserAuth = (): UserAuthContextType => {
  const context = useContext(UserAuthContext);

  if (!context) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }

  return context;
};
