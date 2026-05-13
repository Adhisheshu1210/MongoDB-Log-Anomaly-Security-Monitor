/**
 * App Providers
 * Wraps the application with all necessary providers
 */

import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { NotificationProvider } from '../context/NotificationContext';
import Toast from '../components/notifications/Toast';

const AppProvidersContent = ({ children }) => {
  return (
    <ThemeProvider>
      <NotificationProvider>
        {children}
        <Toast />
      </NotificationProvider>
    </ThemeProvider>
  );
};

export const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <AppProvidersContent>
        {children}
      </AppProvidersContent>
    </AuthProvider>
  );
};

export default AppProviders;
