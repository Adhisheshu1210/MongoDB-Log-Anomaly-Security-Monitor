import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { ArrowRight } from 'lucide-react';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function VerifyOtp() {
  const query = useQuery();
  const mode = query.get('mode') || 'verify'; // 'verify' or 'reset'
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  const email = sessionStorage.getItem('otpEmail') || '';

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp({ email, code });
      // If server returns token, login
      if (res.data?.data?.token) {
        localStorage.setItem('token', res.data.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.data.user || {}));
        toast.success('Verified — welcome');
        navigate('/dashboard');
      } else {
        toast.success('Verified');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ email, code, password: newPassword });
      toast.success('Password has been reset — please sign in');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to reset password');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!email || email.trim() === '') {
      toast.error('Email address not found. Please try registering again.');
      return;
    }
    try {
      await authAPI.sendOtp({ email });
      toast.success('Verification code re-sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to resend code');
    }
  };

  return (
    <div className="min-h-screen bg-cyber-dark flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">{mode === 'reset' ? 'Reset Password' : 'Verify Account'}</h1>
          <p className="text-gray-400 mt-2">Enter the verification code sent to <span className="font-mono">{email || 'your email'}</span></p>
        </div>

        <div className="bg-cyber-card border border-cyber-border rounded-xl p-8">
          {mode === 'reset' ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Verification Code</label>
                <input value={code} onChange={(e) => setCode(e.target.value)} className="input" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input" required />
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
                <button type="button" onClick={handleResend} className="btn btn-outline">
                  Resend
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Verification Code</label>
                <input value={code} onChange={(e) => setCode(e.target.value)} className="input" required />
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                  {loading ? 'Verifying...' : 'Verify Account'}
                </button>
                <button type="button" onClick={handleResend} className="btn btn-outline">
                  Resend
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-400">Need help? <Link to="/login" className="text-cyber-accent">Contact support</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
