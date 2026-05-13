import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.requestPasswordReset({ email });
      // save temp email for verification flow
      sessionStorage.setItem('otpEmail', email);
      toast.success('OTP sent to your email');
      navigate('/verify-otp?mode=reset');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to send reset OTP');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cyber-dark flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-cyber-accent/10 rounded-full mb-4 border border-cyber-accent/30 shadow-[0_0_24px_rgba(0,255,136,0.12)] transition-transform group-hover:scale-105">
              <Activity className="w-8 h-8 text-cyber-accent" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-cyber-accent transition-colors">
              MongoDB Log Anomaly & Security Monitor
            </h1>
          </Link>
          <h2 className="mt-3 text-xl font-semibold text-white">Forgot Password</h2>
          <p className="text-gray-400 mt-2">Enter your email to receive a verification code.</p>
        </div>

        <div className="bg-cyber-card border border-cyber-border rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">Remembered? <Link to="/login" className="text-cyber-accent">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
