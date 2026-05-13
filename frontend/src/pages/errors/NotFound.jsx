/**
 * Error Pages
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRoleHomePage, normalizeRole } from '../../utils/permissions';

export const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-blue-400 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-2">Page Not Found</h2>
        <p className="text-slate-400 mb-8">The page you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          <ArrowLeft size={20} />
          Go Back
        </button>
      </div>
    </div>
  );
};

export const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const home = getRoleHomePage(normalizeRole(user?.role));
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-400 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-white mb-2">Unauthorized</h2>
        <p className="text-slate-400 mb-8">You don't have permission to access this resource.</p>
        <button
          onClick={() => navigate(isAuthenticated ? home : '/login')}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          <ArrowLeft size={20} />
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export const ServerError = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-400 mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-white mb-2">Server Error</h2>
        <p className="text-slate-400 mb-8">Something went wrong on the server.</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          <ArrowLeft size={20} />
          Go Back
        </button>
      </div>
    </div>
  );
};

export default NotFound;