import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getRoleHomePage, normalizeRole } from '../utils/permissions';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        toast.success('Welcome back!');
        // Use setTimeout to ensure user state is updated before navigation
        setTimeout(() => {
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          const userRole = normalizeRole(userData.role || user?.role);
          navigate(getRoleHomePage(userRole));
        }, 100);
      } else if (result.requiresVerification) {
        // Redirect unverified users to OTP verification flow
        toast('Please verify your email address — check your inbox');
        try {
          sessionStorage.setItem('otpEmail', email);
        } catch (e) {}
        navigate('/verify-otp');
      } else {
        toast.error(result.message || result.error || 'Login failed');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-dark flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyber-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyber-info/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-cyber-accent/10 rounded-full mb-4 border border-cyber-accent/30 shadow-[0_0_24px_rgba(0,255,136,0.12)] transition-transform group-hover:scale-105">
              <Activity className="w-8 h-8 text-cyber-accent" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-cyber-accent transition-colors">
              MongoDB Log Anomaly & Security Monitor
            </h1>
          </Link>
          <p className="text-gray-400 mt-2">Sign in to access your dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-cyber-darker border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/forgot" className="text-cyber-accent hover:underline">Forgot password?</Link>
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-cyber-accent hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-cyber-card/50 border border-cyber-border rounded-lg">
          <p className="text-sm text-gray-400 text-center">
            Demo: Register a new account to get started
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

