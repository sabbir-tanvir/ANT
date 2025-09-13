import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredShopData, getCurrentUser } from '../utils/auth.js';
import axios from 'axios';
import { Api_Base_Url } from '../config/api';

function Myshop() {
  const [activeTab, setActiveTab] = useState('overview');
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

  // Load products when products tab is active
  useEffect(() => {
    if (activeTab === 'products' && shopData?.id) {
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
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {shopData?.name || 'My Shop'}
              </h1>
              <p className="text-gray-600">Manage your shop profile, products, and settings</p>
              {shopData && (
                <p className="text-sm text-gray-500 mt-1">
                  Shop ID: #{shopData.id} • Established: {new Date(shopData.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="mt-4 md:mt-0">
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                Edit Shop Profile
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'products', label: 'Products' },
                { id: 'orders', label: 'Orders' },
                { id: 'settings', label: 'Settings' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
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
              <h2 className="text-xl font-bold text-gray-900 mb-6">Shop Overview</h2>
              
              {/* Debug Info - Remove in production */}
              {/* <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Debug Info</h3>
                <div className="text-xs text-blue-700">
                  <p><strong>Shop Data Available:</strong> {shopData ? 'Yes' : 'No'}</p>
                  {shopData && (
                    <>
                      <p><strong>Shop Name:</strong> {shopData.name || 'N/A'}</p>
                      <p><strong>Shop ID:</strong> {shopData.id || 'N/A'}</p>
                      <p><strong>Address:</strong> {shopData.address || 'N/A'}</p>
                      <p><strong>Raw Data Keys:</strong> {Object.keys(shopData).join(', ')}</p>
                    </>
                  )}
                </div>
              </div> */}
              
              {/* Shop Info Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-20 h-20 bg-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                        {shopData?.shop_image ? (
                          <img 
                            src={shopData.shop_image} 
                            alt={shopData.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <svg 
                          className={`w-10 h-10 text-gray-600 ${shopData?.shop_image ? 'hidden' : 'block'}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {shopData?.name || 'Loading...'}
                        </h3>
                        <p className="text-gray-600 mt-1">
                          Premium products and services for your needs
                        </p>
                        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                          <span>📍 {shopData?.address || 'Address not available'}</span>
                          <span>⭐ 4.8 (152 reviews)</span>
                          {shopData?.owner_phone && (
                            <span>📞 {shopData.owner_phone}</span>
                          )}
                        </div>
                        {shopData && (
                          <div className="mt-2 text-xs text-gray-400">
                            {[shopData.upazila_name, shopData.district_name, shopData.division_name]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">Active</div>
                      <div className="text-sm text-gray-600">Shop Status</div>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">125</div>
                      <div className="text-sm text-gray-600">Total Products</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Performance */}
              {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-blue-600 text-sm font-medium">Today's Orders</div>
                      <div className="text-2xl font-bold text-blue-900">12</div>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-green-600 text-sm font-medium">Today's Revenue</div>
                      <div className="text-2xl font-bold text-green-900">৳8,450</div>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-yellow-600 text-sm font-medium">Pending Orders</div>
                      <div className="text-2xl font-bold text-yellow-900">5</div>
                    </div>
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-purple-600 text-sm font-medium">Total Customers</div>
                      <div className="text-2xl font-bold text-purple-900">248</div>
                    </div>
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div> */}


            </div>
          )}

          {activeTab === 'products' && (
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
                  <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    Add Your First Product
                  </button>
                </div>
              ) : (
                <div>
                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {products.map((product) => (
                      <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-w-1 aspect-h-1 w-full h-48 bg-gray-200">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full bg-gray-200 flex items-center justify-center ${product.image ? 'hidden' : 'flex'}`}>
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
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              product.stock > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => navigate(`/shop-products/${product.id}`)}
                              className="w-full bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
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
              <h2 className="text-xl font-bold text-gray-900 mb-6">Orders</h2>
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600">Order management coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Shop Settings</h2>
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-600">Shop settings coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Myshop;