/**
 * AuthContext - Manages authentication state
 * Handles user login, registration, token management
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '../services/api';
import { STORAGE_KEYS } from '../utils/constants';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth called outside AuthProvider - returning fallback context');
    return {
      user: null,
      token: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      login: async () => ({ success: false }),
      register: async () => ({ success: false }),
      logout: () => {},
      updateUser: () => {},
      updateProfile: async () => ({ success: false }),
      verifyOTP: async () => ({ success: false }),
      forgotPassword: async () => ({ success: false }),
      setUser: () => {}
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token') || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (savedToken) {
        try {
          const response = await authAPI.getMe();
          const userData = response.data.data || response.data;
          setToken(savedToken);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (err) {
          localStorage.removeItem('token');
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login({ email, password });
      const { user: userData, token: newToken } = response.data.data;

      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);

      localStorage.setItem('token', newToken);
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      if (err.response?.data?.requiresVerification) {
        try {
          sessionStorage.setItem('otpEmail', email);
        } catch (e) {}
        setError(message);
        return { success: false, requiresVerification: true, message };
      }
      setError(message);
      return { success: false, error: message, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.register(userData);
      const { user: newUser, token: newToken } = response.data.data;

      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);

      localStorage.setItem('token', newToken);
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));

      return { success: true, data: response.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setError(null);

    localStorage.removeItem('token');
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem('user');
    localStorage.removeItem(STORAGE_KEYS.USER);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
  }, []);

  const updateProfile = useCallback(async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      const userData = response.data.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  }, []);

  const verifyOTP = useCallback(async (email, otp) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.verifyOtp({ email, otp });
      const { user: newUser, token: newToken } = response.data.data;

      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);

      localStorage.setItem('token', newToken);
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));

      return { success: true, user: newUser };
    } catch (err) {
      const message = err.response?.data?.message || 'OTP verification failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      await authAPI.requestPasswordReset({ email });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Password reset request failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    updateProfile,
    verifyOTP,
    forgotPassword,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

