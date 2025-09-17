import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { isAuthenticated, getCurrentUser, getStoredTokens, fetchShopData } from '../utils/auth.js';
import { Api_Base_Url } from '../config/api.js';

export default function Recharge() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cashin'); // 'cashin' | 'send'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [shopId, setShopId] = useState(null);

  const [cashInForm, setCashInForm] = useState({
    account: '',
    amount: '',
    trxId: '',
    method: 'mobile_banking',
  });

  const [sendForm, setSendForm] = useState({
    account: '',
    amount: '',
  });

  // Hold-to-confirm (Top Up) state
  const [showHold, setShowHold] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0-100
  const holdTimerRef = useRef(null);
  const holdStartRef = useRef(null);
  const holdActionRef = useRef(null); // callback to execute after successful hold
  const HOLD_DURATION = 3000; // ms to complete hold
  const PROGRESS_RADIUS = 54; // matches the SVG circle r
  const CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

  // Guard: Only shop owners can access
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }
    const user = getCurrentUser();
    if (!user || user.role !== 'shop_owner') {
      navigate('/');
    }
  }, [navigate]);

  // Load shop id for authenticated shop owner
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tokens = getStoredTokens();
        if (!tokens?.access) return;
        const shopRes = await fetchShopData(tokens.access);
        const id = shopRes?.id || shopRes?.shop?.id || shopRes?.data?.id;
        if (mounted && id) setShopId(id);
      } catch (e) {
        // non-fatal, will show error on submit if missing
        console.warn('Failed to load shop id', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const onCashInChange = (e) => {
    const { name, value } = e.target;
    setCashInForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSendChange = (e) => {
    const { name, value } = e.target;
    setSendForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitCashIn = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setError('');

    // basic validation
    if (!cashInForm.account || !cashInForm.amount) {
      setError('Please provide account number and amount.');
      return;
    }
    if (!cashInForm.trxId) {
      setError('Please provide transaction ID.');
      return;
    }
    // optional: enforce 11-digit phone
    const phoneOnly = cashInForm.account.replace(/\D/g, '');
    if (phoneOnly.length < 10) {
      setError('Please enter a valid receiver phone number.');
      return;
    }

    if (!shopId) {
      setError('Shop information not found. Please reload and try again.');
      return;
    }

    // format amount as string
    const amountStr = String(cashInForm.amount);

    setSubmitting(true);
    try {
      const tokens = getStoredTokens();
      const headers = {
        'Content-Type': 'application/json'
      };
      if (tokens && tokens.access) headers['Authorization'] = `Bearer ${tokens.access}`;

      // POST /api/balance-requests/ payload
      const body = {
        amount: amountStr,
        account_number: cashInForm.account,
        transaction_id: cashInForm.trxId,
        payment_description: cashInForm.trxName,
        payment_method: cashInForm.method, // expects 'mobile_banking' or 'bank_transfer'
        shop: shopId,
      };

      const res = await fetch(`${Api_Base_Url}/api/balance-requests/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {

        const msg = data?.detail || data?.message || JSON.stringify(data);
        console.log('Cashin error response:', msg);
        
        // Clean up error message - remove brackets and quotes
        let cleanMsg = msg;
        if (typeof msg === 'string') {
          // Remove array brackets and quotes: ["message"] -> message
          cleanMsg = msg.replace(/^\["?|"?\]$/g, '').replace(/^"|"$/g, '');
        }
        
        throw new Error(cleanMsg || 'Cashin failed');
      }

      // success
      toast.success('Cash In request submitted successfully');
      setCashInForm({ account: '', amount: '', trxId: '', trxName: '', method: 'mobile_banking' });
    } catch (err) {
      console.error('Cashin error', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // Core Top Up logic extracted so it can be called after hold completes
  const performTopUp = async () => {
    setError('');

    // basic validation
    if (!sendForm.account || !sendForm.amount) {
      setError('Please provide account number and amount.');
      return;
    }
    const phoneOnly = sendForm.account.replace(/\D/g, '');
    if (phoneOnly.length < 10) {
      setError('Please enter a valid receiver phone number.');
      return;
    }

    const amountStr = String(sendForm.amount);

    setSubmitting(true);
    try {
      const tokens = getStoredTokens();
      const headers = {
        'Content-Type': 'application/json'
      };
      if (tokens && tokens.access) headers['Authorization'] = `Bearer ${tokens.access}`;

      const body = {
        receiver_phone: sendForm.account,
        amount: amountStr
      };

      console.log('=== TOP UP REQUEST ===');
      console.log('URL:', `${Api_Base_Url}/api/cashin/`);
      console.log('Headers:', headers);
      console.log('Request Body:', body);

      const res = await fetch(`${Api_Base_Url}/api/cashin/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      console.log('=== TOP UP RESPONSE ===');
      console.log('Status:', res.status, res.statusText);
      console.log('Response Headers:', Object.fromEntries(res.headers.entries()));

      const data = await res.json();
      console.log('Response Data:', data);

      if (!res.ok) {
        const msg = data?.detail || data?.message || JSON.stringify(data);
        console.log('Top Up error response:', msg);
        
        // Clean up error message - remove brackets and quotes
        let cleanMsg = msg;
        if (typeof msg === 'string') {
          // Remove array brackets and quotes: ["message"] -> message
          cleanMsg = msg.replace(/^\["?|"?\]$/g, '').replace(/^"|"$/g, '');
        }
        
        throw new Error(cleanMsg || 'Top Up failed');
      }

      // success
      console.log('Top Up SUCCESS:', data);
      toast.success('Top Up submitted successfully');
      setSendForm({ account: '', amount: '' });
    } catch (err) {
      console.error('Top Up error', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // Open the hold-to-confirm overlay (validates basic inputs first)
  const openHoldOverlay = (mode, e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setError('');

    if (mode === 'cashin') {
      // validate Cash In form
      if (!cashInForm.account || !cashInForm.amount) {
        setError('Please provide account number and amount.');
        return;
      }
      const phoneOnly = cashInForm.account.replace(/\D/g, '');
      if (phoneOnly.length < 10) {
        setError('Please enter a valid receiver phone number.');
        return;
      }
      // set action to Cash In submit
      holdActionRef.current = () => submitCashIn();
    } else {
      // default: topup (send)
      if (!sendForm.account || !sendForm.amount) {
        setError('Please provide account number and amount.');
        return;
      }
      const phoneOnly = sendForm.account.replace(/\D/g, '');
      if (phoneOnly.length < 10) {
        setError('Please enter a valid receiver phone number.');
        return;
      }
      holdActionRef.current = () => performTopUp();
    }

    // Reset and show overlay
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
    setShowHold(true);
  };

  // Start/cancel hold events
  const startHold = () => {
    if (submitting) return;
    // For mobile haptics
    if (navigator && 'vibrate' in navigator) {
      try { navigator.vibrate(10); } catch { /* ignore */ }
    }
    holdStartRef.current = performance.now();
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdTimerRef.current = setInterval(() => {
      const now = performance.now();
      const elapsed = now - (holdStartRef.current || now);
      const p = Math.min(100, Math.round((elapsed / HOLD_DURATION) * 100));
      setHoldProgress(p);
      if (p >= 100) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
  setShowHold(false);
  try { if (navigator && 'vibrate' in navigator) navigator.vibrate(30); } catch { /* ignore */ }
        // Trigger action after successful hold (support async without await here)
        const action = holdActionRef.current;
        if (typeof action === 'function') {
          try {
            const maybePromise = action();
            if (maybePromise && typeof maybePromise.then === 'function') {
              maybePromise.catch(() => {});
            }
          } catch {
            // ignore
          }
        }
      }
    }, 30);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, []);

  const submitSend = (e) => {
    openHoldOverlay('topup', e);
  };

  return (
    <section className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-green-100 text-green-700 mb-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {/* banknote / cash icon */}
              <rect x="2.5" y="6" width="19" height="12" rx="2" fill="none" />
              <circle cx="12" cy="12" r="2.25" fill="none" />
              <path d="M7 9v6" />
              <path d="M17 9v6" />
            </svg>
          </div>


          
          
        </div>

        {/* Segmented control */}
        <div className="grid grid-cols-2 bg-gray-100 rounded-xl p-1 mb-4">
          <button
            className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'cashin' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('cashin')}
          >
            Cash In
          </button>
          <button
            className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'send' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('send')}
          >
            Top Up
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          {/* Error Message */}
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <div className="text-red-600 text-sm font-medium">{error}</div>
            </div>
          )}

          {activeTab === 'cashin' ? (
            <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
              {/* Account Number */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Transaction Account Number</label>
                <input
                  type="tel"
                  name="account"
                  value={cashInForm.account}
                  onChange={onCashInChange}
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  inputMode="numeric"
                  maxLength={20}
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={cashInForm.amount}
                  onChange={onCashInChange}
                  placeholder="৳ Amount"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  min="0"
                />
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Transaction ID</label>
                <input
                  type="text"
                  name="trxId"
                  value={cashInForm.trxId}
                  onChange={onCashInChange}
                  placeholder="Bkash/Nagad/Rocket TRX ID"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  maxLength={16}
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                <div className="relative">
                  <select
                    name="method"
                    value={cashInForm.method}
                    onChange={onCashInChange}
                    className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="mobile_banking">Mobile Banking (Bkash/Rocket/Nagad)</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Description</label>
                <input
                  type="text" 
                  name="trxName"
                  value={cashInForm.trxName}
                  onChange={onCashInChange}
                  placeholder="Mobile Banking or Bank Name "
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  maxLength={16}
                />
              </div>

              <button
                type="button"
                onClick={(e) => openHoldOverlay('cashin', e)}
                disabled={submitting}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:bg-green-400"
              >
                {submitting && (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                <span>Submit Cash In</span>
              </button>
            </form>
          ) : (
            <form onSubmit={submitSend} className="space-y-3">
              {/* Account Number */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
                <input
                  type="tel"
                  name="account"
                  value={sendForm.account}
                  onChange={onSendChange}
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  inputMode="numeric"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={sendForm.amount}
                  onChange={onSendChange}
                  placeholder="৳ Amount"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <button
                type="button"
                onClick={(e) => openHoldOverlay('topup', e)}
                disabled={submitting}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:bg-green-400"
              >
                {submitting && (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                <span>Top Up</span>
              </button>
            </form>
          )}
        </div>

        {/* Hold-to-confirm overlay */}
        {showHold && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
            <div className="w-full max-w-sm mx-4">
              <div className="bg-white rounded-2xl p-5 text-center relative shadow-xl">
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => { cancelHold(); setShowHold(false); }}
                  className="absolute right-3 top-3 p-2 rounded-full text-gray-500 hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                <h3 className="text-base font-semibold text-gray-900 mb-1">Hold to Confirm</h3>
                <p className="text-xs text-gray-500 mb-4">Press and hold the fingerprint to Top Up</p>

                <div
                  className="mx-auto relative w-40 h-40 select-none"
                  onMouseDown={startHold}
                  onMouseUp={cancelHold}
                  onMouseLeave={cancelHold}
                  onTouchStart={(e) => { e.preventDefault(); startHold(); }}
                  onTouchEnd={cancelHold}
                  onTouchCancel={cancelHold}
                >
                  <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" stroke="#E5E7EB" strokeWidth="10" fill="none" />
                    <circle
                      cx="60" cy="60" r="54"
                      stroke="#10B981" strokeWidth="10" fill="none" strokeLinecap="round"
                      style={{
                        strokeDasharray: CIRCUMFERENCE,
                        strokeDashoffset: CIRCUMFERENCE - (holdProgress / 100) * CIRCUMFERENCE,
                        transition: 'stroke-dashoffset 30ms linear'
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* fingerprint icon mimic */}
                    <svg className="w-16 h-16 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 11.5c2.5 0 3.5 2 3.5 4.5M8 11c1-1.5 2.5-2 4-2s3 .5 4 2M6.5 9.5c1.5-2 3.5-3 5.5-3s4 .8 5.5 3M5 8c2-3 4.5-4 7-4s5 1 7 4M9.5 13.5c.5 1 .5 2 .5 3M12 13c1 1.5 1 3 1 4.5" />
                    </svg>
                  </div>
                  <div className="absolute bottom-3 inset-x-0 text-[11px] text-gray-500">
                    {holdProgress < 100 ? `Hold ${Math.ceil((HOLD_DURATION * (1 - holdProgress / 100)) / 1000)}s` : 'Release'}
                  </div>
                </div>

                <div className="mt-4 text-[11px] text-gray-500">Keep holding until the circle completes</div>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <p className="mt-4 text-center text-[11px] text-gray-500">
          Make sure your transaction ID matches your payment method.
        </p>
      </div>
    </section>
  );
}
