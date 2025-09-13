import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Api_Base_Url } from '../config/api';
import { isAuthenticated, getStoredTokens } from '../utils/auth';
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
  const navigate = useNavigate();
  // Hold-to-confirm state (borrowed pattern from Recharge)
  const [showHold, setShowHold] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0-100
  const holdTimerRef = React.useRef(null);
  const holdStartRef = React.useRef(null);
  const HOLD_DURATION = 2000; // ms to complete hold
  const PROGRESS_RADIUS = 54;
  const CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

  // Mock data for missing fields
  const sizeOptions = [
    { name: 'Big size', price: 150 },
    { name: 'Medium size', price: 200 },
    { name: 'Small size', price: 250 }
  ];

  const _volumeOptions = ['1000ml', '800ml', '500ml', '250ml'];

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

  const getCurrentPrice = () => {
    // Handle nested product structure
    const productData = product?.product || product;
    // Prefer retailer/sale price if available, otherwise fall back to MRP
    if (productData?.retailer_price) return productData.retailer_price;
    if (productData?.mrp) return productData.mrp;
    const size = sizeOptions.find(s => s.name === selectedSize);
    return size ? size.price : 150;
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
                      className="w-full h-full object-cover"
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                      className="w-4 h-4 flex-shrink-0"
                      aria-hidden="true"
                    >
                      <g>
                        <path fill="#eab14d" d="M250.775 196.73H101.909V13.251a5.558 5.558 0 0 1 5.558-5.558h137.75a5.558 5.558 0 0 1 5.558 5.558z"></path>
                        <path fill="#e49542" d="M233.562 7.693V196.73h17.214V13.251a5.558 5.558 0 0 0-5.558-5.558z"></path>
                        <path fill="#df6b57" d="M185.754 50.521H166.93a4.476 4.476 0 0 1-4.476-4.476V7.693h27.777v38.353a4.477 4.477 0 0 1-4.477 4.475z"></path>
                        <path fill="#f1cb86" d="M421.689 360.519H193.556V126.73h222.575a5.558 5.558 0 0 1 5.558 5.558z"></path>
                        <path fill="#ecbe6b" d="M404.476 126.73v233.789h17.214v-228.23a5.558 5.558 0 0 0-5.558-5.558h-11.656z"></path>
                        <path fill="#365e7d" d="M317.035 169.558H298.21a4.476 4.476 0 0 1-4.476-4.476V126.73h27.777v38.353a4.476 4.476 0 0 1-4.476 4.475z"></path>
                        <path fill="#eab14d" d="M276.366 504.308H7.5V326.077a5.558 5.558 0 0 1 5.558-5.558h263.308z"></path>
                        <path fill="#e49542" d="M259.153 320.519h17.214v183.789h-17.214z"></path>
                        <path fill="#365e7d" d="M151.345 363.347H132.52a4.476 4.476 0 0 1-4.476-4.476v-38.353h27.777v38.353a4.476 4.476 0 0 1-4.476 4.476z"></path>
                        <path fill="#eab14d" d="M504.5 504.308H276.366V360.519h222.575a5.558 5.558 0 0 1 5.558 5.558v138.231z"></path>
                        <path fill="#e49542" d="M487.286 360.519v143.789H504.5v-138.23a5.558 5.558 0 0 0-5.558-5.558h-11.656z"></path>
                        <path fill="#df6b57" d="M399.845 403.347H381.02a4.476 4.476 0 0 1-4.476-4.476v-38.353h27.777v38.353a4.476 4.476 0 0 1-4.476 4.476z"></path>
                        <path fill="#f1cb86" d="M193.556 320.519H44.69v-118.23a5.558 5.558 0 0 1 5.558-5.558h143.308z"></path>
                        <path fill="#ecbe6b" d="M176.342 196.73h17.214v123.789h-17.214z"></path>
                        <path fill="#df6b57" d="M128.535 239.558H109.71a4.476 4.476 0 0 1-4.476-4.476V196.73h27.777v38.353a4.476 4.476 0 0 1-4.476 4.475z"></path>
                        <path d="M498.942 353.018H429.19V238.274c0-4.143-3.357-7.5-7.5-7.5s-7.5 3.357-7.5 7.5v114.744H283.867v-32.5c0-4.143-3.357-7.5-7.5-7.5h-75.311V134.229h85.179v30.854c0 6.604 5.372 11.976 11.976 11.976h18.824c6.604 0 11.977-5.372 11.977-11.976v-30.854h85.179v74.059c0 4.143 3.357 7.5 7.5 7.5s7.5-3.357 7.5-7.5v-76c0-7.2-5.858-13.059-13.059-13.059H258.277V13.251c0-7.2-5.858-13.059-13.059-13.059h-137.75c-7.201 0-13.059 5.858-13.059 13.059v47.416c0 4.143 3.358 7.5 7.5 7.5s7.5-3.357 7.5-7.5V15.192h45.545v30.854c0 6.604 5.372 11.976 11.976 11.976h18.825c6.604 0 11.976-5.372 11.976-11.976V15.192h45.545v104.037h-49.719a7.5 7.5 0 0 0-7.5 7.5v62.5H109.41V90.653c0-4.143-3.358-7.5-7.5-7.5s-7.5 3.357-7.5 7.5v98.577H50.248c-7.201 0-13.059 5.857-13.059 13.058v110.73H13.058c-7.2 0-13.058 5.858-13.058 13.059v178.23a7.5 7.5 0 0 0 7.5 7.5h79.416c4.142 0 7.5-3.357 7.5-7.5s-3.358-7.5-7.5-7.5H15V328.018h105.545v30.853c0 6.604 5.373 11.977 11.976 11.977h18.824c6.604 0 11.976-5.373 11.976-11.977v-30.853h105.545v168.789H116.902c-4.142 0-7.5 3.357-7.5 7.5s3.358 7.5 7.5 7.5h387.597c4.143 0 7.5-3.357 7.5-7.5v-138.23c.001-7.2-5.857-13.059-13.057-13.059zM182.73 43.021h-12.776V15.193h12.776zm131.281 91.208v27.829h-12.776v-27.829zM112.734 204.23h12.777v27.828h-12.777zm-60.545 0h45.545v30.853c0 6.604 5.373 11.976 11.976 11.976h18.825c6.604 0 11.976-5.372 11.976-11.976V204.23h45.545v108.788H52.189zm96.132 151.617h-12.776v-27.829h12.776zm248.501 12.171v27.829h-12.777v-27.829zM497 496.807H283.867V368.018h85.178v30.853c0 6.604 5.373 11.977 11.977 11.977h18.824c6.604 0 11.977-5.373 11.977-11.977v-30.853h85.178v128.789z" fill="#000000"></path>
                      </g>
                    </svg>
                    <span className="text-l text-black">
                      {product?.stock && product?.stock !== '0' ? 'In stock' : 'Out of stock'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Size Selection */}
              {/* <div className="mb-6 border-t border-b border-stone-300 py-4">
                <div className="mb-4">
                  <span className="text-sm font-bold text-black uppercase">Size: </span>
                  <span className="text-sm text-stone-500">{selectedSize}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {sizeOptions.map((size) => (
                    <button
                      key={size.name}
                      onClick={() => setSelectedSize(size.name)}
                      className={`p-3 rounded-lg border-2 flex items-center gap-3 ${
                        selectedSize === size.name ? 'border-green-600' : 'border-stone-300'
                      }`}
                    >
                      <div className="w-8 h-8 flex-shrink-0">
                        <img src="/api/placeholder/32/32" alt={size.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-black">{size.name}</div>
                        <div className="text-xs font-bold text-black">{size.price}TK</div>
                      </div>
                    </button>
                  ))}
                </div> */}

              {/* Volume Selection */}
              {/* <div className="mt-6">
                  <span className="text-sm font-bold text-black uppercase">Volume: </span>
                  <span className="text-sm text-stone-500">{selectedVolume}</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {volumeOptions.map((volume) => (
                      <button
                        key={volume}
                        onClick={() => setSelectedVolume(volume)}
                        className={`px-4 py-2 rounded-lg border-2 text-xs font-bold ${
                          selectedVolume === volume 
                            ? 'border-green-600 text-black' 
                            : 'border-stone-300 text-stone-300'
                        }`}
                      >
                        {volume}
                      </button>
                    ))}
                  </div>
                </div>
              </div> */}

              <div className="space-y-4">
                {/* Price Card */}
                <div className="rounded-lg ">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                    <div className="text-2xl font-extrabold text-zinc-900">BDT {formatMoney(currentPrice)} TK</div>
                    {/* {comparePrice && (
                      <>
                        <div className="text-sm text-gray-500 line-through">BDT {formatMoney(comparePrice)} TK</div>
                        {percentOff > 0 && (
                          <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">{percentOff}% OFF</span>
                        )}
                      </>
                    )} */}
                  </div>
                  <div className="text-xs text-green-700 font-semibold mt-1">Order now and get it soon</div>
                </div>

                {/* Quick Info */}
                {/* <div className="rounded-lg border border-stone-200 bg-white p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Brand</span>
                      <span className="text-zinc-800 font-medium">{product?.product?.brand || product?.brand || 'Unavailable'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Category</span>
                      <span className="text-zinc-800 font-medium">{product?.product?.category || product?.category || 'Unavailable'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Shop</span>
                      <span className="text-zinc-800 font-medium">{product?.shop_name || 'Shop'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Stock</span>
                      <span className={`font-medium ${product?.stock && product?.stock !== '0' ? 'text-green-600' : 'text-red-600'}`}>
                        {product?.stock && product?.stock !== '0' ? 'In stock' : 'Out of stock'}
                      </span>
                    </div>
                  </div>
                </div> */}

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
                  {/* {orderMessage && (
                    <div className={`text-xs mt-2 font-medium ${orderSuccess ? 'text-green-600' : 'text-red-600'}`}>{orderMessage}</div>
                  )} */}

                  {/* <button className="w-full py-3 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 25 24" fill="none">
                      <path d="M12.2305 22C17.7533 22 22.2305 17.5228 22.2305 12C22.2305 6.47715 17.7533 2 12.2305 2C6.70762 2 2.23047 6.47715 2.23047 12C2.23047 13.3789 2.50954 14.6926 3.01429 15.8877C3.29325 16.5481 3.43273 16.8784 3.45 17.128C3.46727 17.3776 3.39381 17.6521 3.24689 18.2012L2.23047 22L6.02924 20.9836C6.57835 20.8367 6.85291 20.7632 7.10249 20.7805C7.35208 20.7977 7.68232 20.9372 8.34282 21.2162C9.53792 21.7209 10.8516 22 12.2305 22Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                      <path d="M8.81862 12.3773L9.68956 11.2956C10.0566 10.8397 10.5104 10.4153 10.546 9.80826C10.5549 9.65494 10.4471 8.96657 10.2313 7.58986C10.1465 7.04881 9.64133 7 9.20379 7C8.63361 7 8.34852 7 8.06542 7.12931C7.70761 7.29275 7.34026 7.75231 7.25964 8.13733C7.19586 8.44196 7.24326 8.65187 7.33806 9.07169C7.7407 10.8548 8.68528 12.6158 10.1499 14.0805C11.6147 15.5452 13.3757 16.4898 15.1588 16.8924C15.5786 16.9872 15.7885 17.0346 16.0932 16.9708C16.4782 16.8902 16.9377 16.5229 17.1012 16.165C17.2305 15.8819 17.2305 15.5969 17.2305 15.0267C17.2305 14.5891 17.1817 14.084 16.6406 13.9992C15.2639 13.7834 14.5756 13.6756 14.4222 13.6845C13.8152 13.7201 13.3908 14.1738 12.9349 14.5409L11.8532 15.4118" stroke="white" strokeWidth="1.5" />
                    </svg>
                    WhatsApp
                  </button> */}

                  {/* <div className="text-sm font-bold text-black">If you want to know more about the product</div> */}

                  {/* <Link
                    to={`/shops/${product?.shop || ''}`}
                    className="w-full py-3 bg-zinc-800 text-white text-sm font-bold rounded hover:bg-zinc-900 text-center block"
                  >
                    VIEW SHOP
                  </Link> */}
                </div>

                {/* Security & Logistics */}
                {/* <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-stone-500">Secured transaction</span>
                    <div className="w-4 h-4 text-green-700">✓</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-800 mb-2">Available at Shop</div>
                    <div className="text-sm text-gray-600">{product?.shop_name || 'Shop'}</div>
                  </div>
                  <div className="text-sm font-semibold text-green-700">Fast delivery available</div>
                </div> */}
              </div>


            </div>

























            {/* Purchase Section */}
            {/* <div className="w-full lg:w-80 bg-slate-100 p-6">
              <div className="space-y-4">

                <div className="mb-4">
                  <h1 className="text-xl md:text-2xl font-medium text-black mb-3">
                    {(product?.product?.name || product?.name || 'Product Name')}
                  </h1>

               
                  <div className="mb-2">
                    <span className="text-black text-sm">Brand: <span className="text-green-600 font-medium">{(product?.product?.brand || product?.brand || 'Unavailable')}</span></span>
                  </div>

            
                  <div className="mb-2">
                    <span className="text-black text-sm">Category: <span className="text-green-600 font-medium">{(product?.product?.category || product?.category || 'Unavailable')}</span></span>
                  </div>

                  <div className="mb-2">
                    <div className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${product?.stock && product?.stock !== '0' ? 'bg-green-600' : 'bg-red-600'
                        }`}></div>
                      <span className="text-xs text-black">
                        {product?.stock && product?.stock !== '0' ? 'In stock' : 'Out of stock'}
                      </span>
                    </div>
                  </div>

               
                  <div className="mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                      <span className="text-sm">Buy From  <span className="font-bold">{product?.shop_name || 'Shop'}</span></span>
                    </div>
                  </div>

            
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-green-100 text-green-600 text-xs px-3 py-1 rounded-md uppercase">Available</span>

                  </div>
                </div>

                <div>
                  <div className="text-xl font-extrabold text-zinc-800">BDT {getCurrentPrice()} TK</div>
                  <div className="text-xs text-green-700 font-semibold">Order now and get it soon</div>
                </div>


                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-800">QTY:</span>
                  <div className="flex items-center border border-neutral-400 rounded">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100"
                    >
                      <span className="text-lg font-bold">−</span>
                    </button>
                    <span className="px-3 py-1 text-sm font-medium text-zinc-800">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100"
                    >
                      <span className="text-lg font-bold">+</span>
                    </button>
                  </div>
                </div>


                <div className="space-y-3">
                  <button
                    disabled={!product?.stock || product?.stock === '0'}
                    className={`w-full py-3 text-sm font-bold rounded transition-colors ${product?.stock && product?.stock !== '0'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    {product?.stock && product?.stock !== '0' ? 'BUY NOW' : 'OUT OF STOCK'}
                  </button>



                </div>


              </div>



            </div> */}



            
          </div>
        </div>

        {/* Specification and Summary */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-semibold text-zinc-800 mb-4">Specification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SpecRow label="Product Name" value={product?.product?.name || product?.name || 'Unavailable'} />
            <SpecRow label="Brand" value={product?.product?.brand || product?.brand || 'Unavailable'} />
            <SpecRow label="Category" value={product?.product?.category || product?.category || 'Unavailable'} />
            <SpecRow label="MRP" value={product?.product?.mrp ? `${product.product.mrp} TK` : (product?.mrp ? `${product.mrp} TK` : 'Unavailable')} />
            <SpecRow label="Retailer Price" value={product?.product?.retailer_price ? `${product.product.retailer_price} TK` : (product?.retailer_price ? `${product.retailer_price} TK` : 'Unavailable')} />
            <SpecRow label="Stock" value={product?.stock !== undefined ? (product.stock ? 'In Stock' : 'Out of Stock') : 'Unavailable'} />
            <SpecRow label="Shop" value={product?.shop_name || 'Unavailable'} />
            <SpecRow label="Product ID" value={product?.product?.id || product?.id || 'Unavailable'} />
            <SpecRow label="Referral Bonus" value={product?.product?.referral_bonus ? `${product.product.referral_bonus} TK` : (product?.referral_bonus ? `${product.referral_bonus} TK` : 'Unavailable')} />
            <SpecRow label="Selling Bonus" value={product?.product?.selling_bonus ? `${product.product.selling_bonus} TK` : (product?.selling_bonus ? `${product.selling_bonus} TK` : 'Unavailable')} />
            <SpecRow label="Donation" value={product?.product?.donation !== undefined ? `${product.product.donation} TK` : (product?.donation !== undefined ? `${product.donation} TK` : 'Unavailable')} />
            <SpecRow label="Description" value={product?.product?.description || product?.description || 'Unavailable'} />
          </div>

          <h2 className="text-xl font-semibold text-zinc-800 mt-8 mb-2">Summary</h2>
          <p className="text-sm text-gray-700">
            {product?.product?.name || product?.name || 'Product'}
            {(product?.product?.brand || product?.brand) && ` by ${product?.product?.brand || product?.brand}`}.
            {(product?.product?.category || product?.category) && ` Category: ${product?.product?.category || product?.category}.`}
            {product?.shop_name && ` Available at ${product.shop_name}.`}
            {` Price: ${getCurrentPrice()} TK.`}
          </p>
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
