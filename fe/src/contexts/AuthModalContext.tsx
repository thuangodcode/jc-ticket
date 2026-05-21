import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type AuthModalType = 'login' | 'register' | 'forgot-password' | 'verify-otp' | 'reset-password' | null;

interface AuthModalContextType {
  // Modal state
  isOpen: boolean;
  currentModal: AuthModalType;
  
  // Data passed between modals (e.g., email for OTP verification)
  modalData: {
    email?: string;
    password?: string; // Password passed from RegisterModal to VerifyOTPModal for auto-login
    flow?: 'registration' | 'password-reset'; // Track which flow we're in
    otp?: string; // OTP passed to VerifyOTPModal when email fails
  };
  
  // Modal control functions
  openModal: (type: AuthModalType, data?: { email?: string; password?: string; flow?: 'registration' | 'password-reset'; otp?: string }) => void;
  closeModal: () => void;
  switchModal: (type: AuthModalType, data?: { email?: string; password?: string; flow?: 'registration' | 'password-reset'; otp?: string }) => void;
  resetModals: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

/**
 * AuthModalProvider - Manages authentication modal state
 * Handles: open/close, modal type switching, data passing between modals
 */
export const AuthModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentModal, setCurrentModal] = useState<AuthModalType>(null);
  const [modalData, setModalData] = useState<{ email?: string; password?: string; flow?: 'registration' | 'password-reset'; otp?: string }>({});

  const openModal = (type: AuthModalType, data?: { email?: string; password?: string; flow?: 'registration' | 'password-reset'; otp?: string }) => {
    setCurrentModal(type);
    setModalData(data || {});
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setCurrentModal(null);
    setModalData({});
  };

  const switchModal = (type: AuthModalType, data?: { email?: string; password?: string; flow?: 'registration' | 'password-reset'; otp?: string }) => {
    // Smooth transition - no closing animation, just switch content
    setCurrentModal(type);
    if (data) {
      setModalData((prev) => ({ ...prev, ...data }));
    }
  };

  const resetModals = () => {
    closeModal();
  };

  const value: AuthModalContextType = {
    isOpen,
    currentModal,
    modalData,
    openModal,
    closeModal,
    switchModal,
    resetModals,
  };

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
};

/**
 * useAuthModal - Hook to access auth modal context
 */
export const useAuthModal = (): AuthModalContextType => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return context;
};

export default AuthModalContext;
