import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getCurrentUser, isAuthenticated, removeTokens } from '../utils/auth.js';
import { Api_Base_Url } from '../config/api.js';
import TradeTransaction from '../components/transaction/Tradetransaction.jsx';
import WalletTransaction from '../components/transaction/WalletTraansaction.jsx';
import CurrencyTransaction from '../components/transaction/CurrencyTransaction.jsx';
import Myorders from '../components/orders/Myorders';

export default function Profile() {
  const [user, setUser] = useState(null);           // Auth info (id, role, tokens)
  const [profile, setProfile] = useState(null);     // Fetched profile data from /auth/user/
  const [originalProfile, setOriginalProfile] = useState(null); // For diffing on save
  const [activeSection, setActiveSection] = useState('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '', // read-only
    reference_phone: '',
    division: '',
    district: '',
    upazila: ''
  });
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingUpazilas, setLoadingUpazilas] = useState(false);
  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedUpazilaId, setSelectedUpazilaId] = useState('');
  const locationPresetRef = React.useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = React.useRef(null);
  const navigate = useNavigate();
  // Change password state
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwShow1, setPwShow1] = useState(false);
  const [pwShow2, setPwShow2] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  // Transactions tab selection
  const [transactionTab, setTransactionTab] = useState('trade');

  // Fetch profile from backend
  const fetchProfile = useCallback(async (accessToken) => {
    try {
      setError('');
      const response = await axios.get(`${Api_Base_Url}/auth/user/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      setProfile(response.data);
      setOriginalProfile(response.data);
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        reference_phone: response.data.reference_phone || response.data.referred_by_phone || response.data.referred_by_name || '',
        division: response.data.division || '',
        district: response.data.district || '',
        upazila: response.data.upazila || ''
      });
      localStorage.setItem('userProfile', JSON.stringify(response.data));
      
      // Set location preset data
      locationPresetRef.current = {
        division: response.data.division || '',
        district: response.data.district || '',
        upazila: response.data.upazila || ''
      };
    } catch (err) {
      console.error('[Profile.jsx] Error fetching profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch divisions
  const fetchDivisions = useCallback(async () => {
    try {
      setLoadingDivisions(true);
      const res = await axios.get(`${Api_Base_Url}/api/locations/divisions/`);
      setDivisions(res.data || []);
    } catch (err) {
      console.error('[Profile.jsx] Failed to load divisions', err);
      toast.error('Failed to load divisions');
    } finally {
      setLoadingDivisions(false);
    }
  }, []);

  // Fetch upazilas for district id
  const fetchUpazilas = useCallback(async (districtId, preselectName) => {
    if (!districtId) { setUpazilas([]); setSelectedUpazilaId(''); return; }
    try {
      setLoadingUpazilas(true);
      const res = await axios.get(`${Api_Base_Url}/api/locations/districts/${districtId}/upazilas/`);
      setUpazilas(res.data || []);
      if (preselectName) {
        const match = (res.data || []).find(u => u.name === preselectName);
        if (match) {
          setSelectedUpazilaId(match.id.toString());
          setFormData(prev => ({ ...prev, upazila: match.name }));
        }
      }
    } catch (err) {
      console.error('[Profile.jsx] Failed to load upazilas', err);
      toast.error('Failed to load upazilas');
    } finally {
      setLoadingUpazilas(false);
    }
  }, []);

  // Fetch districts for division id
  const fetchDistricts = useCallback(async (divisionId, preselectName) => {
    if (!divisionId) { setDistricts([]); setSelectedDistrictId(''); return; }
    try {
      setLoadingDistricts(true);
      const res = await axios.get(`${Api_Base_Url}/api/locations/divisions/${divisionId}/districts/`);
      setDistricts(res.data || []);
      if (preselectName) {
        const match = (res.data || []).find(d => d.name === preselectName);
        if (match) {
          setSelectedDistrictId(match.id.toString());
          setFormData(prev => ({ ...prev, district: match.name }));
          // Also fetch upazilas and preset if we have upazila data
          if (locationPresetRef.current && locationPresetRef.current.upazila) {
            fetchUpazilas(match.id.toString(), locationPresetRef.current.upazila);
          }
        }
      }
    } catch (err) {
      console.error('[Profile.jsx] Failed to load districts', err);
      toast.error('Failed to load districts');
    } finally {
      setLoadingDistricts(false);
    }
  }, [fetchUpazilas]);
  useEffect(() => {
    fetchDivisions();
  }, [fetchDivisions]);

  // Preset location dropdowns after divisions are loaded and profile data is available
  useEffect(() => {
    if (divisions.length > 0 && locationPresetRef.current) {
      const locationData = locationPresetRef.current;
      
      // Find and set division
      if (locationData.division) {
        const divisionMatch = divisions.find(d => d.name === locationData.division);
        if (divisionMatch) {
          setSelectedDivisionId(divisionMatch.id.toString());
          // Fetch districts for this division and preset district
          fetchDistricts(divisionMatch.id.toString(), locationData.district);
        }
      }
      
      // Clear the preset data after use
      locationPresetRef.current = null;
    }
  }, [divisions, fetchDistricts]);

  // When division changes manually by user
  useEffect(() => {
    if (selectedDivisionId) {
      const divObj = divisions.find(d => d.id.toString() === selectedDivisionId);
      setFormData(prev => ({ ...prev, division: divObj ? divObj.name : '' , district: '', upazila: ''}));
      setSelectedDistrictId('');
      setSelectedUpazilaId('');
      setDistricts([]);
      setUpazilas([]);
      fetchDistricts(selectedDivisionId);
    }
  }, [selectedDivisionId, divisions, fetchDistricts]);

  // When district changes manually by user
  useEffect(() => {
    if (selectedDistrictId) {
      const distObj = districts.find(d => d.id.toString() === selectedDistrictId);
      setFormData(prev => ({ ...prev, district: distObj ? distObj.name : '', upazila: '' }));
      setSelectedUpazilaId('');
      setUpazilas([]);
      fetchUpazilas(selectedDistrictId);
    }
  }, [selectedDistrictId, districts, fetchUpazilas]);

  // When upazila changes manually
  useEffect(() => {
    if (selectedUpazilaId) {
      const upObj = upazilas.find(u => u.id.toString() === selectedUpazilaId);
      setFormData(prev => ({ ...prev, upazila: upObj ? upObj.name : '' }));
    }
  }, [selectedUpazilaId, upazilas]);

  useEffect(() => {
    if (!isAuthenticated()) {
      removeTokens();
      navigate('/auth');
      return;
    }
    const authUser = getCurrentUser();
    if (!authUser) {
      removeTokens();
      navigate('/auth');
      return;
    }
    setUser(authUser);
    // Try cached profile first for quick paint
    const cached = localStorage.getItem('userProfile');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setProfile(parsed);
        setOriginalProfile(parsed);
        setFormData(prev => ({
          ...prev,
            name: parsed.name || '',
            email: parsed.email || '',
            phone: parsed.phone || '',
            reference_phone: parsed.reference_phone || parsed.referred_by_phone || '',
            division: parsed.division || '',
            district: parsed.district || '',
            upazila: parsed.upazila || ''
        }));
        // Set profile location data for preset after divisions are loaded
        locationPresetRef.current = {
          division: parsed.division || '',
          district: parsed.district || '',
          upazila: parsed.upazila || ''
        };
        setLoading(false); // show cached immediately
  } catch { /* ignore */ }
    }
    // Always fetch fresh
    fetchProfile(authUser.accessToken);
  }, [navigate, fetchProfile]);

  const handleLogout = () => {
    setUser(null);
    removeTokens();
    window.dispatchEvent(new CustomEvent('userStatusChanged'));
    navigate('/');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Prevent editing phone directly (read-only)
    if (name === 'phone') return;
    // Prevent editing reference_phone if already set originally
    if (name === 'reference_phone' && (originalProfile?.reference_phone || originalProfile?.referred_by_phone)) {
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    if (activeSection !== 'account') {
      // Safety guard: do not allow selecting outside Account info
      toast.info('You can change photo only in Account info.');
      // Reset input value so the same file can be re-selected later
      if (e.target) e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Determine changed fields (allowed patchable)
      const patchable = ['name', 'email', 'reference_phone', 'division', 'district', 'upazila'];
      const payload = {};
      patchable.forEach(field => {
        const originalVal = originalProfile?.[field] || '';
        const newVal = formData[field] || '';
        // Only include if changed and not empty OR changed from value to empty explicitly
        if (newVal !== originalVal) {
          // Enforce one-time reference_phone update
          if (field === 'reference_phone' && (originalProfile?.reference_phone || originalProfile?.referred_by_phone)) {
            return; // skip if already set
          }
          if (field === 'reference_phone' && newVal.trim() === '') return; // don't send empty refer code
          payload[field] = newVal;
        }
      });

      const hasImage = !!imageFile;
      if (Object.keys(payload).length === 0 && !hasImage) {
        toast.info('No changes to update');
        setSaving(false);
        return;
      }

      console.log('[Profile.jsx] Sending PATCH payload:', payload);

      let response;
      if (hasImage) {
        // Attempt multipart PATCH (backend may reject if user_img read-only)
        const form = new FormData();
        Object.entries(payload).forEach(([k,v]) => form.append(k, v));
        form.append('user_img', imageFile);
        setUploadingImage(true);
        try {
          response = await axios.patch(`${Api_Base_Url}/auth/user/`, form, {
            headers: {
              'Authorization': `Bearer ${user.accessToken}`,
              'Content-Type': 'multipart/form-data'
            }
          });
        } catch (imgErr) {
          console.warn('[Profile.jsx] Image upload failed, retrying without image', imgErr);
          toast.warning('Image not updated (read-only). Saving other changes.');
          // Fallback to json without image
          if (Object.keys(payload).length === 0) throw imgErr; // nothing else to save
          response = await axios.patch(`${Api_Base_Url}/auth/user/`, payload, {
            headers: {
              'Authorization': `Bearer ${user.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
        } finally {
          setUploadingImage(false);
        }
      } else {
        response = await axios.patch(`${Api_Base_Url}/auth/user/`, payload, {
          headers: {
            'Authorization': `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
      }

      console.log('[Profile.jsx] PATCH response:', response.data);
      toast.success('Profile updated successfully');
      
      // Update local state with response
      setProfile(response.data);
      setOriginalProfile(response.data);
      localStorage.setItem('userProfile', JSON.stringify(response.data));
      
      // Update formData to match response to ensure UI shows the saved values
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        reference_phone: response.data.reference_phone || response.data.referred_by_phone || '',
        division: response.data.division || '',
        district: response.data.district || '',
        upazila: response.data.upazila || ''
      });
      
      // Update location dropdown selections to match the saved data
      if (response.data.division && divisions.length > 0) {
        const divMatch = divisions.find(d => d.name === response.data.division);
        if (divMatch) {
          setSelectedDivisionId(divMatch.id.toString());
        }
      }
      if (response.data.district && districts.length > 0) {
        const distMatch = districts.find(d => d.name === response.data.district);
        if (distMatch) {
          setSelectedDistrictId(distMatch.id.toString());

        }
      }
      if (response.data.upazila && upazilas.length > 0) {
        const upMatch = upazilas.find(u => u.name === response.data.upazila);
        if (upMatch) {
          setSelectedUpazilaId(upMatch.id.toString());
        }
      }
      
      // Clear image selection
      setImageFile(null);
      setImagePreview(null);
      
      // Merge auth user display info if name/email changed
      if (payload.name || payload.email) {
        const updatedAuthUser = { ...user };
        if (payload.name) updatedAuthUser.name = payload.name;
        if (payload.email) updatedAuthUser.email = payload.email;
        setUser(updatedAuthUser);
        window.dispatchEvent(new CustomEvent('userStatusChanged'));
      }
    } catch (err) {
      console.error('[Profile.jsx] PATCH error:', err);
      let message = 'Update failed';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') message = err.response.data;
        else if (err.response.data.detail) message = err.response.data.detail;
        else message = Object.entries(err.response.data).map(([k,v]) => `${k}: ${Array.isArray(v)? v.join(', '): v}`).join('\n');
      }
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) { toast.error('Not authenticated'); return; }
    if (!pw1 || !pw2) { toast.error('Enter both password fields'); return; }
    if (pw1 !== pw2) { toast.error('Passwords do not match'); return; }
    setChangingPw(true);
    try {
      const res = await axios.post(`${Api_Base_Url}/auth/password/change/`, {
        new_password1: pw1,
        new_password2: pw2
      }, {
        headers: { 'Authorization': `Bearer ${user.accessToken}`, 'Content-Type': 'application/json' }
      });
      const msg = typeof res.data === 'string' ? res.data : (res.data?.detail || 'Password updated');
      toast.success(msg);
      setPw1('');
      setPw2('');
    } catch (err) {
      console.error('[Profile.jsx] Password change error:', err);
      let message = 'Failed to change password';
      const data = err.response?.data;
      if (data) {
        if (typeof data === 'string') message = data;
        else if (Array.isArray(data)) message = data.join(', ');
        else if (data.detail) message = data.detail;
        else message = Object.entries(data).map(([k,v]) => `${k}: ${Array.isArray(v)? v.join(', '): v}`).join('\n');
      }
      toast.error(message);
    } finally {
      setChangingPw(false);
    }
  };

  const sidebarItems = [
    { id: 'account', label: 'Account info', icon: '👤' },
    { id: 'transactions', label: 'My transaction', icon: '💳' },
    { id: 'password', label: 'Change password', icon: '🔒' }
  ];

  if (loading) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center p-4 md:p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </section>
    );
  }

  if (error && !profile) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center p-4 md:p-6">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => { if (user) fetchProfile(user.accessToken); }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >Retry</button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[80vh] py-4 md:py-8 px-4 md:px-6 bg-stone-100">
      <div className="max-w-[1360px] mx-auto">
        <div className="bg-stone-100 rounded-[10px] p-0 md:p-8">
          {/* Responsive container: stack on mobile, side-by-side on md+ */}
          <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-72 w-full md:min-h-[640px] bg-neutral-50 rounded-xl p-5 flex flex-col">

            <div className='flex flex-row md:flex-col md:items-center gap-4 md:gap-3 '>
            <div className="relative group mb-4">
              <div className="w-32 h-32 md:w-full md:h-auto aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200 mx-auto md:mx-0">
                <img
                  className="w-full h-full object-cover"
                  src={imagePreview || profile?.user_img || 'https://placehold.co/214x220'}
                  alt="Profile"
                  onError={(e) => { e.target.src = 'https://placehold.co/214x220'; }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (activeSection !== 'account') {
                      toast.info('You can change photo only in Account info.');
                      return;
                    }
                    fileInputRef.current?.click();
                  }}
                  className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm font-medium transition-opacity ${activeSection !== 'account' ? 'cursor-not-allowed' : ''}`}
                  disabled={uploadingImage || activeSection !== 'account'}
                >
                  {uploadingImage
                    ? 'Uploading...'
                    : (activeSection === 'account' ? 'Change Photo' : 'Go to Account info to change')}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>
              {imageFile && activeSection === 'account' && (
                <p className="text-xs text-green-600 mt-1 text-center">New image selected (will save on update)</p>
              )}
            </div>
            <div>
            <div className="mb-1 text-black text-lg font-bold leading-tight truncate text-center md:text-left">{profile?.name || 'User'}</div>
            <div className="text-stone-700 text-sm mb-1 text-center md:text-left">{user?.role ? user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Customer'}</div>
            <div className="text-stone-500 text-xs mb-4 text-center md:text-left">{profile?.phone || formData.phone}</div>

            </div>
            </div>

            <div className="flex flex-row md:flex-col gap-1 mt-2 flex-1 overflow-x-auto md:overflow-visible no-scrollbar">
              {sidebarItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`min-w-[90px] md:min-w-full text-left px-2 py-2 rounded-lg text-xs md:text-sm font-medium transition flex items-center justify-between md:justify-between ${activeSection === item.id ? 'bg-green-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                >
                  <span>{item.label}</span>
                  <span className="text-xs">›</span>
                </button>
              ))}
            </div>

          </div>

          {/* Main Content Area */}
          <div className="flex-1 md:mt-0 mt-2 md:pr-6">
            {activeSection === 'account' && (
              <>
                {/* Page Title */}
                <div className="flex items-start justify-between mb-10">
                  <div className="text-black text-2xl font-bold font-['Inter'] capitalize leading-7">Account info</div>
                  <div className="bg-white border border-green-100 shadow-sm rounded-xl px-5 py-3 flex flex-col items-start min-w-[170px] relative overflow-hidden">
                    <span className="text-xs uppercase tracking-wide text-gray-500 mb-1">Balance</span>
                    <div className="text-2xl font-bold text-green-600 flex items-center gap-1">৳{profile?.balance || '0.00'}</div>
                  </div>
                </div>

                {/* Name */}
                <div className="mb-8">
                  <div className="mb-4">
                    <span className="text-black text-sm font-normal font-['Inter'] leading-tight">Full Name </span>
                  </div>
                  <div className="w-full h-11 bg-white rounded-md border border-stone-300">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full h-full px-3 bg-transparent text-neutral-800 text-sm font-normal font-['Inter'] leading-tight focus:outline-none rounded-md"
                      placeholder="Your name"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="mb-8">
                  <div className="mb-1 flex items-center justify-between">
                    <div>
                      <span className="text-black text-sm font-normal font-['Inter'] leading-tight">Email Address </span>
                    </div>
                  </div>
                  <div className="w-full h-11 bg-white rounded-md border border-stone-300">
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

                {/* Phone (read-only) */}
                <div className="mb-8">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-black text-sm font-normal font-['Inter'] leading-tight">Phone Number</span>
                    <span className="text-xs text-neutral-500">You can't update this</span>
                  </div>
                  <div className="w-full h-11 bg-gray-50 rounded-md border border-stone-300">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      disabled
                      className="w-full h-full px-3 bg-transparent text-neutral-500 text-sm font-normal font-['Inter'] leading-tight focus:outline-none rounded-md cursor-not-allowed"
                      placeholder="Phone Number"
                    />
                  </div>
                </div>

                {/* Reference Code (one-time) - Only show for non-shop owners */}
                {user?.role !== 'shop_owner' && (
                  <div className="mb-8">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-black text-sm font-normal font-['Inter'] leading-tight">Reference Phone</span>
                      { (originalProfile?.reference_phone || originalProfile?.referred_by_phone) ? (
                        <span className="text-xs text-neutral-500">Set (locked)</span>
                      ) : (
                        <span className="text-xs text-neutral-500">Can be set only once</span>
                      ) }
                    </div>
                    <div className={`w-full h-11 rounded-md border ${ (originalProfile?.reference_phone || originalProfile?.referred_by_phone) ? 'bg-gray-50 border-stone-300' : 'bg-white border-stone-300' }`}>
                      <input
                        type="text"
                        name="reference_phone"
                        value={formData.reference_phone}
                        onChange={handleInputChange}
                        disabled={Boolean(originalProfile?.reference_phone || originalProfile?.referred_by_phone)}
                        className={`w-full h-full px-3 bg-transparent text-sm font-normal font-['Inter'] leading-tight focus:outline-none rounded-md ${(originalProfile?.reference_phone || originalProfile?.referred_by_phone) ? 'text-neutral-500 cursor-not-allowed' : 'text-neutral-800'}`}
                        placeholder="Enter referral phone"
                      />
                    </div>
                  </div>
                )}

                {/* Location Fields with dynamic selects */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  {/* Division */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-black text-sm font-normal">Division</label>
                    <select
                      value={selectedDivisionId}
                      onChange={(e) => setSelectedDivisionId(e.target.value)}
                      className="w-full h-11 px-3 bg-white rounded-md border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                    >
                      <option value="">Select Division</option>
                      {loadingDivisions && <option value="" disabled>Loading...</option>}
                      {divisions.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* District */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-black text-sm font-normal">District</label>
                    <select
                      value={selectedDistrictId}
                      onChange={(e) => setSelectedDistrictId(e.target.value)}
                      disabled={!selectedDivisionId || loadingDistricts}
                      className="w-full h-11 px-3 bg-white rounded-md border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                    >
                      <option value="">{loadingDistricts ? 'Loading...' : 'Select District'}</option>
                      {districts.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Upazila */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-black text-sm font-normal">Upazila</label>
                    <select
                      value={selectedUpazilaId}
                      onChange={(e) => setSelectedUpazilaId(e.target.value)}
                      disabled={!selectedDistrictId || loadingUpazilas}
                      className="w-full h-11 px-3 bg-white rounded-md border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                    >
                      <option value="">{loadingUpazilas ? 'Loading...' : 'Select Upazila'}</option>
                      {upazilas.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-4">
                  <button
                    disabled={saving}
                    onClick={handleSave}
                    className={`w-44 h-12 rounded-[10px] flex items-center justify-center text-white text-xs font-semibold font-['Inter'] uppercase leading-none transition ${saving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 cursor-pointer'}`}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  {imageFile && (
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="text-xs text-red-600 hover:underline"
                    >Remove new image</button>
                  )}
                </div>
              </>
            )}



            {activeSection === 'transactions' && (
              <>
                <div className="text-black text-2xl font-bold font-['Inter'] capitalize leading-7 mb-6">
                  My Transaction
                </div>
                <div className="mb-4 overflow-x-auto">
                  <div className="inline-flex whitespace-nowrap rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setTransactionTab('trade')}
                      className={`px-4 py-2 text-sm font-medium transition ${transactionTab==='trade' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                    >Buying History</button>
                    <button
                      type="button"
                      onClick={() => setTransactionTab('wallet')}
                      className={`px-4 py-2 text-sm font-medium transition border-l border-gray-200 ${transactionTab==='wallet' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                    >Bonus History</button>
                    <button
                      type="button"
                      onClick={() => setTransactionTab('currency')}
                      className={`px-4 py-2 text-sm font-medium transition border-l border-gray-200 ${transactionTab==='currency' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                    >Transaction History</button>
                  </div>
                </div>
                {transactionTab === 'trade' && (
                  <TradeTransaction token={user?.accessToken} />
                )}
                {transactionTab === 'wallet' && (
                  <WalletTransaction token={user?.accessToken} />
                )}
                {transactionTab === 'currency' && (
                  <CurrencyTransaction token={user?.accessToken} />
                )}
              </>
            )}

            {activeSection === 'password' && (
              <div>
                <div className="text-black text-2xl font-bold font-['Inter'] capitalize leading-7 mb-6">
                  Change Password
                  <p className="text-gray-600 text-base font-normal mt-2">Update your account password here.</p>
                </div>

                <div className="max-w-lg bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  {/* New Password */}
                  <div className="mb-5">
                    <label className="mb-1 block text-black text-sm font-normal">New password</label>
                    <div className="relative">
                      <input
                        type={pwShow1 ? 'text' : 'password'}
                        value={pw1}
                        onChange={(e) => setPw1(e.target.value)}
                        className="w-full h-11 px-3 pr-20 bg-white rounded-md border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setPwShow1((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                      >{pwShow1 ? 'Hide' : 'Show'}</button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-5">
                    <label className="mb-1 block text-black text-sm font-normal">Confirm new password</label>
                    <div className="relative">
                      <input
                        type={pwShow2 ? 'text' : 'password'}
                        value={pw2}
                        onChange={(e) => setPw2(e.target.value)}
                        className="w-full h-11 px-3 pr-20 bg-white rounded-md border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Re-enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setPwShow2((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                      >{pwShow2 ? 'Hide' : 'Show'}</button>
                    </div>
                    {pw1 && pw2 && pw1 !== pw2 && (
                      <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleChangePassword}
                      disabled={changingPw || !pw1 || !pw2 || pw1 !== pw2}
                      className={`h-11 px-6 rounded-lg text-white text-sm font-semibold transition ${changingPw || !pw1 || !pw2 || pw1 !== pw2 ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >{changingPw ? 'Updating...' : 'Update Password'}</button>
                    <button
                      type="button"
                      onClick={() => { setPw1(''); setPw2(''); }}
                      className="h-11 px-4 rounded-lg border text-sm bg-white hover:bg-gray-50"
                    >Clear</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
          {/* Legacy absolute logout removed (moved into sidebar) */}
        </div>
      </div>
    </section>
  );
}
