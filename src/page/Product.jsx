import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from 'react-toastify';
import ListProductCard from "../components/ListProductCard.jsx";
import ProductCard from "../components/productCard.jsx";
import { Api_Base_Url } from "../config/api.js";
import { getCurrentUser } from "../utils/auth.js";

export default function Product() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [view, setView] = useState("grid"); // "grid" or "list"
  const [itemsToShow, setItemsToShow] = useState(20); // for load more
  
  // Order functionality states
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
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

  useEffect(() => {
    let mounted = true;
    
    // Get current user
    const user = getCurrentUser();
    if (mounted) {
      setCurrentUser(user);
    }
    
    // Fetch products
    axios.get(`${Api_Base_Url}/api/products/`)
      .then(res => {
        if (!mounted) return;
        const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.results) ? res.data.results : []);
        console.log('API Response:', res.data);
        
        // Normalize price to number
        const normalized = list.map(p => ({
          ...p,
          price: typeof p.price === 'string' ? parseFloat(p.price) : p.price
        }));
        setProducts(normalized);
        setFilteredProducts(normalized);
      })
      .catch(err => {
        console.error('Products API error:', err);
        if (mounted) {
          setProducts([]);
          setFilteredProducts([]);
        }
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let result = [...products];
    
    // Apply search filter (name or category)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(p => (
        (p.name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      ));
    }

    // Apply category filter
    if (selectedCategory !== "All Categories") {
      result = result.filter(p => (p.category || 'Uncategorized') === selectedCategory);
    }
    
    setFilteredProducts(result);
  }, [products, searchTerm, selectedCategory]);

  // Reset visible items when filter/search changes
  useEffect(() => {
    setItemsToShow(20);
  }, [filteredProducts]);

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
    // Search handled reactively; keep for potential analytics.
    console.log("Search:", searchTerm, "Category:", selectedCategory);
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

  const CheckBox = ({ active }) => (
    <div className="w-5 h-5 flex items-center justify-center">
      {active ? (
        <div className="w-5 h-5 bg-green-600 rounded flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      ) : (
        <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
      )}
    </div>
  );

  const StarRating = ({ value }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className="w-4 h-4" fill={i <= value ? "#fbbf24" : "#d1d5db"} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  return (
    <section className="min-h-screen py-8 px-4 md:px-6 bg-gray-50">
      <div className="max-w-[1360px] mx-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden min-h-[1000px]">
          
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
              <div className="flex justify-start items-center gap-2">
                <button
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                  aria-pressed={view === 'grid'}
                  className={`inline-flex items-center justify-center w-8 h-8 rounded ${view === 'grid' ? 'text-green-600' : 'text-gray-400'} hover:bg-gray-50`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 18" fill="currentColor" className="w-5 h-5" aria-hidden>
                    <path d="M19 0C19.2652 0 19.5196 0.105357 19.7071 0.292893C19.8946 0.48043 20 0.734784 20 1V17C20 17.2652 19.8946 17.5196 19.7071 17.7071C19.5196 17.8946 19.2652 18 19 18H1C0.734784 18 0.48043 17.8946 0.292893 17.7071C0.105357 17.5196 0 17.2652 0 17V1C0 0.734784 0.105357 0.48043 0.292893 0.292893C0.48043 0.105357 0.734784 0 1 0H19ZM9 10H2V16H9V10ZM18 10H11V16H18V10ZM9 2H2V8H9V2ZM18 2H11V8H18V2Z" />
                  </svg>
                </button>
                <button
                  onClick={() => setView("list")}
                  aria-label="List view"
                  aria-pressed={view === 'list'}
                  className={`inline-flex items-center justify-center w-8 h-8 rounded ${view === 'list' ? 'text-green-600' : 'text-gray-400'} hover:bg-gray-50`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
                    <path d="M8 9C7.71667 9 7.47934 8.904 7.288 8.712C7.09667 8.52 7.00067 8.28267 7 8C6.99934 7.71733 7.09534 7.48 7.288 7.288C7.48067 7.096 7.718 7 8 7H20C20.2833 7 20.521 7.096 20.713 7.288C20.905 7.48 21.0007 7.71733 21 8C20.9993 8.28267 20.9033 8.52033 20.712 8.713C20.5207 8.90567 20.2833 9.00133 20 9H8ZM8 13C7.71667 13 7.47934 12.904 7.288 12.712C7.09667 12.52 7.00067 12.2827 7 12C6.99934 11.7173 7.09534 11.48 7.288 11.288C7.48067 11.096 7.718 11 8 11H20C20.2833 11 20.521 11.096 20.713 11.288C20.905 11.48 21.0007 11.7173 21 12C20.9993 12.2827 20.9033 12.5203 20.712 12.713C20.5207 12.9057 20.2833 13.0013 20 13H8ZM8 17C7.71667 17 7.47934 16.904 7.288 16.712C7.09667 16.52 7.00067 16.2827 7 16C6.99934 15.7173 7.09534 15.48 7.288 15.288C7.48067 15.096 7.718 15 8 15H20C20.2833 15 20.521 15.096 20.713 15.288C20.905 15.48 21.0007 15.7173 21 16C20.9993 16.2827 20.9033 16.5203 20.712 16.713C20.5207 16.9057 20.2833 17.0013 20 17H8ZM4 9C3.71667 9 3.47934 8.904 3.288 8.712C3.09667 8.52 3.00067 8.28267 3 8C2.99934 7.71733 3.09534 7.48 3.288 7.288C3.48067 7.096 3.718 7 4 7C4.282 7 4.51967 7.096 4.713 7.288C4.90634 7.48 5.002 7.7173 5 8C4.998 8.28267 4.902 8.52033 4.712 8.713C4.522 8.90567 4.28467 9.00133 4 9ZM4 13C3.71667 13 3.47934 12.904 3.288 12.712C3.09667 12.52 3.00067 12.2827 3 12C2.99934 11.7173 3.09534 11.48 3.288 11.288C3.48067 11.096 3.718 11 4 11C4.282 11 4.51967 11.096 4.713 11.288C4.90634 11.48 5.002 11.7173 5 12C4.998 12.2827 4.902 12.5203 4.712 12.713C4.522 12.9057 4.28467 13.0013 4 13ZM4 17C3.71667 17 3.47934 16.904 3.288 16.712C3.09667 16.52 3.00067 16.2827 3 16C2.99934 15.7173 3.09534 15.48 3.288 15.288C3.48067 15.096 3.718 15 4 15C4.282 15 4.51967 15.096 4.713 15.288C4.90634 15.48 5.002 15.7173 5 16C4.998 16.2827 4.902 16.5203 4.712 16.713C4.522 16.9057 4.28467 17.0013 4 17Z" />
                  </svg>
                </button>
              </div>

            </div>
          </div>

          <div className="flex">
            {/* Sidebar removed: category filter handled in top bar only */}

            {/* Products */}
            <div className="flex-1 p-6 pb-20">
              <div>
                {view === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-5 md:gap-6">
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
                  className="w-16 h-16 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = '/api/placeholder/64/64';
                  }}
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedProduct.name}</h4>
                  <p className="text-sm text-gray-500">{selectedProduct.brand}</p>
                  <p className="text-lg font-bold text-green-600">৳{selectedProduct.price}</p>
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
                  ৳{(selectedProduct.price * orderQuantity).toFixed(2)}
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
