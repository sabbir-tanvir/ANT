import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api_Base_Url } from '../config/api.js';
import { 
  storeTokens, 
  getUserRole, 
  getUserId, 
  isAuthenticated, 
  getCurrentUser,
  storeShopData
} from '../utils/auth.js';

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

  // API Functions
  const loginUser = async (username, password) => {
    try {
      const requestBody = {
        username: username,
        password: password
      };
      
      console.log('Login Request:', requestBody);
      
      const response = await fetch('https://admin.ant2025.com/auth/jwt-login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      console.log('Login Response Status:', response.status);
      console.log('Login Response Data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || data.detail || 'Login failed');
      }
      
      return data;
    } catch (error) {
      console.error('Login Error:', error);
      throw new Error(error.message || 'Network error occurred');
    }
  };

  const registerUser = async (phone, password) => {
    try {
      const requestBody = {
        phone: phone,
        password: password
      };
      
      console.log('Registration Request:', requestBody);
      
      const response = await fetch(`${Api_Base_Url}/auth/registration/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      console.log('Registration Response Status:', response.status);
      console.log('Registration Response Data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      return data;
    } catch (error) {
      console.error('Registration Error:', error);
      throw new Error(error.message || 'Network error occurred');
    }
  };

  const verifyOTP = async (phone, otp) => {
    try {
      const requestBody = {
        mobile: phone,
        otp: otp
      };
      
      console.log('Verify OTP Request:', requestBody);
      
      const response = await fetch(`${Api_Base_Url}/auth/verify-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      console.log('Verify OTP Response Status:', response.status);
      console.log('Verify OTP Response Data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }
      
      return data;
    } catch (error) {
      console.error('Verify OTP Error:', error);
      throw new Error(error.message || 'Network error occurred');
    }
  };

  const resendOTPAPI = async (phone) => {
    try {
      const requestBody = {
        mobile: phone
      };
      
      console.log('Resend OTP Request:', requestBody);
      
      const response = await fetch(`${Api_Base_Url}/auth/resend-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      console.log('Resend OTP Response Status:', response.status);
      console.log('Resend OTP Response Data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }
      
      return data;
    } catch (error) {
      console.error('Resend OTP Error:', error);
      throw new Error(error.message || 'Network error occurred');
    }
  };

  const fetchShopData = async (accessToken) => {
    try {
      console.log('Fetching shop data with token:', accessToken);
      
      const response = await fetch('https://admin.ant2025.com/api/my-shop/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();
      
      console.log('Shop Data Response Status:', response.status);
      console.log('Shop Data Response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch shop data');
      }
      
      return data;
    } catch (error) {
      console.error('Fetch Shop Data Error:', error);
      throw new Error(error.message || 'Network error occurred');
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
      // Validate signup form
      if (!formData.phone || !formData.password) {
        setError('Please fill all required fields');
        return;
      }

      // Validate phone number format (Bangladesh format: 01XXXXXXXXX)
      const phoneRegex = /^01[3-9]\d{8}$/;
      if (!phoneRegex.test(formData.phone)) {
        setError('Please enter a valid phone number (01XXXXXXXXX)');
        return;
      }

      // Validate password length
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      
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
        setError(error.message);
      } finally {
        setLoading(false);
      }
      
    } else if (activeTab === 'signup' && signupStep === 'otp') {
      // Validate and submit OTP
      if (!formData.otp || formData.otp.length !== 6) {
        setError('Please enter valid 6-digit OTP');
        return;
      }
      
      try {
        setLoading(true);
        console.log('Starting OTP verification with phone:', formData.phone, 'OTP:', formData.otp);
        const response = await verifyOTP(formData.phone, formData.otp);
        
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
      // Complete registration (with or without refer code)
      console.log('Completing registration with refer code:', formData.referCode || 'None');
      
      // Mock user data after successful registration
      const userData = {
        id: Date.now(),
        phone: formData.phone,
        name: 'User', // You can add name field to signup form if needed
        referCode: formData.referCode || null,
        isLoggedIn: true
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Dispatch custom event for navbar update
      window.dispatchEvent(new CustomEvent('userStatusChanged'));
      
      alert('Registration successful! You are now logged in.');
      
      // Redirect to home page after successful signup
      navigate('/');
      
      // Reset form
      setSignupStep('form');
      setActiveTab('login');
      setFormData({
        email: '',
        phone: '',
        referCode: '',
        password: '',
        confirmPassword: '',
        otp: ''
      });
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate login form
    if (!formData.phone || !formData.password) {
      setError('Please fill all required fields');
      return;
    }

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
      setError(error.message);
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
        
        const response = await resendOTPAPI(formData.phone);
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

                          {/* Confirm Password Field */}
                          {/* <div className="self-stretch px-4 md:px-6 py-3 bg-neutral-50 outline-1 outline-offset-[-1px] outline-stone-300 flex justify-between items-center overflow-hidden">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              placeholder="Confirm Password*"
                              className="w-full bg-transparent text-sm md:text-base font-semibold font-['Inter'] leading-normal placeholder:text-neutral-400 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="w-5 h-5 md:w-6 md:h-6 relative cursor-pointer flex-shrink-0 ml-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M21.544 11.045C21.848 11.4713 22 11.6845 22 12C22 12.3155 21.848 12.5287 21.544 12.955C20.1779 14.8706 16.6892 19 12 19C7.31078 19 3.8221 14.8706 2.45604 12.955C2.15201 12.5287 2 12.3155 2 12C2 11.6845 2.15201 11.4713 2.45604 11.045C3.8221 9.12944 7.31078 5 12 5C16.6892 5 20.1779 9.12944 21.544 11.045Z" stroke="#9A9A9A" strokeWidth="1.5" />
                                <path d="M15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12Z" stroke="#9A9A9A" strokeWidth="1.5" />
                              </svg>
                            </button>
                          </div> */}
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
                              onClick={() => {
                                // Skip refer code and complete registration
                                setFormData(prev => ({...prev, referCode: ''}));
                                handleSignupSubmit(new Event('submit'));
                              }}
                              className="text-sm text-gray-600 hover:text-gray-800 font-semibold underline"
                            >
                              Skip this step
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Password/OTP Section */}
                    {/* <div className="self-stretch flex flex-col sm:flex-row justify-start items-center gap-4">
                      <div className="w-full sm:flex-1 rounded flex justify-start items-center overflow-hidden">
                        <button
                          onClick={() => setAuthMethod('password')}
                          className={`flex-1 px-4 md:px-6 py-3 flex justify-center items-center gap-2.5 overflow-hidden ${authMethod === 'password' ? 'bg-green-600' : 'bg-zinc-100'
                            }`}
                        >
                          <div className={`justify-start text-sm md:text-base font-semibold font-['Inter'] leading-normal ${authMethod === 'password' ? 'text-white' : 'text-neutral-400'
                            }`}>
                            {activeTab === 'login' ? 'Password' : 'OTP'}
                          </div>
                        </button>
                        <button
                          onClick={() => setAuthMethod('otp')}
                          className={`flex-1 px-4 md:px-6 py-3 flex justify-center items-center gap-2.5 overflow-hidden ${authMethod === 'otp' ? 'bg-green-600' : 'bg-zinc-100'
                            }`}
                        >
                          <div className={`justify-start text-sm md:text-base font-semibold font-['Inter'] leading-normal ${authMethod === 'otp' ? 'text-white' : 'text-neutral-400'
                            }`}>
                            {activeTab === 'login' ? 'OTP' : 'Password'}
                          </div>
                        </button>
                      </div>
                      <div className="w-full sm:flex-1 px-4 md:px-6 py-3 bg-neutral-50 outline-1 outline-offset-[-1px] outline-stone-300 flex justify-between items-center overflow-hidden">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={`${authMethod === 'password' ? 'Password' : 'OTP'}*`}
                          className="w-full bg-transparent text-sm md:text-base font-semibold font-['Inter'] leading-normal placeholder:text-neutral-400 focus:outline-none"
                        />
                        {authMethod === 'password' && (
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="w-5 h-5 md:w-6 md:h-6 relative cursor-pointer flex-shrink-0"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M21.544 11.045C21.848 11.4713 22 11.6845 22 12C22 12.3155 21.848 12.5287 21.544 12.955C20.1779 14.8706 16.6892 19 12 19C7.31078 19 3.8221 14.8706 2.45604 12.955C2.15201 12.5287 2 12.3155 2 12C2 11.6845 2.15201 11.4713 2.45604 11.045C3.8221 9.12944 7.31078 5 12 5C16.6892 5 20.1779 9.12944 21.544 11.045Z" stroke="#9A9A9A" stroke-width="1.5" />
                              <path d="M15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12Z" stroke="#9A9A9A" stroke-width="1.5" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div> */}


                  </div>
                  <div className="self-stretch text-right justify-start text-neutral-400 text-sm md:text-base font-semibold font-['Inter'] underline leading-normal cursor-pointer">
                    {activeTab === 'login' ? 'Forgot Your Password?' : ''}
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
                <span className="text-black text-xs font-normal font-['Inter'] underline cursor-pointer">Terms and Conditions</span>
              </div>
            )}
          </div>


        </div>
      </div>
    </section>
  );
}
