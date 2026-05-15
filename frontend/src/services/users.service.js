/**
 * Users Service
 * User management API calls (Admin only)
 */

import api from './api';

export const getUsers = async (params = {}) => {
  return api.get('/users', { params });
};

export const getUserById = async (id) => {
  return api.get(`/users/${id}`);
};

export const createUser = async (userData) => {
  return api.post('/users', userData);
};

export const updateUser = async (id, userData) => {
  return api.put(`/users/${id}`, userData);
};

export const deleteUser = async (id) => {
  return api.delete(`/users/${id}`);
};

export const disableUser = async (id) => {
  return api.put(`/users/${id}/disable`);
};

export const enableUser = async (id) => {
  return api.put(`/users/${id}/enable`);
};

export const changeUserRole = async (id, role) => {
  return api.put(`/users/${id}/role`, { role });
};

export const getAvailableRoles = async () => {
  return api.get('/users/meta/roles');
};

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  disableUser,
  enableUser,
  changeUserRole,
  getAvailableRoles,
};
