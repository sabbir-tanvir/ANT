import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('account');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      // Initialize form data with user data
      setFormData({
        firstName: userData.name?.split(' ')[0] || 'User',
        lastName: userData.name?.split(' ')[1] || '',
        email: userData.email || 'user@example.com',
        phone: userData.phone || ''
      });
    } else {
      // Redirect to auth if no user found
      navigate('/auth');
    }
  }, [navigate]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Dispatch event for navbar update
    window.dispatchEvent(new CustomEvent('userStatusChanged'));
    navigate('/');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // Update user data in localStorage
    const updatedUser = {
      ...user,
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      phone: formData.phone
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    // Dispatch event for navbar update
    window.dispatchEvent(new CustomEvent('userStatusChanged'));
    
    alert('Profile updated successfully!');
  };

  const sidebarItems = [
    { id: 'account', label: 'Account info', icon: '👤' },
    { id: 'orders', label: 'My order', icon: '📦' },
    { id: 'transactions', label: 'My transaction', icon: '💳' },
    { id: 'password', label: 'Change password', icon: '🔒' }
  ];

  if (!user) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center p-4 md:p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[80vh] py-8 px-4 md:px-6 bg-stone-100">
      <div className="max-w-[1360px] mx-auto">
        <div className="bg-stone-100 rounded-[10px] p-8 min-h-[863px] relative">
          
          {/* Sidebar */}
          <div className="w-64 h-[619px] absolute left-[30px] top-[96px] bg-neutral-50 rounded-[10px]">
            {/* Profile Image */}
            <div className="w-52 h-56 absolute left-[20px] top-[20px] rounded-[10px] overflow-hidden">
              <img 
                className="w-52 h-56 object-cover" 
                src="https://placehold.co/214x220" 
                alt="Profile" 
              />
            </div>
            
            {/* User Name */}
            <div className="absolute left-[20px] top-[265px] text-black text-xl font-bold font-['Inter'] leading-normal">
              {user.name || 'User'}
            </div>
            
            {/* User Email */}
            <div className="absolute left-[20px] top-[297px] text-stone-500 text-sm font-normal font-['Inter'] leading-7">
              {formData.email}
            </div>
            
            {/* Sidebar Menu Items */}
            {sidebarItems.map((item, index) => (
              <div 
                key={item.id}
                className={`w-52 h-12 absolute left-[20px] rounded-lg cursor-pointer transition-colors ${
                  activeSection === item.id ? 'bg-green-600' : 'bg-white'
                }`}
                style={{ top: `${355 + (index * 61)}px` }}
                onClick={() => setActiveSection(item.id)}
              >
                <div className={`absolute left-[15px] top-[15px] text-sm font-normal font-['Inter'] leading-tight ${
                  activeSection === item.id ? 'text-white' : 'text-black'
                }`}>
                  {item.label}
                </div>
                <div className={`w-3 h-3.5 absolute left-[187.25px] top-[18.50px] text-sm font-black ${
                  activeSection === item.id ? 'text-white' : 'text-black'
                }`}>
                  ›
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="ml-[362px] mt-[96px]">
            {activeSection === 'account' && (
              <>
                {/* Page Title */}
                <div className="text-black text-2xl font-bold font-['Inter'] capitalize leading-7 mb-12">
                  Account info
                </div>

                {/* First Name and Last Name Row */}
                <div className="flex gap-8 mb-8">
                  {/* First Name */}
                  <div className="flex-1">
                    <div className="mb-4">
                      <span className="text-black text-sm font-normal font-['Inter'] leading-tight">First Name </span>
                      <span className="text-red-600 text-sm font-normal font-['Inter'] leading-tight">*</span>
                    </div>
                    <div className="w-full h-11 bg-white rounded-md outline outline-1 outline-stone-300">
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full h-full px-3 bg-transparent text-neutral-800 text-sm font-normal font-['Inter'] leading-tight focus:outline-none rounded-md"
                        placeholder="First Name"
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="flex-1">
                    <div className="mb-4">
                      <span className="text-black text-sm font-normal font-['Inter'] leading-tight">Last Name </span>
                      <span className="text-red-600 text-sm font-normal font-['Inter'] leading-tight">*</span>
                    </div>
                    <div className="w-full h-11 bg-white rounded-md outline outline-1 outline-stone-300">
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full h-full px-3 bg-transparent text-neutral-800 text-sm font-normal font-['Inter'] leading-tight focus:outline-none rounded-md"
                        placeholder="Last Name"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Address */}
                <div className="mb-8">
                  <div className="mb-4">
                    <span className="text-black text-sm font-normal font-['Inter'] leading-tight">Email Address </span>
                    <span className="text-red-600 text-sm font-normal font-['Inter'] leading-tight">*</span>
                  </div>
                  <div className="w-full h-11 bg-white rounded-md outline outline-1 outline-stone-300">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full h-full px-3 bg-transparent text-neutral-800 text-sm font-normal font-['Inter'] leading-tight focus:outline-none rounded-md"
                      placeholder="Email Address"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="mb-12">
                  <div className="mb-4">
                    <span className="text-black text-sm font-normal font-['Inter'] leading-tight">Phone Number </span>
                    <span className="text-stone-500 text-sm font-normal font-['Inter'] leading-tight">(Optional)</span>
                  </div>
                  <div className="w-full h-11 bg-white rounded-md outline outline-1 outline-stone-300">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full h-full px-3 bg-transparent text-neutral-800 text-sm font-normal font-['Inter'] leading-tight focus:outline-none rounded-md"
                      placeholder="Phone Number"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="w-32 h-12 bg-green-600 rounded-[10px] cursor-pointer" onClick={handleSave}>
                  <div className="w-full h-full flex items-center justify-center text-white text-xs font-medium font-['Inter'] uppercase leading-none">
                    save
                  </div>
                </div>
              </>
            )}

            {activeSection === 'orders' && (
              <div className="text-black text-2xl font-bold font-['Inter'] capitalize leading-7">
                My Orders
                <p className="text-gray-600 text-base font-normal mt-4">Your order history will appear here.</p>
              </div>
            )}

            {activeSection === 'transactions' && (
              <div className="text-black text-2xl font-bold font-['Inter'] capitalize leading-7">
                My Transactions
                <p className="text-gray-600 text-base font-normal mt-4">Your transaction history will appear here.</p>
              </div>
            )}

            {activeSection === 'password' && (
              <div className="text-black text-2xl font-bold font-['Inter'] capitalize leading-7">
                Change Password
                <p className="text-gray-600 text-base font-normal mt-4">Update your account password here.</p>
              </div>
            )}
          </div>

          {/* Logout Button (positioned at bottom) */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
