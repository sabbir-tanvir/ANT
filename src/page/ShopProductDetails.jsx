import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Api_Base_Url } from '../config/api';
import { isAuthenticated, getStoredTokens, getCurrentUser } from '../utils/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ShopProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, _setSelectedSize] = useState('Big size');
  const [_selectedVolume, _setSelectedVolume] = useState('800ml');
  const [quantity, setQuantity] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  // Hold-to-confirm state (borrowed pattern from Recharge)
  const [showHold, setShowHold] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0-100
  const holdTimerRef = React.useRef(null);
  const holdStartRef = React.useRef(null);
  const HOLD_DURATION = 2000; // ms to complete hold
  const PROGRESS_RADIUS = 54;
  const CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;





  // Description helpers (approximate 4 lines or ~50+ words)
  const descriptionHtml = product?.description || '';
  const descriptionPlain = useMemo(() => {
    if (!descriptionHtml) return '';
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = descriptionHtml;
      return tempDiv.textContent || tempDiv.innerText || '';
    } catch {
      return descriptionHtml;
    }
  }, [descriptionHtml]);
  const descriptionWordCount = useMemo(() => (descriptionPlain ? descriptionPlain.split(/\s+/).length : 0), [descriptionPlain]);
  const descriptionIsLong = descriptionWordCount > 50 || (descriptionPlain?.length || 0) > 300;


  const fetchProductDetails = useCallback(async () => {
    try {
      setError('');
      console.log('Fetching product details for ID:', id);
      const response = await axios.get(`${Api_Base_Url}/api/shop-products/${id}/`);
      console.log('Product details response:', response.data);
      setProduct(response.data);

    } catch (error) {
      console.error('Error fetching product details:', error);
      setError('Failed to load product details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id, fetchProductDetails]);

  // Detect user role
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      setCurrentUser(user);
    } else {
      setCurrentUser(null);
    }
  }, []);

  const getCurrentPrice = () => {
    // Handle nested product structure
    const productData = product?.product || product;
    
    // For shop owners, show retailer price if available, otherwise MRP
    if (currentUser?.role === 'shop_owner') {
      if (productData?.retailer_price) return productData.retailer_price;
    }
    
    // For all users (including shop owners if no retailer price), show MRP
    if (productData?.mrp) return productData.mrp;
    
   
  };

  const handleQuantityChange = (delta) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const getProductImages = () => {
    // Handle nested product structure
    const productData = product?.product || product;
    if (productData?.images && Array.isArray(productData.images)) {
      return productData.images;
    }
    if (product?.image) {
      return [product.image];
    }
    if (productData?.image) {
      return [productData.image];
    }
    return ['/api/placeholder/600/600'];
  };

  const resolveShopId = () => {
    // Different possible shapes
    if (!product) return null;
    if (product.shop) return product.shop; // numeric id or string
    if (product.shop_id) return product.shop_id;
    if (product.shop?.id) return product.shop.id;
    return null;
  };

  const resolveProductId = () => {
    if (!product) return null;
    if (product.product?.id) return product.product.id;
    if (product.id) return product.id;
    return null;
  };

  const handleBuyNow = async () => {
    if (!product?.stock || product?.stock === '0') return; // guard
    // Auth check
    if (!isAuthenticated()) {
      navigate('/auth', { replace: true, state: { from: `/shop-product/${id}` } });
      return;
    }

    const shop_id = resolveShopId();
    const product_id = resolveProductId();
    if (!shop_id || !product_id) {
      setOrderSuccess(false);
      setOrderMessage('Missing shop or product information.');
      return;
    }

    const payload = { shop_id, product_id, quantity };
    try {
      setOrderLoading(true);
      setOrderMessage('');
      setOrderSuccess(false);
      const tokens = getStoredTokens();
      const access = tokens?.access;
      const res = await axios.post(`${Api_Base_Url}/api/place-order/`, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(access ? { Authorization: `Bearer ${access}` } : {})
        }
      });
      console.log('Order placed:', res.data);
      setOrderSuccess(true);
      setOrderMessage('Order placed successfully.');
      toast.success('Order placed successfully');
      // Optional: reset quantity
      // setQuantity(1);
    } catch (err) {
      console.error('Order placement failed:', err);
      let msg = 'Failed to place order.';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') msg = err.response.data;
        else if (err.response.data.detail) msg = err.response.data.detail;
        else msg = JSON.stringify(err.response.data);
      }
      setOrderSuccess(false);
      setOrderMessage(msg);
      // Attempt to parse JSON error shape like {"error":"Insufficient balance..."}
      try {
        if (typeof msg === 'string') {
          let parsed = null;
          if (msg.startsWith('{') && msg.endsWith('}')) {
            parsed = JSON.parse(msg);
          }
          if (parsed && parsed.error) {
            toast.error(parsed.error);
          } else if (err.response?.data?.error) {
            toast.error(err.response.data.error);
          } else {
            toast.error(msg);
          }
        } else {
          toast.error('Order failed');
        }
      } catch {
        toast.error(msg);
      }
    } finally {
      setOrderLoading(false);
    }
  };

  // Open hold overlay instead of placing order immediately
  const openHoldOverlay = () => {
    if (!product?.stock || product?.stock === '0') return;
    // Auth check first
    if (!isAuthenticated()) {
      navigate('/auth', { replace: true, state: { from: `/shop-product/${id}` } });
      return;
    }
    // Reset progress
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
    setShowHold(true);
  };

  // Start holding (mouse/touch down)
  const startHold = () => {
    if (orderLoading) return;
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
        // Complete
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
        setTimeout(() => {
          setShowHold(false);
          handleBuyNow();
        }, 120);
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

  // Cleanup on unmount
  useEffect(() => () => { if (holdTimerRef.current) clearInterval(holdTimerRef.current); }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Product</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            to="/shops"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            ← Back to Shops
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-500 text-sm">Product not found</div>
      </section>
    );
  }

  const productImages = getProductImages();

  // Helpers for price display and formatting
  const formatMoney = (n) => {
    const num = Number(n);
    if (Number.isNaN(num)) return n ?? '';
    return num.toLocaleString('en-US');
  };
  const currentPrice = Number(getCurrentPrice());

  return (
    <section className="py-4 md:py-8 px-4 md:px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to={product?.shop ? `/shops/${product.shop}` : '/shops'}
            className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to {product?.shop_name || 'Shop'}
          </Link>
        </div>

        {/* Top section - Mobile responsive */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left side - Product Images */}
            <div className="w-full lg:w-1/2 p-4 md:p-6">
              {/* Main Image */}
              <div className="relative border border-black rounded-lg overflow-hidden mb-4 bg-white">
                <div className="aspect-square flex items-center justify-center p-8">
                  <img
                    src={productImages[selectedImage] || '/api/placeholder/600/600'}
                    alt={product?.product?.name || product?.name || 'Product'}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/600/600';
                    }}
                  />
                </div>
                {/* NEW badge */}
                <div className="absolute top-4 left-4 bg-neutral-800 text-white text-xs px-2 py-1 rounded">
                  NEW
                </div>
              </div>

              {/* Thumbnail Images */}
              <div className="flex gap-2 overflow-x-auto">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 border-2 rounded overflow-hidden ${selectedImage === index ? 'border-green-600' : 'border-gray-300'
                      }`}
                  >
                    <img
                      src={img || '/api/placeholder/80/80'}
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/80/80';
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right side - Product Info */}
            <div className="w-full lg:w-1/2 p-4 md:p-6">
              {/* Product Title & Brand */}
              <div className="mb-4">
                <h1 className="text-xl md:text-2xl font-medium text-black mb-3">
                  {(product?.product?.name || product?.name || 'Product Name')}
                </h1>

                {/* Brand */}
                <div className="mb-2">
                  <span className="text-black text-sm">Brand: <span className="text-green-600 font-medium">{(product?.product?.brand || product?.brand || 'Unavailable')}</span></span>
                </div>

                {/* Category */}
                <div className="mb-2">
                  <span className="text-black text-sm">Category: <span className="text-green-600 font-medium">{(product?.product?.category || product?.category || 'Unavailable')}</span></span>
                </div>

                {/* Stock Status */}


                {/* Shop Info */}
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    <span className="text-sm">Buy From  <span className="font-bold">{product?.shop_name || 'Shop'}</span></span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="bg-green-100 text-green-600 text-xs px-3 py-1 rounded-md uppercase">Available</span>
                  {/* {product?.stock && product?.stock !== '0' && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-md uppercase">In Stock</span>
                  )} */}


                  <div className="flex items-center gap-2">
                    {/* 
                    Here is the svg icon and stock text */}



                    <span className="text-l text-black">
                      {product?.stock && product?.stock !== '0' ? 'In stock' : 'Out of stock'}
                    </span>
                  </div>
                </div>
              </div>



              <div className="space-y-4">
                {/* Price Card */}
                <div className="rounded-lg ">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                    {/* Show MRP for all users */}
                    {(product?.product?.mrp || product?.mrp) && (
                      <div className="text-2xl font-extrabold text-zinc-900">
                        MRP: BDT {formatMoney(product?.product?.mrp || product?.mrp)} TK
                      </div>
                    )}
                    
                    {/* Show retailer price only for shop owners */}
                    {currentUser?.role === 'shop_owner' && (product?.product?.retailer_price || product?.retailer_price) && (
                      <div className="text-lg font-semibold text-green-600">
                        Retailer: BDT {formatMoney(product?.product?.retailer_price || product?.retailer_price)} TK
                      </div>
                    )}
                    
                    {/* Fallback if no MRP available */}
                    {!(product?.product?.mrp || product?.mrp) && (
                      <div className="text-2xl font-extrabold text-zinc-900">BDT {formatMoney(currentPrice)} TK</div>
                    )}
                  </div>
                  <div className="text-xs text-green-700 font-semibold mt-1">Order now and get it soon</div>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-zinc-800">Quantity</span>
                  <div className="flex items-center border-2 border-neutral-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 text-lg"
                    >
                      −
                    </button>
                    <span className="min-w-[2.5rem] text-center px-3 py-1 text-sm font-medium text-zinc-800">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                  <button
                    onClick={openHoldOverlay}
                    disabled={!product?.stock || product?.stock === '0' || orderLoading}
                    className={`w-full py-3 text-sm font-bold rounded transition-colors flex items-center justify-center gap-2 ${product?.stock && product?.stock !== '0' && !orderLoading
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : (!product?.stock || product?.stock === '0') ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white opacity-80'
                      }`}
                  >
                    {orderLoading && (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    )}
                    {product?.stock && product?.stock !== '0' ? (orderLoading ? 'PROCESSING...' : 'BUY NOW') : 'OUT OF STOCK'}
                  </button>
                </div>
              </div>

              {/* Product Description - Moved below buttons */}

              {product?.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Product Description</h3>
                    {descriptionIsLong && (
                      <button
                        onClick={() => setShowDescription(!showDescription)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                        aria-expanded={showDescription}
                      >
                        <span>{showDescription ? 'Show less' : 'Show more'}</span>
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${showDescription ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div
                    className="prose prose-sm max-w-none [&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-gray-400 [&_td]:p-2 [&_th]:border [&_th]:border-gray-400 [&_th]:p-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-4 [&_p]:mb-2 animate-fadeIn"
                    style={descriptionIsLong && !showDescription ? {
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    } : undefined}
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              )}




            </div>
          </div>
        </div>



        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Hold-to-confirm overlay for BUY NOW */}
      {showHold && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-2xl p-6 text-center relative shadow-xl">
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
              <p className="text-xs text-gray-500 mb-4">Confirm purchase of {quantity} × {(product?.product?.name || product?.name || 'Product')}</p>
              <div className="text-sm font-medium mb-4">Total: <span className="text-green-600 font-semibold">BDT {formatMoney(currentPrice * quantity)} TK</span></div>
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
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme="colored" />
    </section>
  );
}

// Hold-to-confirm overlay (placed after main return for clarity)
// Inject overlay portal-like at end of component JSX (inside same file)


function SpecRow({ label, value }) {
  return (
    <div className="flex items-center">
      <div className="w-48 text-sm text-gray-600">{label}:</div>
      <div className="flex-1 text-sm text-zinc-800 font-medium">{String(value)}</div>
    </div>
  );
}
