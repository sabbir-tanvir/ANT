import React, { useEffect, useRef, useState, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Api_Base_Url } from '../config/api';
import { isAuthenticated, getCurrentUser } from '../utils/auth.js';
import QRScanner from '../components/QRScanner';

export default function ProductDetails() {
    const [product, setProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [_selectedSize, _setSelectedSize] = useState('Big size');
    const [_selectedVolume, _setSelectedVolume] = useState('800ml');
    const [_quantity, _setQuantity] = useState(1);
    const [userRole, setUserRole] = useState(null);
    const [showDescription, setShowDescription] = useState(false);

    // Order functionality states
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [orderLoading, setOrderLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // QR Scanner state
    const [showQRScanner, setShowQRScanner] = useState(false);

    // Hold-to-confirm state
    const [showHold, setShowHold] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0); // 0-100
    const holdTimerRef = useRef(null);
    const holdStartRef = useRef(null);
    const HOLD_DURATION = 2000; // ms to complete hold
    const PROGRESS_RADIUS = 54;
    const CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

    const params = useParams();
    const navigate = useNavigate();

    // Images will come from API (product.images); keep a safe fallback
    const productImages = Array.isArray(product?.images) && product.images.length
        ? product.images
        : (product?.image ? [product.image] : ['https://placehold.co/600x600']);




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

    useEffect(() => {
        const idFromRoute = params.id;
        if (!idFromRoute) return;
        axios
            .get(`${Api_Base_Url}/api/products/${idFromRoute}/`)
            .then((res) => setProduct(res.data))
            .catch(() => setProduct(null));
    }, [params.id]);

    // Detect user role (shop_owner vs others/guest)
    useEffect(() => {
        if (isAuthenticated()) {
            const user = getCurrentUser();
            setUserRole(user?.role || null);
            setCurrentUser(user);
        } else {
            setUserRole(null);
            setCurrentUser(null);
        }
    }, []);

    // Cleanup hold timer on unmount
    useEffect(() => {
        return () => {
            if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        };
    }, []);

    // Open QR scanner
    const startShopScanner = () => {
        setShowQRScanner(true);
    };

    // Close QR scanner
    const closeQRScanner = () => {
        setShowQRScanner(false);
    };
    useEffect(() => {
        if (isAuthenticated()) {
            const user = getCurrentUser();
            setCurrentUser(user);
        } else {
            setCurrentUser(null);
        }
    }, []);

    if (!product) {
        return (
            <section className="min-h-[60vh] flex items-center justify-center">
                <div className="text-gray-500 text-sm">Loading product…</div>
            </section>
        );
    }

    const formatMoney = (n) => {
        if (n == null || isNaN(n)) return '0.00';
        const num = Number(n);
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Detect user role


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

    const _handleQuantityChange = (delta) => {
        _setQuantity(prev => Math.max(1, prev + delta));
    };

    // Hold-to-confirm functions
    const openHoldOverlay = () => {
        if (!currentUser || currentUser.role !== 'shop_owner') {
            toast.error('Only shop owners can place orders');
            return;
        }
        if (!product) {
            toast.error('Product information not available');
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
                clearInterval(holdTimerRef.current);
                holdTimerRef.current = null;
                setTimeout(() => {
                    setShowHold(false);
                    handleDirectOrder();
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

    // Order functionality (modal currently not used for customer BUY NOW flow)

    const closeOrderModal = () => {
        setShowOrderModal(false);
    };

    // Direct order without modal (alternative approach)
    const handleDirectOrder = async () => {
        console.log('🚀 [ProductDetails.jsx] DIRECT ORDER INITIATED');
        console.log('📋 Current User:', currentUser);
        console.log('🛍️ Product:', product);
        console.log('🔢 Quantity:', _quantity);

        if (!currentUser || currentUser.role !== 'shop_owner') {
            console.error('❌ [ProductDetails.jsx] Authentication failed - Not a shop owner');
            console.log('User role:', currentUser?.role);
            toast.error('Only shop owners can place orders');
            return;
        }

        if (!product) {
            console.error('❌ [ProductDetails.jsx] No product available');
            toast.error('Product information not available');
            return;
        }

        if (_quantity < 1) {
            console.error('❌ [ProductDetails.jsx] Invalid quantity:', _quantity);
            toast.error('Quantity must be at least 1');
            return;
        }

        try {
            setOrderLoading(true);
            console.log('⏳ [ProductDetails.jsx] Setting loading state to true');

            // Get shop data from localStorage
            const shopDataRaw = localStorage.getItem('shopData');
            console.log('🏪 [ProductDetails.jsx] Raw shop data from localStorage:', shopDataRaw);

            const shopData = JSON.parse(shopDataRaw || '{}');
            console.log('🏪 [ProductDetails.jsx] Parsed shop data:', shopData);

            const shop_id = shopData.id;
            console.log('🆔 [ProductDetails.jsx] Extracted shop_id:', shop_id);

            if (!shop_id) {
                console.error('❌ [ProductDetails.jsx] Shop ID not found in localStorage');
                console.log('Available shop data keys:', Object.keys(shopData));
                toast.error('Shop information not found. Please refresh and try again.');
                return;
            }

            const orderData = {
                shop: shop_id,
                product: product.id,
                quantity: _quantity
            };

            console.log('📦 [ProductDetails.jsx] Order payload prepared:', orderData);
            console.log('📦 [ProductDetails.jsx] Payload format: shop (not shop_id), product (not product_id)');

            const endpoint = `${Api_Base_Url}/api/shop-orders/`;
            console.log('🌐 [ProductDetails.jsx] API Endpoint:', endpoint);
            console.log('🔑 [ProductDetails.jsx] Access Token:', currentUser.accessToken ? 'Present' : 'Missing');
            console.log('🔑 [ProductDetails.jsx] Token Preview:', currentUser.accessToken ? `${currentUser.accessToken.substring(0, 20)}...` : 'N/A');

            const requestHeaders = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.accessToken}`
            };
            console.log('📋 [ProductDetails.jsx] Request Headers:', requestHeaders);

            console.log('📤 [ProductDetails.jsx] Sending API request...');
            console.log('📤 [ProductDetails.jsx] Method: POST');
            console.log('📤 [ProductDetails.jsx] URL:', endpoint);
            console.log('📤 [ProductDetails.jsx] Headers:', requestHeaders);
            console.log('📤 [ProductDetails.jsx] Body:', JSON.stringify(orderData, null, 2));

            const response = await axios.post(
                endpoint,
                orderData,
                {
                    headers: requestHeaders
                }
            );

            console.log('✅ [ProductDetails.jsx] API Response received');
            console.log('📊 [ProductDetails.jsx] Response Status:', response.status);
            console.log('📊 [ProductDetails.jsx] Response Status Text:', response.statusText);
            console.log('📊 [ProductDetails.jsx] Response Headers:', response.headers);
            console.log('📊 [ProductDetails.jsx] Response Data:', response.data);
            console.log('📊 [ProductDetails.jsx] Full Response Object:', response);

            if (response.status === 200 || response.status === 201) {
                console.log('🎉 [ProductDetails.jsx] Order placed successfully!');
                toast.success(`Order placed successfully! Quantity: ${_quantity} x ${product.name}`);
                // Reset quantity to 1 after successful order
                _setQuantity(1);
                console.log('🔄 [ProductDetails.jsx] Quantity reset to 1');
            } else {
                console.error('❌ [ProductDetails.jsx] Unexpected response status:', response.status);
                throw new Error('Order placement failed');
            }

        } catch (error) {
            console.error('💥 [ProductDetails.jsx] Order placement error occurred');
            console.error('💥 [ProductDetails.jsx] Error object:', error);
            console.error('💥 [ProductDetails.jsx] Error message:', error.message);
            console.error('💥 [ProductDetails.jsx] Error stack:', error.stack);

            if (error.response) {
                console.error('📡 [ProductDetails.jsx] Error Response Status:', error.response.status);
                console.error('📡 [ProductDetails.jsx] Error Response Headers:', error.response.headers);
                console.error('📡 [ProductDetails.jsx] Error Response Data:', error.response.data);
                console.error('📡 [ProductDetails.jsx] Full Error Response:', error.response);

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
                console.error('📡 [ProductDetails.jsx] No response received');
                console.error('📡 [ProductDetails.jsx] Request object:', error.request);
                toast.error('Network error: No response from server');
            } else {
                console.error('⚙️ [ProductDetails.jsx] Request setup error:', error.message);
                toast.error('Failed to place order. Please try again.');
            }
        } finally {
            setOrderLoading(false);
            console.log('🏁 [ProductDetails.jsx] Setting loading state to false');
            console.log('🏁 [ProductDetails.jsx] Order process completed');
        }
    };

    const handlePlaceOrder = async () => {
        console.log('🚀 [ProductDetails.jsx] MODAL ORDER INITIATED');
        console.log('📋 Current User:', currentUser);
        console.log('🛍️ Product:', product);
        console.log('🔢 Quantity:', _quantity);

        if (!currentUser || currentUser.role !== 'shop_owner') {
            console.error('❌ [ProductDetails.jsx] Authentication failed - Not a shop owner');
            console.log('User role:', currentUser?.role);
            toast.error('Only shop owners can place orders');
            return;
        }

        if (!product) {
            console.error('❌ [ProductDetails.jsx] No product available');
            toast.error('Product information not available');
            return;
        }

        if (_quantity < 1) {
            console.error('❌ [ProductDetails.jsx] Invalid quantity:', _quantity);
            toast.error('Quantity must be at least 1');
            return;
        }

        try {
            setOrderLoading(true);
            console.log('⏳ [ProductDetails.jsx] Setting loading state to true');

            // Get shop data from localStorage
            const shopDataRaw = localStorage.getItem('shopData');
            console.log('🏪 [ProductDetails.jsx] Raw shop data from localStorage:', shopDataRaw);

            const shopData = JSON.parse(shopDataRaw || '{}');
            console.log('🏪 [ProductDetails.jsx] Parsed shop data:', shopData);

            const shop_id = shopData.id;
            console.log('🆔 [ProductDetails.jsx] Extracted shop_id:', shop_id);

            if (!shop_id) {
                console.error('❌ [ProductDetails.jsx] Shop ID not found in localStorage');
                console.log('Available shop data keys:', Object.keys(shopData));
                toast.error('Shop information not found. Please refresh and try again.');
                return;
            }

            const orderData = {
                shop_id: shop_id,
                product_id: product.id,
                quantity: _quantity
            };

            console.log('📦 [ProductDetails.jsx] Order payload prepared:', orderData);
            console.log('📦 [ProductDetails.jsx] Payload format: shop_id, product_id (original format)');

            const endpoint = `${Api_Base_Url}/api/place-order/`;
            console.log('🌐 [ProductDetails.jsx] API Endpoint:', endpoint);
            console.log('🔑 [ProductDetails.jsx] Access Token:', currentUser.accessToken ? 'Present' : 'Missing');
            console.log('🔑 [ProductDetails.jsx] Token Preview:', currentUser.accessToken ? `${currentUser.accessToken.substring(0, 20)}...` : 'N/A');

            const requestHeaders = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.accessToken}`
            };
            console.log('📋 [ProductDetails.jsx] Request Headers:', requestHeaders);

            console.log('📤 [ProductDetails.jsx] Sending API request...');
            console.log('📤 [ProductDetails.jsx] Method: POST');
            console.log('📤 [ProductDetails.jsx] URL:', endpoint);
            console.log('📤 [ProductDetails.jsx] Headers:', requestHeaders);
            console.log('📤 [ProductDetails.jsx] Body:', JSON.stringify(orderData, null, 2));

            const response = await axios.post(
                endpoint,
                orderData,
                {
                    headers: requestHeaders
                }
            );

            console.log('✅ [ProductDetails.jsx] API Response received');
            console.log('📊 [ProductDetails.jsx] Response Status:', response.status);
            console.log('📊 [ProductDetails.jsx] Response Status Text:', response.statusText);
            console.log('📊 [ProductDetails.jsx] Response Headers:', response.headers);
            console.log('📊 [ProductDetails.jsx] Response Data:', response.data);
            console.log('📊 [ProductDetails.jsx] Full Response Object:', response);

            if (response.status === 200 || response.status === 201) {
                console.log('🎉 [ProductDetails.jsx] Order placed successfully!');
                toast.success(`Order placed successfully! Quantity: ${_quantity} x ${product.name}`);
                closeOrderModal();
                console.log('🔄 [ProductDetails.jsx] Order modal closed');
                // Reset quantity to 1 after successful order
                _setQuantity(1);
                console.log('🔄 [ProductDetails.jsx] Quantity reset to 1');
            } else {
                console.error('❌ [ProductDetails.jsx] Unexpected response status:', response.status);
                throw new Error('Order placement failed');
            }

        } catch (error) {
            console.error('💥 [ProductDetails.jsx] Order placement error occurred');
            console.error('💥 [ProductDetails.jsx] Error object:', error);
            console.error('💥 [ProductDetails.jsx] Error message:', error.message);
            console.error('💥 [ProductDetails.jsx] Error stack:', error.stack);

            if (error.response) {
                console.error('📡 [ProductDetails.jsx] Error Response Status:', error.response.status);
                console.error('📡 [ProductDetails.jsx] Error Response Headers:', error.response.headers);
                console.error('📡 [ProductDetails.jsx] Error Response Data:', error.response.data);
                console.error('📡 [ProductDetails.jsx] Full Error Response:', error.response);

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
                console.error('📡 [ProductDetails.jsx] No response received');
                console.error('📡 [ProductDetails.jsx] Request object:', error.request);
                toast.error('Network error: No response from server');
            } else {
                console.error('⚙️ [ProductDetails.jsx] Request setup error:', error.message);
                toast.error('Failed to place order. Please try again.');
            }
        } finally {
            setOrderLoading(false);
            console.log('🏁 [ProductDetails.jsx] Setting loading state to false');
            console.log('🏁 [ProductDetails.jsx] Order process completed');
        }
    };

    return (
        <section className="py-4 md:py-8 px-4 md:px-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                {/* Top section - Mobile responsive */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="flex flex-col lg:flex-row">
                        {/* Left side - Product Images */}
                        <div className="w-full lg:w-1/2 p-4 md:p-6">
                            {/* Main Image */}
                            <div className="relative border border-black rounded-lg overflow-hidden mb-4 bg-white">
                                <div className="aspect-square flex items-center justify-center p-8">
                                    <img
                                        src={productImages[selectedImage] || productImages[0] || 'https://placehold.co/600x600'}
                                        alt={product?.name || 'Product'}
                                        className="max-w-full max-h-full object-contain"
                                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x600'; }}
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
                                            src={img}
                                            alt={`View ${index + 1}`}
                                            className="w-full h-full object-contain"
                                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/80x80'; }}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right side - Product Info */}
                        <div className="w-full lg:w-1/2 p-4 md:p-6">
                            {/* Product Title & Brand */}
                            <div className="mb-4">
                                <h1 className="text-xl md:text-2xl font-medium text-black mb-3">{product.name}</h1>

                                {/* Brand */}
                                <div className="mb-2">
                                    <span className="text-black text-sm">Brand: <span className="text-green-600 font-medium">{product?.brand || 'Unavailable'}</span></span>
                                </div>

                                {/* Category */}
                                <div className="mb-2">
                                    <span className="text-black text-sm">Category: <span className="text-green-600 font-medium">{product?.category || 'Unavailable'}</span></span>
                                </div>



                            </div>


                            <div className="space-y-4">
                                {/* Price */}
                                {<div>
                                    {userRole === 'shop_owner' &&
                                        product?.retailer_price &&
                                        product?.mrp  ? (
                                        <div className="flex items-baseline gap-3">
                                            <div className="text-2xl font-extrabold text-zinc-800">
                                                BDT {formatMoney(product.retailer_price)} TK
                                            </div>
                                            <div className="text-sm text-gray-500 line-through">
                                                MRP {formatMoney(product.mrp)} TK
                                            </div>
                                            
                                        </div>
                                    ) : (
                                        <div className="text-2xl font-extrabold text-zinc-800">
                                            BDT {getCurrentPrice() ? formatMoney(getCurrentPrice()) : '0.00'} TK
                                        </div>
                                    )}
                                </div>
                                }
                               



                                {/* Action Buttons */}
                                {userRole === 'shop_owner' ? (
                                    <div className="space-y-4">
                                        {/* Quantity (only for shop owner) */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-zinc-800">QTY:</span>
                                            <div className="flex items-center border border-neutral-400 rounded">
                                                <button
                                                    type="button"
                                                    onClick={() => _handleQuantityChange(-1)}
                                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100"
                                                >
                                                    <span className="text-lg font-bold">−</span>
                                                </button>
                                                <span className="px-3 py-1 text-sm font-medium text-zinc-800 min-w-[32px] text-center">{_quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => _handleQuantityChange(1)}
                                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100"
                                                >
                                                    <span className="text-lg font-bold">+</span>
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={openHoldOverlay}
                                            disabled={orderLoading}
                                            className="w-full cursor-pointer py-3 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {orderLoading ? (
                                                <>
                                                    <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                    Placing Order...
                                                </>
                                            ) : (
                                                'ORDER NOW'
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <button
                                            type="button"
                                            onClick={startShopScanner}
                                            className="w-full cursor-pointer py-3 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700"
                                        >
                                            SCAN SHOP
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/view-in-shop/${product.id}`)}
                                            className="w-full py-3 bg-zinc-800 text-white text-sm font-bold cursor-pointer rounded hover:bg-zinc-900"
                                        >
                                            VIEW IN SHOP
                                        </button>
                                    </div>
                                )}

                                {/* Description */}
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
                </div>
            </div>

            {/* Order Confirmation Modal */}
            {showOrderModal && product && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Confirm Order</h3>
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
                                    src={productImages[selectedImage] || productImages[0]}
                                    alt={product.name}
                                    className="w-16 h-16 object-cover rounded-lg"
                                    onError={(e) => {
                                        e.target.src = 'https://placehold.co/64x64';
                                    }}
                                />
                                <div>
                                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                                    <p className="text-sm text-gray-500">{product.brand}</p>
                                    <p className="text-lg font-bold text-green-600">৳{getCurrentPrice()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">Quantity:</span>
                                <span className="text-sm font-semibold">{_quantity}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total Amount:</span>
                                <span className="text-lg font-bold text-green-600">
                                    ৳{(getCurrentPrice() * _quantity).toFixed(2)}
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
                            <p className="text-xs text-gray-500 mb-4">Confirm purchase of {_quantity} × {(product?.name || 'Product')}</p>
                            <div className="text-sm font-medium mb-4">Total: <span className="text-green-600 font-semibold">BDT {formatMoney(getCurrentPrice() * _quantity)} TK</span></div>
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

            {/* QR Scanner Modal */}
            <QRScanner 
                isOpen={showQRScanner}
                onClose={closeQRScanner}
            />
        </section>
    );
}

function SpecRow({ label, value }) {
    return (
        <div className="flex items-center">
            <div className="w-48 text-sm text-gray-600">{label}:</div>
            <div className="flex-1 text-sm text-zinc-800 font-medium">{value}</div>
        </div>
    );
}
