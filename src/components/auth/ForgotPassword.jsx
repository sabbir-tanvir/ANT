import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  requestPasswordReset, 
  verifyPasswordReset, 
  loginUser,
  storeTokens,
  getUserRole,
  getUserId,
  fetchShopData,
  storeShopData
} from '../../utils/auth';

export default function ForgotPassword({ onClose, onSuccess }) {
  const navigate = useNavigate();
  const [step, setStep] = useState('request'); // request | verify | reset
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [passwords, setPasswords] = useState({ new_password: '', confirm_password: '' });

  const onRequest = async (e) => {
    e.preventDefault();
    setError('');
    const phoneOnly = phone.replace(/\D/g, '');
    if (phoneOnly.length < 10) {
      setError('Enter a valid phone number');
      return;
    }
    try {
      setLoading(true);
      await requestPasswordReset(phone);
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length < 4) {
      setError('Enter the OTP');
      return;
    }
    setStep('reset');
  };

  const onReset = async (e) => {
    e.preventDefault();
    setError('');
    const { new_password, confirm_password } = passwords;
    if (!new_password || new_password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (new_password !== confirm_password) {
      setError('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      await verifyPasswordReset({ phone, otp, new_password, confirm_password });

      // Auto login with new password and apply same flow as Auth login
      const loginRes = await loginUser(phone, new_password);
      storeTokens({ access: loginRes.access, refresh: loginRes.refresh });
      const userId = getUserId(loginRes.access);
      const userRole = getUserRole(loginRes.access);
      const userData = {
        id: userId,
        phone,
        role: userRole,
        isLoggedIn: true,
        accessToken: loginRes.access,
        refreshToken: loginRes.refresh,
      };
      localStorage.setItem('user', JSON.stringify(userData));

      // If shop owner, fetch shop data (non-blocking failure)
      if (userRole === 'shop_owner') {
        try {
          const shopResponse = await fetchShopData(loginRes.access);
          if (shopResponse && shopResponse.shop) {
            storeShopData(shopResponse.shop);
          }
        } catch {
          // ignore fetch errors
        }
      }

      // Notify app and navigate
      window.dispatchEvent(new CustomEvent('userStatusChanged'));
      navigate(userRole === 'shop_owner' ? '/myshop' : '/');
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="w-full max-w-sm mx-4 bg-white rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-900">Forgot Password</h3>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100" aria-label="Close">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}

        {step === 'request' && (
          <form onSubmit={onRequest} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 017XXXXXXXX"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-green-600 text-white px-4 py-3 text-sm font-semibold hover:bg-green-700 disabled:bg-green-400">
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={onVerify} className="space-y-3">
            <div className="text-xs text-gray-600">We sent an OTP to <span className="font-semibold">{phone}</span></div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-center tracking-widest"
              />
            </div>
            <button type="submit" className="w-full rounded-xl bg-green-600 text-white px-4 py-3 text-sm font-semibold hover:bg-green-700">Continue</button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={onReset} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
              <input
                type="password"
                value={passwords.new_password}
                onChange={(e) => setPasswords(p => ({ ...p, new_password: e.target.value }))}
                placeholder="New password"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password</label>
              <input
                type="password"
                value={passwords.confirm_password}
                onChange={(e) => setPasswords(p => ({ ...p, confirm_password: e.target.value }))}
                placeholder="Confirm password"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-green-600 text-white px-4 py-3 text-sm font-semibold hover:bg-green-700 disabled:bg-green-400">
              {loading ? 'Saving…' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
