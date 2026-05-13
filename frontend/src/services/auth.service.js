/**
 * Auth Service
 * Authentication related API calls
 */

import api from './api';

export const login = async (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const register = async (userData) => {
  return api.post('/auth/register', userData);
};

export const logout = async () => {
  return api.post('/auth/logout');
};

export const getMe = async () => {
  return api.get('/auth/me');
};

export const verifyOTP = async (email, otp) => {
  return api.post('/auth/verify-otp', { email, otp });
};

export const forgotPassword = async (email) => {
  return api.post('/auth/forgot-password', { email });
};

export const updateProfile = async (data) => {
  return api.put('/auth/profile', data);
};

export default {
  login,
  register,
  logout,
  getMe,
  verifyOTP,
  forgotPassword,
  updateProfile,
};
