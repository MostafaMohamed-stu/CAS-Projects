import React, { createContext, useContext, useCallback } from 'react';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Note: This context now provides dynamic notification system
// No more hardcoded values

export const NotificationProvider = ({ children }) => {
  const showSuccess = useCallback((title, message, duration = 4000) => {
    const fullMessage = message ? `${title}: ${message}` : title;
    toast.success(fullMessage, {
      position: 'top-center',
      duration,
      style: {
        background: '#059669',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
        border: '1px solid #047857',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#059669',
      },
    });
  }, []);

  const showError = useCallback((title, message, duration = 5000) => {
    const fullMessage = message ? `${title}: ${message}` : title;
    toast.error(fullMessage, {
      position: 'top-center',
      duration,
      style: {
        background: '#DC2626',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
        border: '1px solid #B91C1C',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#DC2626',
      },
    });
  }, []);

  const showWarning = useCallback((title, message, duration = 4000) => {
    const fullMessage = message ? `${title}: ${message}` : title;
    toast(fullMessage, {
      position: 'top-center',
      duration,
      icon: '⚠️',
      style: {
        background: '#D97706',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
        border: '1px solid #B45309',
      },
    });
  }, []);

  const showInfo = useCallback((title, message, duration = 4000) => {
    const fullMessage = message ? `${title}: ${message}` : title;
    toast(fullMessage, {
      position: 'top-center',
      duration,
      icon: 'ℹ️',
      style: {
        background: '#2563EB',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
        border: '1px solid #1D4ED8',
      },
    });
  }, []);

  const showLoading = useCallback((title, message) => {
    const fullMessage = message ? `${title}: ${message}` : title;
    return toast.loading(fullMessage, {
      position: 'top-center',
      style: {
        background: '#475569',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(71, 85, 105, 0.25)',
        border: '1px solid #334155',
      },
    });
  }, []);

  const dismissLoading = useCallback((toastId) => {
    toast.dismiss(toastId);
  }, []);

  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismissLoading
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Note: This provider now manages dynamic notification state
// No more hardcoded values
