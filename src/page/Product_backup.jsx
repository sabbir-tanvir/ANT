import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductCard from '../components/productCard.jsx';
import ListProductCard from '../components/ListProductCard.jsx';
import { Api_Base_Url } from '../config/api.js';
import { getCurrentUser } from '../utils/auth.js';

export default function Product() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState(location.state?.searchQuery || "");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [view, setView] = useState("grid"); // "grid" or "list"
  
  // Backend pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Order functionality states
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef(null);
  const categoryBtnRef = useRef(null);

  // Order functionality states
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef(null);
  const categoryBtnRef = useRef(null);
  // Categories from product.category field
  const categories = useMemo(() => {
    const setVals = new Set();
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      setVals.add(cat);
    });
    return ["All Categories", ...Array.from(setVals).sort()];
  }, [products]);

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let mounted = true;

    // Get current user
    const user = getCurrentUser();
    if (mounted) {
      setCurrentUser(user);
    }

    setLoading(true);
    setCurrentPage(1); // Reset to first page
    setProducts([]); // Reset products array

    // Fetch products based on current search term
    const apiUrl = debouncedSearchTerm.trim()
      ? `${Api_Base_Url}/api/products/?search=${encodeURIComponent(debouncedSearchTerm.trim())}`
      : `${Api_Base_Url}/api/products/`;

    axios.get(apiUrl)
      .then(res => {
        if (!mounted) return;
        console.log('API Response:', res.data);

        // Handle paginated response
        if (res.data && typeof res.data === 'object' && res.data.results) {
          // Paginated response
          const { results = [], count = 0, next = null } = res.data;
          
          // Normalize price to number
          const normalized = results.map(p => ({
            ...p,
            price: typeof p.price === 'string' ? parseFloat(p.price) : p.price
          }));
          
          setProducts(normalized);
          setFilteredProducts(normalized);
          setTotalCount(count);
          setNextPageUrl(next);
          setHasNextPage(!!next);
        } else if (Array.isArray(res.data)) {
          // Direct array response (fallback)
          const normalized = res.data.map(p => ({
            ...p,
            price: typeof p.price === 'string' ? parseFloat(p.price) : p.price
          }));
          setProducts(normalized);
          setFilteredProducts(normalized);
          setTotalCount(normalized.length);
          setNextPageUrl(null);
          setHasNextPage(false);
        } else {
          // Unexpected response format
          setProducts([]);
          setFilteredProducts([]);
          setTotalCount(0);
          setNextPageUrl(null);
          setHasNextPage(false);
        }
      })
      .catch(err => {
        console.error('Products API error:', err);
        if (mounted) {
          setProducts([]);
          setFilteredProducts([]);
          setTotalCount(0);
          setNextPageUrl(null);
          setHasNextPage(false);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [debouncedSearchTerm]);

  useEffect(() => {
    let result = [...products];

    // Apply category filter only (search is now handled by API)
    if (selectedCategory !== "All Categories") {
      result = result.filter(p => (p.category || 'Uncategorized') === selectedCategory);
    }

    setFilteredProducts(result);
  }, [products, selectedCategory]);

  // Reset visible items when filter/search changes
  useEffect(() => {
    // No need to reset items since we're using backend pagination
  }, [filteredProducts]);

  // Load more products function
  const loadMoreProducts = async () => {
    if (!nextPageUrl || loadingMore) return;

    try {
      setLoadingMore(true);
      const response = await axios.get(nextPageUrl);
      
      if (response.data && typeof response.data === 'object' && response.data.results) {
        const { results = [], next = null } = response.data;
        
        // Normalize price to number
        const normalized = results.map(p => ({
          ...p,
          price: typeof p.price === 'string' ? parseFloat(p.price) : p.price
        }));
        
        // Append new products to existing ones
        setProducts(prev => [...prev, ...normalized]);
        
        // Apply category filter to new products and append
        let newFiltered = [...normalized];
        if (selectedCategory !== "All Categories") {
          newFiltered = normalized.filter(p => (p.category || 'Uncategorized') === selectedCategory);
        }
        setFilteredProducts(prev => [...prev, ...newFiltered]);
        
        setNextPageUrl(next);
        setHasNextPage(!!next);
        setCurrentPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!showCategoryDropdown) return;
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        categoryBtnRef.current &&
        !categoryBtnRef.current.contains(e.target)
      ) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryDropdown]);

  const handleSearch = () => {
    // Search is now handled reactively by the useEffect that watches searchTerm
    console.log("Search triggered:", searchTerm, "Category:", selectedCategory);
  };

  // Order functionality
  const openOrderModal = (product) => {
    setSelectedProduct(product);
    setOrderQuantity(1);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedProduct(null);
    setOrderQuantity(1);
  };

  const handlePlaceOrder = async () => {

    if (!currentUser || currentUser.role !== 'shop_owner') {
      console.error('❌ [Product.jsx] Authentication failed - Not a shop owner');
      toast.error('Only shop owners can place orders');
      return;
    }

    if (!selectedProduct) {
      console.error('❌ [Product.jsx] No product selected');
      toast.error('Please select a product');
      return;
    }

    if (orderQuantity < 1) {
      console.error('❌ [Product.jsx] Invalid quantity:', orderQuantity);
      toast.error('Quantity must be at least 1');
      return;
    }

    try {
      setOrderLoading(true);

      // Get shop data from localStorage
      const shopDataRaw = localStorage.getItem('shopData');

      const shopData = JSON.parse(shopDataRaw || '{}');

      const shop_id = shopData.id;

      if (!shop_id) {
        console.error('❌ [Product.jsx] Shop ID not found in localStorage');
        console.log('Available shop data keys:', Object.keys(shopData));
        toast.error('Shop information not found. Please refresh and try again.');
        return;
      }

      const orderData = {
        shop: shop_id,
        product: selectedProduct.id,
        quantity: orderQuantity
      };


      const endpoint = `${Api_Base_Url}/api/shop-orders/`;

      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.accessToken}`
      };
      console.log('📋 [Product.jsx] Request Headers:', requestHeaders);


      const response = await axios.post(
        endpoint,
        orderData,
        {
          headers: requestHeaders
        }
      );

      console.log('✅ [Product.jsx] API Response received');
      console.log('📊 [Product.jsx] Response Status:', response.status);
      console.log('📊 [Product.jsx] Response Status Text:', response.statusText);
      console.log('📊 [Product.jsx] Response Headers:', response.headers);
      console.log('📊 [Product.jsx] Response Data:', response.data);
      console.log('📊 [Product.jsx] Full Response Object:', response);

      if (response.status === 200 || response.status === 201) {
        console.log('🎉 [Product.jsx] Order placed successfully!');
        toast.success(`Order placed successfully! Quantity: ${orderQuantity} x ${selectedProduct.name}`);
        closeOrderModal();
      } else {
        console.error('❌ [Product.jsx] Unexpected response status:', response.status);
        throw new Error('Order placement failed');
      }

    } catch (error) {
      console.error('💥 [Product.jsx] Error object:', error);
      console.error('💥 [Product.jsx] Error message:', error.message);
      console.error('💥 [Product.jsx] Error stack:', error.stack);

      if (error.response) {
        console.error('📡 [Product.jsx] Error Response Status:', error.response.status);
        console.error('📡 [Product.jsx] Error Response Headers:', error.response.headers);
        console.error('📡 [Product.jsx] Error Response Data:', error.response.data);
        console.error('📡 [Product.jsx] Full Error Response:', error.response);

        let errorMessage = 'Failed to place order. Please try again.';

        // Handle different response types
        if (error.response?.data) {
          if (typeof error.response.data === 'string') {
            // Check if it's HTML error page (Django error format)
            if (error.response.data.includes('exception_value')) {
              // Extract error from Django HTML error page
              const match = error.response.data.match(/<pre class="exception_value">\[(.*?)\]<\/pre>/);
              if (match && match[1]) {
                // Clean up the extracted error message
                errorMessage = match[1]
                  .replace(/&#x27;/g, "'")
                  .replace(/&quot;/g, '"')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&amp;/g, '&');
              }
            } else {
              // Plain text error
              errorMessage = error.response.data;
            }
          } else if (typeof error.response.data === 'object') {
            // JSON error response
            if (error.response.data.message) {
              errorMessage = error.response.data.message;
            } else if (error.response.data.error) {
              errorMessage = error.response.data.error;
            } else if (error.response.data.detail) {
              errorMessage = error.response.data.detail;
            } else if (error.response.data.non_field_errors) {
              errorMessage = Array.isArray(error.response.data.non_field_errors)
                ? error.response.data.non_field_errors.join(', ')
                : error.response.data.non_field_errors;
            } else if (Array.isArray(error.response.data)) {
              errorMessage = error.response.data.join(', ');
            }
          }
        }

        // Show specific error based on status code
        if (error.response.status === 400) {
          toast.error(`Order failed: ${errorMessage}`);
        } else if (error.response.status === 401) {
          toast.error('Authentication failed. Please login again.');
        } else if (error.response.status === 403) {
          toast.error('You are not authorized to place orders.');
        } else if (error.response.status === 500) {
          toast.error(`Server error: ${errorMessage}`);
        } else {
          toast.error(`Order failed: ${errorMessage}`);
        }
      } else if (error.request) {
        console.error('📡 [Product.jsx] No response received');
        console.error('📡 [Product.jsx] Request object:', error.request);
        toast.error('Network error: No response from server');
      } else {
        console.error('⚙️ [Product.jsx] Request setup error:', error.message);
        toast.error('Failed to place order. Please try again.');
      }
    } finally {
      setOrderLoading(false);
      console.log('🏁 [Product.jsx] Setting loading state to false');
      console.log('🏁 [Product.jsx] Order process completed');
    }
  };




  return (
    <section className="min-h-screen py-8 px-4 md:px-6 bg-gray-50">
      <div className="max-w-[1360px] mx-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden">

          {/* Search Bar (Enhanced) */}
          <div className="flex justify-center mt-14 px-2">
            <div className="w-full max-w-[760px] relative">
              <div className="flex items-stretch bg-white rounded-full overflow-hidden h-14 shadow-md hover:shadow-lg transition ring-1 ring-transparent focus-within:ring-2 focus-within:ring-green-500">
                {/* Category Dropdown Trigger */}
                <button
                  ref={categoryBtnRef}
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={showCategoryDropdown}
                  onClick={() => setShowCategoryDropdown(v => !v)}
                  className="group px-6 flex items-center gap-2 text-xs font-medium text-gray-600 hover:bg-green-50 focus:outline-none transition h-full"
                >
                  <span className="truncate max-w-[140px] text-left">{selectedCategory}</span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Divider */}
                <div className="self-stretch w-px bg-green-100" />

                {/* Input */}
                <div className="flex-1 flex items-center h-full">
                  <input
                    type="text"
                    placeholder="Search products, categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-transparent px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                    aria-label="Search products"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="button"
                  onClick={handleSearch}
                  className="m-1 ml-0 rounded-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-6 flex items-center justify-center gap-1 text-sm font-medium transition h-[calc(100%-8px)]"
                  aria-label="Search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                  </svg>
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>

              {/* Dropdown */}
              {showCategoryDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute z-20 mt-2 w-64 bg-white rounded-xl border border-gray-100 shadow-xl py-2 px-1 animate-fadeIn"
                >
                  <div className="max-h-72 overflow-y-auto thin-scroll pr-1">
                    {categories.map(category => {
                      const active = category === selectedCategory;
                      return (
                        <button
                          key={category}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => { setSelectedCategory(category); setShowCategoryDropdown(false); }}
                          className={`w-full flex items-center justify-between text-left text-sm rounded-md px-3 py-2 mb-1 last:mb-0 transition group ${active ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          <span className="truncate">{category}</span>
                          {active && (
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Header with filters */}
          <div className="flex justify-between items-center px-8 mt-8 mb-8">
            <div className="text-black text-sm font-semibold font-['Inter']">All product ({filteredProducts.length})</div>
            <div className="flex justify-start items-center gap-4">
              {/* View Toggle */}

              <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setView("grid")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${view === "grid"
                      ? "bg-green-600 text-white"
                      : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${view === "list"
                      ? "bg-green-600 text-white"
                      : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

            </div>
          </div>

          <div className="flex">
            {/* Sidebar removed: category filter handled in top bar only */}

            {/* Products */}
            <div className="flex-1 p-6 pb-20">
              {/* Loading State */}
              {loading && (
                <div className="flex justify-center items-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading products...</p>
                  </div>
                </div>
              )}

              {/* No Results */}
              {!loading && filteredProducts.length === 0 && (
                <div className="text-center py-20">
                  <div className="mx-auto w-24 h-24 mb-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-full flex items-center justify-center border-2 border-gray-200">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {searchTerm || selectedCategory !== "All Categories" 
                      ? `No products match your search criteria. Try different keywords or browse all categories.` 
                      : 'No products are currently available. Please check back later.'}
                  </p>
                  {(searchTerm || selectedCategory !== "All Categories") && (
                    <div className="flex justify-center gap-3">
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-green-300 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Clear search
                        </button>
                      )}
                      {selectedCategory !== "All Categories" && (
                        <button
                          onClick={() => setSelectedCategory("All Categories")}
                          className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-green-300 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                          Show all categories
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Products Grid/List */}
              {!loading && filteredProducts.length > 0 && (
                <div>
                  {view === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
                      {filteredProducts.slice(0, itemsToShow).map((p) => (
                        <ProductCard
                          key={p.id}
                          imageSrc={p.image}
                          name={p.name}
                          price={p.price}
                          brand={p.brand}
                          category={p.category}
                          to={`/product/${p.id}`}
                          compact
                          showOrderButton={currentUser?.role === 'shop_owner'}
                          onOrder={openOrderModal}
                          product={p}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {filteredProducts.slice(0, itemsToShow).map((p) => (
                        <ListProductCard
                          key={p.id}
                          id={p.id}
                          image={p.image}
                          name={p.name}
                          brand={p.brand}
                          category={p.category}
                          price={p.price}
                          showOrderButton={currentUser?.role === 'shop_owner'}
                          onOrder={openOrderModal}
                          product={p}
                        />
                      ))}
                    </div>
                  )}
                  {itemsToShow < filteredProducts.length && (
                    <div className="flex justify-center py-6">
                      <button
                        type="button"
                        onClick={() => setItemsToShow((prev) => Math.min(prev + 20, filteredProducts.length))}
                        className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Load more
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && selectedProduct && (
        <div className="fixed inset-0  bg-opacity-40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-100 transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Place Order</h3>
              <button
                onClick={closeOrderModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={orderLoading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-16 h-16 object-contain rounded-lg"
                  onError={(e) => {
                    e.target.src = '/api/placeholder/64/64';
                  }}
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedProduct.name}</h4>
                  <p className="text-sm text-gray-500">{selectedProduct.brand}</p>
                  <p className="text-lg font-bold text-green-600">৳{selectedProduct.retailer_price}</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  disabled={orderLoading || orderQuantity <= 1}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                  </svg>
                </button>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={orderLoading}
                />
                <button
                  type="button"
                  onClick={() => setOrderQuantity(orderQuantity + 1)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  disabled={orderLoading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="text-lg font-bold text-green-600">
                  ৳{(selectedProduct.retailer_price * orderQuantity).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeOrderModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={orderLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={orderLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {orderLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Placing Order...
                  </>
                ) : (
                  'Confirm Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
