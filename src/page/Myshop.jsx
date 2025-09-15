import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredShopData, getCurrentUser } from '../utils/auth.js';
import axios from 'axios';
import { Api_Base_Url } from '../config/api';
import Myorders from '../components/orders/Myorders';
import Customerorders from '../components/orders/Customerorders';
import { QRCodeCanvas } from 'qrcode.react';

function Myshop() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeOrdersTab, setActiveOrdersTab] = useState('customer');
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const navigate = useNavigate();
  const qrRef = useRef(null);

  // Normalize image URL (handles relative paths from API)
  const resolveImageUrl = useCallback((url) => {
    if (!url) return '/api/placeholder/300/300';
    try {
      if (/^https?:\/\//i.test(url)) return url;
      const base = (Api_Base_Url || '').replace(/\/$/, '');
      const path = String(url).startsWith('/') ? url : `/${url}`;
      return base ? `${base}${path}` : url;
    } catch {
      return '/api/placeholder/300/300';
    }
  }, []);

  // Build absolute ShopDetails URL for this shop
  const getShopPublicUrl = useCallback(() => {
    if (!shopData?.id) return '';
    if (typeof window === 'undefined') return `/shops/${shopData.id}`;
    const origin = window.location.origin;
    return `${origin}/shops/${shopData.id}`;
  }, [shopData?.id]);

  const handleDownloadQR = () => {
    try {
      if (!qrRef.current) return;
      const canvas = qrRef.current.querySelector('canvas');
      if (!canvas) return;
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `shop-${shopData?.id}-qr.png`;
      link.click();
    } catch (err) {
      console.error('Failed to download QR:', err);
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

  const fetchShopProducts = async (shopId, page = 1) => {
    try {
      setProductsLoading(true);
      setProductsError('');

      console.log('🛍️ [Myshop.jsx] Fetching shop products for shop ID:', shopId, 'page:', page);

      // Try to filter by shop ID in the API call (same as ShopDetails.jsx)
      const response = await axios.get(`${Api_Base_Url}/api/shop-products/?shop=${shopId}&page=${page}`);
      console.log('🛍️ [Myshop.jsx] Shop products response:', response.data);

      // Handle paginated response structure (same logic as ShopDetails.jsx)
      let shopProducts = [];
      if (response.data && response.data.results) {
        // Paginated response
        shopProducts = response.data.results;
        setTotalProducts(response.data.count || 0);
        setHasNextPage(!!response.data.next);
      } else if (Array.isArray(response.data)) {
        // Direct array response
        shopProducts = response.data;
        setTotalProducts(response.data.length);
        setHasNextPage(false);
      } else {
        shopProducts = [];
        setTotalProducts(0);
        setHasNextPage(false);
      }

      // If API doesn't support shop filtering or no products found, filter client-side
      if (!shopProducts || shopProducts.length === 0) {
        console.log('🛍️ [Myshop.jsx] No products found with shop filter, trying fallback...');
        const allProductsResponse = await axios.get(`${Api_Base_Url}/api/shop-products/`);
        let allProducts = [];

        if (allProductsResponse.data && allProductsResponse.data.results) {
          allProducts = allProductsResponse.data.results;
        } else if (Array.isArray(allProductsResponse.data)) {
          allProducts = allProductsResponse.data;
        }

        // Filter by shop ID client-side
        shopProducts = allProducts.filter(product =>
          product.shop === parseInt(shopId) || product.shop_id === parseInt(shopId)
        );
        setTotalProducts(shopProducts.length);
        setHasNextPage(false);
      }

      setProducts(shopProducts);
      console.log('🛍️ [Myshop.jsx] Final products set:', shopProducts);

    } catch (error) {
      console.error('🛍️ [Myshop.jsx] Error fetching shop products:', error);
      setProductsError('Failed to load products');
      setProducts([]);
      setTotalProducts(0);
      setHasNextPage(false);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    const loadShopData = async () => {
      try {
        // Check if user is logged in and is shop owner
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'shop_owner') {
          navigate('/auth');
          return;
        }

        console.log('Current user:', currentUser);

        // First try to get cached data for immediate display
        const cachedShopData = getStoredShopData();
        if (cachedShopData) {
          console.log('Using cached shop data:', cachedShopData);
          setShopData(cachedShopData);
        }

        // Then fetch fresh data from API
        try {
          const freshData = await fetchShopData(currentUser.accessToken);
          if (freshData && freshData.shop) {
            console.log('Fresh shop data received:', freshData.shop);
            setShopData(freshData.shop);

            // Update localStorage with fresh data
            localStorage.setItem('shopData', JSON.stringify(freshData.shop));
          }
        } catch (apiError) {
          console.error('Failed to fetch fresh shop data:', apiError);
          setError('Failed to load latest shop data');

          // If no cached data and API fails, show error
          if (!cachedShopData) {
            setError('Unable to load shop data. Please try refreshing the page.');
          }
        }

      } catch (err) {
        console.error('Error in loadShopData:', err);
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadShopData();
  }, [navigate]);

  // Load products when Overview tab is active (Products moved into Overview)
  useEffect(() => {
    if (activeTab === 'overview' && shopData?.id) {
      fetchShopProducts(shopData.id, currentPage);
    }
  }, [activeTab, shopData?.id, currentPage]);

  if (loading) {
    return (
      <section className="min-h-[80vh] py-8 px-4 md:px-6 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shop data...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-[80vh] py-8 px-4 md:px-6 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Shop Data</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!shopData) {
    return (
      <section className="min-h-[80vh] py-8 px-4 md:px-6 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
            <svg className="w-12 h-12 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Shop Data Found</h3>
            <p className="text-yellow-600 mb-4">Unable to retrieve your shop information</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="block w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('shopData');
                  localStorage.removeItem('userData');
                  window.location.href = '/auth';
                }}
                className="block w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Re-login
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[80vh] py-8 px-4 md:px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Left: Shop Info */}
            <div>
              <div className="flex items-start gap-5 mb-6">
                {/* Logo */}
                <div className="w-20 h-20 rounded-xl overflow-hidden ring-1 ring-gray-200 bg-white shadow-sm relative group flex-shrink-0">
                  <img
                    src={resolveImageUrl(shopData?.shop_image || shopData?.image || shopData?.logo)}
                    alt={shopData?.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/api/placeholder/300/300';
                    }}
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow hidden group-hover:block">
                    Logo
                  </div>
                </div>

                {/* Basic Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">
                    {shopData?.name || 'Loading...'}
                  </h1>
                  <p className="text-sm uppercase tracking-wide text-green-600 font-medium mt-1">My Shop Dashboard</p>
                  <p className="text-gray-600 mt-2">Premium products and services for your needs</p>
                </div>
              </div>

              {/* Detailed Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Address</p>
                    <p className="text-gray-600 text-sm">{shopData?.address || 'Address not available'}</p>
                    {shopData && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {[shopData.upazila_name, shopData.district_name, shopData.division_name]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {shopData?.owner_phone && (
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Phone</p>
                      <a href={`tel:${shopData.owner_phone}`} className="text-green-600 hover:text-green-700 text-sm">
                        {shopData.owner_phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.036 3.185a1 1 0 00.95.69h3.354c.969 0 1.371 1.24.588 1.81l-2.714 1.972a1 1 0 00-.364 1.118l1.036 3.185c.3.921-.755 1.688-1.54 1.118l-2.714-1.972a1 1 0 00-1.176 0l-2.714 1.972c-.784.57-1.838-.197-1.539-1.118l1.036-3.185a1 1 0 00-.364-1.118L4.07 8.612c-.783-.57-.38-1.81.588-1.81h3.354a1 1 0 00.95-.69l1.036-3.185z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Rating</p>
                    <p className="text-gray-600 text-sm">4.8 (152 reviews)</p>
                  </div>
                </div> */}

                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a4 4 0 118 0v4m-4 6v4m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Established</p>
                    <p className="text-gray-600 text-sm">{shopData?.created_at ? new Date(shopData.created_at).toLocaleDateString() : 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: QR Code Section */}
            <div className="flex flex-col items-center justify-center space-y-4 lg:border-l lg:pl-8 border-gray-100">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Your Shop</h3>
                <p className="text-sm text-gray-600 mb-4">Let customers scan to visit your public shop page</p>
              </div>
              
              <div ref={qrRef} className="p-4 bg-gradient-to-br from-white to-green-50 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                <a
                  href={getShopPublicUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open public shop page"
                  title="Open shop page"
                  className="block focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                >
                  <QRCodeCanvas
                    value={getShopPublicUrl() || 'https://example.com'}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#065f46"
                    level="M"
                    includeMargin={true}
                  />
                </a>
              </div>
              
              <button
                onClick={handleDownloadQR}
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                </svg>
                Download QR
              </button>
              
              <p className="text-xs text-gray-500 text-center">
                Customers can scan this code to<br />
                visit your public shop page
              </p>
            </div>

          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'orders', label: 'Orders' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'overview' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Products ({totalProducts})
                </h2>
              </div>

              {productsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading products...</p>
                </div>
              ) : productsError ? (
                <div className="text-center py-12">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                    <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Products</h3>
                    <p className="text-red-600 mb-4">{productsError}</p>
                    <button
                      onClick={() => fetchShopProducts(shopData?.id, currentPage)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
                  <p className="text-gray-600 mb-6">You haven't added any products to your shop yet.</p>
                  <button 
                    onClick={() => navigate('/product')}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Add Your First Product
                  </button>
                </div>
              ) : (
                <div>
                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {products.map((product) => (
                      <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative h-64 bg-gray-50 flex items-center justify-center">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-auto h-full object-contain"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = '/api/placeholder/300/300';
                              }}
                            />
                          ) : null}
                          <div className={`absolute inset-0 bg-gray-200 flex items-center justify-center ${product.image ? 'hidden' : 'flex'}`}>
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                            {product.name}
                          </h3>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-bold text-green-600">
                              ৳{product.price}
                            </span>
                            <span className="text-sm text-gray-500">
                              Stock: {product.stock || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <span>ID: #{product.id}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${product.stock > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => navigate(`/shop-products/${product.id}`)}
                              className="w-full inline-flex items-center justify-center rounded-full border border-green-600 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-black/5 transition-colors shadow-sm"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalProducts > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing {((currentPage - 1) * 12) + 1} to {Math.min(currentPage * 12, totalProducts)} of {totalProducts} products
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg">
                          Page {currentPage}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          disabled={!hasNextPage}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          {activeTab === 'orders' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Orders</h2>
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {/* Sub-tabs for orders */}
                <button
                  onClick={() => setActiveOrdersTab('customer')}
                  className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${activeOrdersTab === 'customer' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-black border-green-600 hover:bg-black/5'}`}
                >
                  Customer Orders
                </button>
                <button
                  onClick={() => setActiveOrdersTab('my')}
                  className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${activeOrdersTab === 'my' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-black border-green-600 hover:bg-black/5'}`}
                >
                  My Orders
                </button>
              </div>

              {activeOrdersTab === 'customer' ? <Customerorders /> : <Myorders />}
            </div>
          )}

         
        </div>
      </div>
    </section>
  );
}

export default Myshop;