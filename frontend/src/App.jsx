/**
 * Main App Component
 * Root component that integrates all providers and router
 */

import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'react-hot-toast';
import AppRouter from './app/router';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AppRouter />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid #334155'
              }
            }}
          />
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

