import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import './index.css';

const RootWrapper = import.meta.env.DEV ? React.Fragment : React.StrictMode;

ReactDOM.createRoot(document.getElementById('root')).render(
  <RootWrapper>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#111827',
                color: '#e5e7eb',
                border: '1px solid #1f2937'
              },
              success: {
                iconTheme: {
                  primary: '#00ff88',
                  secondary: '#111827'
                }
              },
              error: {
                iconTheme: {
                  primary: '#ff3366',
                  secondary: '#111827'
                }
              }
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </RootWrapper>
);

