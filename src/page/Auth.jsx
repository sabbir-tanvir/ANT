import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  storeTokens,
  getUserRole,
  getUserId,
  isAuthenticated,
  getCurrentUser,
  storeShopData,
  loginUser,
  registerUser,
  verifySignupOTP,
  resendSignupOTP,
  fetchShopData,
  updateUserProfile,
} from '../utils/auth.js';
import ForgotPassword from '../components/auth/ForgotPassword.jsx';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Auth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [signupStep, setSignupStep] = useState('form'); // 'form', 'otp', or 'referCode'
  const [otpTimer, setOtpTimer] = useState(0);
  const [user, setUser] = useState(null); // Store user data after successful registration
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    referCode: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [showForgot, setShowForgot] = useState(false);

  // OTP Timer Effect
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(timer => timer - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Check for existing user on mount
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && isAuthenticated()) {
      setUser(currentUser);
    } else {
      // Clear invalid stored data
      localStorage.removeItem('user');
      localStorage.removeItem('authTokens');
    }
  }, []);

  // API functions moved to utils/auth.js

  // Complete signup after OTP by logging in and optionally applying referral/reference phone
  const completeSignupAfterOtp = async (referOverride = null) => {
    try {
      setLoading(true);
      console.log('Completing registration. Logging in and applying referral (if any).');

      // Log in with the same phone/password used for registration
      const loginResp = await loginUser(formData.phone, formData.password);

      // Store tokens
      storeTokens({ access: loginResp.access, refresh: loginResp.refresh });

      // Extract user info from token
      const userId = getUserId(loginResp.access);
      const userRole = getUserRole(loginResp.access);

      // Build user object
      const userData = {
        id: userId,
        phone: formData.phone,
        role: userRole,
        isLoggedIn: true,
        accessToken: loginResp.access,
        refreshToken: loginResp.refresh,
      };

      // Optionally apply referral/reference phone if provided
      const refer = referOverride !== null ? (referOverride || '').trim() : (formData.referCode || '').trim();
      if (refer) {
        try {
          await updateUserProfile({ reference_phone: refer }, loginResp.access);
          console.log('Referral/reference phone applied');
        } catch (refErr) {
          console.warn('Failed to set referral/reference phone:', refErr);
          // Don't block signup on referral failure
        }
      }

      // Store user
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      // If shop owner, fetch and store shop data
      if (userRole === 'shop_owner') {
        try {
          const shopResponse = await fetchShopData(loginResp.access);
          if (shopResponse && shopResponse.shop) {
            storeShopData(shopResponse.shop);
          }
        } catch (shopErr) {
          console.error('Failed to fetch shop data after signup:', shopErr);
        }
      }

      // Dispatch navbar update
      window.dispatchEvent(new CustomEvent('userStatusChanged'));

      // Reset form
      setFormData({
        email: '',
        phone: '',
        referCode: '',
        password: '',
        confirmPassword: '',
        otp: ''
      });

      // Navigate by role
      if (userRole === 'shop_owner') {
        navigate('/myshop');
      } else {
        navigate('/');
      }

    } catch (finishErr) {
      console.error('Signup completion error:', finishErr);
      setError(finishErr.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (activeTab === 'signup' && signupStep === 'form') {
      try {
        setLoading(true);
        console.log('Starting registration with phone:', formData.phone);
        const response = await registerUser(formData.phone, formData.password);
        
        console.log('Registration successful:', response);
        setSignupStep('otp');
        setOtpTimer(40);
        setError('');
        
      } catch (error) {
        console.error('Registration error:', error);
        console.log('Error details:', error);
        
        if (error.message.includes('not verified')) {
          // Account not verified, redirect to OTP verification step and resend OTP
          setSignupStep('otp');
          setOtpTimer(40);
          setError('');
          toast.info('Account not verified. Redirecting to OTP verification.', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
          });
          try {
            console.log('Resending OTP for phone:', formData.phone);
            await resendSignupOTP(formData.phone);
            console.log('OTP resent successfully');
          } catch (otpError) {
            console.error('Failed to resend OTP:', otpError);
          }
        } else if (error.message.toLowerCase().includes('phone') && error.message.toLowerCase().includes('exists')) {
          // User already exists, redirect to login page
          toast.info('User already exists. Redirecting to login page.', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
          });
          setActiveTab('login');
          setSignupStep('form');
          setError('');
        } else {
          setError(error.message);
          toast.error(error.message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
          });
        }
      } finally {
        setLoading(false);
      }
      
    } else if (activeTab === 'signup' && signupStep === 'otp') {
      try {
        setLoading(true);
        console.log('Starting OTP verification with phone:', formData.phone, 'OTP:', formData.otp);
  const response = await verifySignupOTP(formData.phone, formData.otp);
        
        console.log('OTP verified successfully:', response);
        
        // Move to refer code step
        setSignupStep('referCode');
        setError('');
        
      } catch (error) {
        console.error('OTP verification error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
      
    } else if (activeTab === 'signup' && signupStep === 'referCode') {
      // Use helper to finish signup; it will optionally PATCH reference_phone
      await completeSignupAfterOtp();
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      console.log('Starting login with phone:', formData.phone);
      
      // Call login API
      const response = await loginUser(formData.phone, formData.password);
      
      console.log('Login successful:', response);
      
      // Store tokens in localStorage
      storeTokens({
        access: response.access,
        refresh: response.refresh
      });
      
      // Extract user information from access token
      const userId = getUserId(response.access);
      const userRole = getUserRole(response.access);
      
      // Create user object
      const userData = {
        id: userId,
        phone: formData.phone,
        role: userRole,
        isLoggedIn: true,
        accessToken: response.access,
        refreshToken: response.refresh
      };
      
      // Store user data
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // If user is shop owner, fetch and store shop data
      if (userRole === 'shop_owner') {
        try {
          console.log('User is shop owner, fetching shop data...');
          const shopResponse = await fetchShopData(response.access);
          
          if (shopResponse && shopResponse.shop) {
            console.log('Shop data fetched successfully:', shopResponse.shop);
            storeShopData(shopResponse.shop);
          }
        } catch (shopError) {
          console.error('Failed to fetch shop data:', shopError);
          // Don't fail the login if shop data fetch fails
        }
      }
      
      // Dispatch custom event for navbar update
      window.dispatchEvent(new CustomEvent('userStatusChanged'));
      
      console.log('User logged in successfully:', userData);
      
      // Reset form
      setFormData({
        email: '',
        phone: '',
        referCode: '',
        password: '',
        confirmPassword: '',
        otp: ''
      });
      
      // Redirect based on user role
      if (userRole === 'shop_owner') {
        navigate('/myshop');
      } else {
        navigate('/');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      console.log('Error details:', error);
      if (error.message.includes('not verified')) {
        // Account not verified, redirect to OTP verification
        setActiveTab('signup');
        setSignupStep('otp');
        setOtpTimer(40); // Start OTP timer
        setError('');
        toast.info('Account not verified. Redirecting to OTP verification.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        // Automatically send OTP under the hood
        try {
          console.log('Resending OTP for phone:', formData.phone);
          await resendSignupOTP(formData.phone);
          console.log('OTP resent successfully');
        } catch (otpError) {
          console.error('Failed to resend OTP:', otpError);
        }
      } else {
        setError(error.message);
        toast.error(error.message, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpTimer === 0) {
      try {
        setLoading(true);
        setError('');
        console.log('Resending OTP for phone:', formData.phone);
        
  const response = await resendSignupOTP(formData.phone);
        console.log('OTP resent successfully:', response);
        
        setOtpTimer(40);
        setFormData(prev => ({ ...prev, otp: '' }));
        
      } catch (error) {
        console.error('Resend OTP error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBackToForm = () => {
    setSignupStep('form');
    setOtpTimer(0);
    setFormData(prev => ({ ...prev, otp: '' }));
  };

  // If user is logged in, redirect to appropriate home page
  useEffect(() => {
    if (user) {
      if (user.role === 'shop_owner') {
        navigate('/myshop');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  return (
    <section className="min-h-[80vh] flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col lg:flex-row lg:justify-center gap-8 lg:gap-16">
          {/* Left Side - Auth Form */}
          <div className="w-full lg:w-[578px] flex flex-col justify-start items-center gap-8 lg:gap-12">
            <div className="self-stretch flex flex-col justify-start items-start gap-8 lg:gap-11">
              <div className="self-stretch flex flex-col justify-start items-start gap-4 lg:gap-5">
                <div className="self-stretch flex flex-col justify-center items-end gap-3">
                  <div className="self-stretch flex flex-col justify-start items-start gap-5 lg:gap-7">
                    <div className="self-stretch flex flex-col justify-start items-start gap-4 lg:gap-6">
                      {/* Tab Navigation */}
                      <div className="self-stretch rounded inline-flex justify-start items-center overflow-hidden">
                        <button
                          onClick={() => {
                            setActiveTab('login');
                            setSignupStep('form');
                            setOtpTimer(0);
                            setError('');
                          }}
                          className={`flex-1 px-4 md:px-6 py-3 flex justify-center items-center gap-2.5 overflow-hidden ${activeTab === 'login' ? 'bg-green-600' : 'bg-zinc-100'
                            }`}
                          disabled={activeTab === 'signup' && signupStep === 'otp'}
                        >
                          <div className={`justify-start text-sm md:text-base font-semibold font-['Inter'] leading-normal ${activeTab === 'login' ? 'text-white' : 'text-neutral-400'
                            }`}>
                            Log in
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('signup');
                            setSignupStep('form');
                            setOtpTimer(0);
                            setError('');
                          }}
                          className={`flex-1 px-4 md:px-6 py-3 flex justify-center items-center gap-2.5 overflow-hidden ${activeTab === 'signup' ? 'bg-green-600' : 'bg-zinc-100'
                            }`}
                        >
                          <div className={`justify-start text-sm md:text-base font-semibold font-['Inter'] leading-normal ${activeTab === 'signup' ? 'text-white' : 'text-neutral-400'
                            }`}>
                            Sign Up
                          </div>
                        </button>
                      </div>

                      {/* Error Message */}
                      {error && (
                        <div className="self-stretch px-4 py-3 bg-red-50 border border-red-200 rounded">
                          <div className="text-red-600 text-sm font-medium">{error}</div>
                        </div>
                      )}

                      {/* Login Form */}
                      {activeTab === 'login' && (
                        <>
                          {/* Phone Number Field */}
                          <div className="self-stretch px-4 md:px-6 py-3 bg-neutral-50 outline-1 outline-offset-[-1px] outline-stone-300 inline-flex justify-start items-center gap-2.5 overflow-hidden">
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="Phone Number*"
                              className="w-full bg-transparent text-sm md:text-base font-semibold font-['Inter'] leading-normal placeholder:text-neutral-400 focus:outline-none"
                            />
                          </div>

                          {/* Password Field */}
                          <div className="self-stretch px-4 md:px-6 py-3 bg-neutral-50 outline-1 outline-offset-[-1px] outline-stone-300 flex justify-between items-center overflow-hidden">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              placeholder="Password*"
                              className="w-full bg-transparent text-sm md:text-base font-semibold font-['Inter'] leading-normal placeholder:text-neutral-400 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="w-5 h-5 md:w-6 md:h-6 relative cursor-pointer flex-shrink-0 ml-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M21.544 11.045C21.848 11.4713 22 11.6845 22 12C22 12.3155 21.848 12.5287 21.544 12.955C20.1779 14.8706 16.6892 19 12 19C7.31078 19 3.8221 14.8706 2.45604 12.955C2.15201 12.5287 2 12.3155 2 12C2 11.6845 2.15201 11.4713 2.45604 11.045C3.8221 9.12944 7.31078 5 12 5C16.6892 5 20.1779 9.12944 21.544 11.045Z" stroke="#9A9A9A" strokeWidth="1.5" />
                                <path d="M15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12Z" stroke="#9A9A9A" strokeWidth="1.5" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}

                      {/* Signup Form */}
                      {activeTab === 'signup' && signupStep === 'form' && (
                        <>
                          {/* Phone Number Field */}
                          <div className="self-stretch px-4 md:px-6 py-3 bg-neutral-50 outline-1 outline-offset-[-1px] outline-stone-300 inline-flex justify-start items-center gap-2.5 overflow-hidden">
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="Phone Number*"
                              className="w-full bg-transparent text-sm md:text-base font-semibold font-['Inter'] leading-normal placeholder:text-neutral-400 focus:outline-none"
                            />
                          </div>

                          {/* Password Field */}
                          <div className="self-stretch px-4 md:px-6 py-3 bg-neutral-50 outline-1 outline-offset-[-1px] outline-stone-300 flex justify-between items-center overflow-hidden">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              placeholder="Password*"
                              className="w-full bg-transparent text-sm md:text-base font-semibold font-['Inter'] leading-normal placeholder:text-neutral-400 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="w-5 h-5 md:w-6 md:h-6 relative cursor-pointer flex-shrink-0 ml-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M21.544 11.045C21.848 11.4713 22 11.6845 22 12C22 12.3155 21.848 12.5287 21.544 12.955C20.1779 14.8706 16.6892 19 12 19C7.31078 19 3.8221 14.8706 2.45604 12.955C2.15201 12.5287 2 12.3155 2 12C2 11.6845 2.15201 11.4713 2.45604 11.045C3.8221 9.12944 7.31078 5 12 5C16.6892 5 20.1779 9.12944 21.544 11.045Z" stroke="#9A9A9A" strokeWidth="1.5" />
                                <path d="M15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12Z" stroke="#9A9A9A" strokeWidth="1.5" />
                              </svg>
                            </button>
                          </div>

                        </>
                      )}

                      {/* OTP Verification Step */}
                      {activeTab === 'signup' && signupStep === 'otp' && (
                        <div className="self-stretch flex flex-col gap-4">
                          {/* Back Button */}
                          <button
                            onClick={handleBackToForm}
                            className="self-start flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="m15 18-6-6 6-6"/>
                            </svg>
                            Back to form
                          </button>

                          {/* OTP Info */}
                          <div className="text-center py-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Verify Your Phone</h3>
                            <p className="text-sm text-gray-600">
                              We've sent a 6-digit code to<br />
                              <span className="font-semibold">{formData.phone}</span>
                            </p>
                          </div>

                          {/* OTP Input */}
                          <div className="self-stretch px-4 md:px-6 py-3 bg-neutral-50 outline-1 outline-offset-[-1px] outline-stone-300 inline-flex justify-start items-center gap-2.5 overflow-hidden">
                            <input
                              type="text"
                              name="otp"
                              value={formData.otp}
                              onChange={handleInputChange}
                              placeholder="Enter 6-digit OTP*"
                              maxLength="6"
                              className="w-full bg-transparent text-sm md:text-base font-semibold font-['Inter'] leading-normal placeholder:text-neutral-400 focus:outline-none text-center tracking-wider"
                            />
                          </div>

                          {/* Resend OTP */}
                          <div className="text-center">
                            {otpTimer > 0 ? (
                              <p className="text-sm text-gray-600">
                                Resend OTP in <span className="font-semibold text-green-600">{otpTimer}s</span>
                              </p>
                            ) : (
                              <button
                                onClick={handleResendOTP}
                                disabled={loading}
                                className="text-sm text-green-600 hover:text-green-700 disabled:text-green-400 disabled:cursor-not-allowed font-semibold underline flex items-center justify-center gap-1"
                              >
                                {loading ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                    Sending...
                                  </>
                                ) : (
                                  'Resend OTP'
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Refer Code Step */}
                      {activeTab === 'signup' && signupStep === 'referCode' && (
                        <div className="self-stretch flex flex-col gap-4">
                          {/* Refer Code Info */}
                          <div className="text-center py-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Referral Code</h3>
                            <p className="text-sm text-gray-600">
                              Have a referral code? Enter it below to get bonus rewards!<br />
                              <span className="text-xs text-gray-500">(This step is optional)</span>
                            </p>
                          </div>

                          {/* Refer Code Input */}
                          <div className="self-stretch px-4 md:px-6 py-3 bg-neutral-50 outline-1 outline-offset-[-1px] outline-stone-300 inline-flex justify-start items-center gap-2.5 overflow-hidden">
                            <input
                              type="text"
                              name="referCode"
                              value={formData.referCode}
                              onChange={handleInputChange}
                              placeholder="Enter referral code (optional)"
                              className="w-full bg-transparent text-sm md:text-base font-semibold font-['Inter'] leading-normal placeholder:text-neutral-400 focus:outline-none"
                            />
                          </div>

                          {/* Skip Button */}
                          <div className="text-center">
                            <button
                              onClick={() => completeSignupAfterOtp('')}
                              className="text-sm text-gray-600 hover:text-gray-800 font-semibold underline"
                            >
                              Skip this step
                            </button>
                          </div>
                        </div>
                      )}
                    </div>


                  </div>
                  <div className="self-stretch text-right text-neutral-400 text-sm md:text-base font-semibold font-['Inter'] underline leading-normal cursor-pointer">
                    {activeTab === 'login' ? (
                      <button type="button" onClick={() => setShowForgot(true)} className="hover:text-gray-600">Forgot Your Password?</button>
                    ) : ''}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                onClick={activeTab === 'login' ? handleLoginSubmit : handleSignupSubmit}
                disabled={loading}
                className="self-stretch h-12 px-4 md:px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed inline-flex justify-center items-center gap-2.5 overflow-hidden transition-colors"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-white text-sm md:text-base font-semibold font-['Inter'] leading-normal">
                      Please wait...
                    </span>
                  </div>
                ) : (
                  <div className="justify-start text-white text-sm md:text-base font-semibold font-['Inter'] leading-normal">
                    {activeTab === 'login' 
                      ? 'Log in' 
                      : (signupStep === 'form' 
                          ? 'Get OTP' 
                          : (signupStep === 'otp' 
                              ? 'Verify & Continue' 
                              : 'Complete Registration'
                            )
                        )
                    }
                  </div>
                )}
              </button>
            </div>

            {/* Terms for Sign Up */}
            {activeTab === 'signup' && signupStep === 'form' && (
              <div className="justify-start text-center sm:text-left">
                <span className="text-stone-500 text-xs font-normal font-['Inter']">By continuing, you agree to Safe's </span>
                <Link to="/terms" target="" rel="noopener noreferrer">
                <span className="text-black text-xs font-normal font-['Inter'] underline cursor-pointer">Terms and Conditions</span>
                </Link>
              </div>
            )}
          </div>


        </div>
      </div>
      {showForgot && (
        <ForgotPassword onClose={() => setShowForgot(false)} onSuccess={() => setShowForgot(false)} />
      )}
    </section>
  );
}
