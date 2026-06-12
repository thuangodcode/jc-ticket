import React, { useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/authService';
import { UserAuthContext, type UserAuthContextType } from './useUserAuth';

/**
 * User data structure from backend
 */
export interface User {
  id: string;
  name: string;
  phone?: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin' | 'event_admin' | 'staff';
  managedEventIds: string[];
  isVerified: boolean;
  createdAt: string;
}

/**
 * UserAuthProvider Component
 * Wraps the entire app to provide authentication context
 */
export interface UserAuthProviderProps {
  children: ReactNode;
}

export const UserAuthProvider: React.FC<UserAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Restore session from httpOnly cookie on app mount
   * This checks if user has a valid session when page is reloaded
   */
  const restoreSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call /api/auth/me to get current user info from cookie
      // Backend will return 401 if no valid token
      const response = await authService.getCurrentUser();

      // Backend response structure: { success, data: { id, name, email, role, avatar? } }
      const userData: User = {
        id: response.data.id || '',
        name: response.data.name || '',
        phone: response.data.phone,
        email: response.data.email || '',
        avatar: response.data.avatar,
        role: response.data.role || 'user',
        managedEventIds: response.data.managedEventIds || [],
        isVerified: true,
        createdAt: new Date().toISOString(),
      };

      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      // No valid session found
      const errorMsg = err instanceof Error ? err.message : 'Failed to restore session';
      setUser(null);
      setIsAuthenticated(false);
      const responseStatus =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;

      if (responseStatus && responseStatus !== 401) {
        console.debug('Session restore failed', errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login handler
   */
  const login = async (email: string, password: string): Promise<User> => {
    try {
      console.log('🔄 Login attempt:', email);
      setIsLoading(true);
      setError(null);

      // Backend will set httpOnly cookie automatically
      const response = await authService.login(email, password);
      console.log('📡 API Response:', response);

      if (response.token) {
        localStorage.setItem('accessToken', response.token);
      }

      // Backend response structure: { success, message, data: { id, name, email, role } }
      const userData: User = {
        id: response.data.id || '',
        name: response.data.name || '',
        phone: response.data.phone,
        email: response.data.email || '',
        avatar: response.data.avatar,
        role: response.data.role || 'user',
        managedEventIds: response.data.managedEventIds || [],
        isVerified: true,
        createdAt: new Date().toISOString(),
      };

      console.log('✅ Login successful:', userData);
      setUser(userData);
      setIsAuthenticated(true);
      console.log('📝 State updated: user =', userData, ', isAuthenticated = true');
      return userData;
    } catch (err) {
      console.error('❌ Login error:', err);
      // Extract error message safely
      let errorMsg = 'Login failed';
      
      if (err instanceof Error) {
        if ('response' in err && typeof err.response === 'object' && err.response !== null) {
          const response = err.response as { data?: { message?: string } };
          errorMsg = response.data?.message || err.message;
        } else {
          errorMsg = err.message;
        }
      }
      
      setError(errorMsg);
      setUser(null);
      setIsAuthenticated(false);
      throw err;
    } finally {
      console.log('🏁 Setting isLoading = false');
      setIsLoading(false);
    }
  };

  /**
   * Auto-login handler (used for OTP flow after verification)
   * Same as login but used specifically for auto-login scenarios
   */
  const autoLogin = async (email: string, password: string): Promise<User> => {
    return login(email, password);
  };

  /**
   * Register handler
   */
  const register = async (name: string, phone: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Registration sends OTP, doesn't log user in yet
      await authService.register(name, phone, email, password);

      // Don't set user/authenticated yet - user needs to verify OTP first
      // This is handled by the registration flow
    } catch (err) {
      // Extract error message safely
      let errorMsg = 'Registration failed';
      
      if (err instanceof Error) {
        if ('response' in err && typeof err.response === 'object' && err.response !== null) {
          const response = err.response as { data?: { message?: string } };
          errorMsg = response.data?.message || err.message;
        } else {
          errorMsg = err.message;
        }
      }
      
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout handler
   */
  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call backend logout to clear httpOnly cookie
      await authService.logout();

      localStorage.removeItem('accessToken');
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      // Even if logout fails, clear local state
      localStorage.removeItem('accessToken');
      setUser(null);
      setIsAuthenticated(false);
      
      const errorMsg = err instanceof Error ? err.message : 'Logout error';
      console.error('Logout error:', errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset error state
   */
  const resetError = () => {
    setError(null);
  };

  /**
   * Update profile handler
   */
  const updateProfile = async (name: string, phone?: string, avatar?: string): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.updateProfile(name, phone, avatar);
      
      const userData: User = {
        id: response.data.id || '',
        name: response.data.name || '',
        phone: response.data.phone,
        email: response.data.email || '',
        avatar: response.data.avatar,
        role: response.data.role || 'user',
        isVerified: true,
        createdAt: new Date().toISOString(),
      };

      setUser(userData);
      return userData;
    } catch (err) {
      let errorMsg = 'Failed to update profile';
      if (err instanceof Error) {
        if ('response' in err && typeof err.response === 'object' && err.response !== null) {
          const response = err.response as { data?: { message?: string } };
          errorMsg = response.data?.message || err.message;
        } else {
          errorMsg = err.message;
        }
      }
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Change password handler
   */
  const changePassword = async (oldPassword?: string, newPassword?: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.changePassword(oldPassword, newPassword);
    } catch (err) {
      let errorMsg = 'Failed to change password';
      if (err instanceof Error) {
        if ('response' in err && typeof err.response === 'object' && err.response !== null) {
          const response = err.response as { data?: { message?: string } };
          errorMsg = response.data?.message || err.message;
        } else {
          errorMsg = err.message;
        }
      }
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Restore session when component mounts (app startup)
   * This runs once on app load to check for existing session
   */
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await authService.getCurrentUser();
        
        if (isMounted) {
          // Backend response structure: { success, data: { id, name, email, role, avatar? } }
          const userData: User = {
            id: response.data.id || '',
            name: response.data.name || '',
            phone: response.data.phone,
            email: response.data.email || '',
            avatar: response.data.avatar,
            role: response.data.role || 'user',
            managedEventIds: response.data.managedEventIds || [],
            isVerified: true,
            createdAt: new Date().toISOString(),
          };
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        if (isMounted) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to restore session';
          const responseStatus =
            typeof err === 'object' && err !== null && 'response' in err
              ? (err as { response?: { status?: number } }).response?.status
              : undefined;

          if (responseStatus && responseStatus !== 401) {
            console.debug('Session restore failed', errorMsg);
          }
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const value: UserAuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    autoLogin,
    register,
    logout,
    resetError,
    restoreSession,
    updateProfile,
    changePassword,
  };

  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>;
};
