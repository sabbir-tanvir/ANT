import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Api_Base_Url } from '../config/api';
import { isAuthenticated, getCurrentUser } from '../utils/auth.js';

export default function ProductDetails() {
    const [product, setProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [_selectedSize, _setSelectedSize] = useState('Big size');
    const [_selectedVolume, _setSelectedVolume] = useState('800ml');
    const [_quantity, _setQuantity] = useState(1);
    const [userRole, setUserRole] = useState(null);
    
    // Order functionality states
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [orderLoading, setOrderLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    
    const params = useParams();
    const navigate = useNavigate();

    // Images will come from API (product.images); keep a safe fallback
    const productImages = Array.isArray(product?.images) && product.images.length
        ? product.images
        : (product?.image ? [product.image] : ['https://placehold.co/600x600']);

    const _sizeOptions = [
        { name: 'Big size', price: 150 },
        { name: 'Medium size', price: 200 },
        { name: 'Small size', price: 250 }
    ];

    const _volumeOptions = ['1000ml', '800ml', '500ml', '250ml'];

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

    if (!product) {
        return (
            <section className="min-h-[60vh] flex items-center justify-center">
                <div className="text-gray-500 text-sm">Loading product…</div>
            </section>
        );
    }

    const getCurrentPrice = () => {
        if (!product) return 0;
        const priceStr = product.retailer_price ?? product.mrp ?? product.price ?? 0;
        const price = parseFloat(priceStr);
        return Number.isFinite(price) ? price : 0;
    };

    const _handleQuantityChange = (delta) => {
        _setQuantity(prev => Math.max(1, prev + delta));
    };

    // Order functionality
    const openOrderModal = () => {
        setShowOrderModal(true);
    };

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
                                            className="w-full h-full object-cover"
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

                                {/* Stock Status */}
                                {/* <div className="flex items-center gap-2">
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
                  </div> */}

                                {/* Shipping Info */}
                                {/* <div className="mb-2">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                                        </svg>
                                        <span className="text-sm">Ships from <span className="font-bold">{product.shippedFrom}</span></span>
                                    </div>
                                </div> */}

                                {/* Badges */}
                                {/* <div className="flex flex-wrap gap-2 mt-3">
                                    <span className="bg-green-100 text-green-600 text-xs px-3 py-1 rounded-md uppercase">free shipping</span>
                                    <span className="bg-red-100 text-red-600 text-xs px-3 py-1 rounded-md uppercase">free gift</span>
                                </div> */}
                            </div>

                            {/* Size Selection */}
                            {/* <div className="mb-6 border-t border-b  py-4"> */}
                            {/* <div className="mb-4">
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
                                                <img src="https://placehold.co/32x32" alt={size.name} className="w-full h-full object-contain" />
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
                                </div> */}
                            {/* </div> */}
                            <div className="space-y-4">
                                {/* Price */}
                                <div>
                                    <div className="text-xl font-extrabold text-zinc-800">BDT {getCurrentPrice().toLocaleString('en-US')} TK</div>
                                </div>

                                {/* Quantity */}
                                {/* <div className="flex items-center gap-2">
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
                                </div> */}

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
                                            onClick={handleDirectOrder}
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
                                        <button className="w-full cursor-pointer py-3 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700">
                                            BUY NOW
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
                                    <div className="mt-6">
                                        <div
                                            className="[&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-gray-400 [&_td]:p-2 [&_th]:border [&_th]:border-gray-400 [&_th]:p-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-4 [&_p]:mb-2"
                                            dangerouslySetInnerHTML={{ __html: product.description }}
                                        />
                                    </div>
                                )}


                                {/* Security & Logistics */}
                                {/* <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-stone-500">Secured transaction</span>
                                        <div className="w-4 h-4 text-green-700">✓</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-zinc-800 mb-2">Our Top Logistics Partners</div>
                                        <div className="flex gap-3">
                                            <div className="w-14 h-8 border border-black rounded"></div>
                                            <div className="w-14 h-8 border border-black rounded"></div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-semibold text-green-700">Fastest cross-border delivery</div>
                                </div> */}
                            </div>


                        </div>

                        {/* Purchase Section */}
                        {/* 
                        
                        <div className="w-full lg:w-80 bg-slate-100 p-6">
                            <div className="space-y-4">
                               
                                <div>
                                    <div className="text-xl font-extrabold text-zinc-800">BDT {getCurrentPrice()} TK</div>
                                    <div className="text-xs text-green-700 font-semibold">Order now and get it around Saturday, August 30</div>
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
                                    <button className="w-full py-3 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700">
                                        BUY NOW
                                    </button>
                                    <button className="w-full py-3 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 25 24" fill="none">
                                            <path d="M12.2305 22C17.7533 22 22.2305 17.5228 22.2305 12C22.2305 6.47715 17.7533 2 12.2305 2C6.70762 2 2.23047 6.47715 2.23047 12C2.23047 13.3789 2.50954 14.6926 3.01429 15.8877C3.29325 16.5481 3.43273 16.8784 3.45 17.128C3.46727 17.3776 3.39381 17.6521 3.24689 18.2012L2.23047 22L6.02924 20.9836C6.57835 20.8367 6.85291 20.7632 7.10249 20.7805C7.35208 20.7977 7.68232 20.9372 8.34282 21.2162C9.53792 21.7209 10.8516 22 12.2305 22Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                                            <path d="M8.81862 12.3773L9.68956 11.2956C10.0566 10.8397 10.5104 10.4153 10.546 9.80826C10.5549 9.65494 10.4471 8.96657 10.2313 7.58986C10.1465 7.04881 9.64133 7 9.20379 7C8.63361 7 8.34852 7 8.06542 7.12931C7.70761 7.29275 7.34026 7.75231 7.25964 8.13733C7.19586 8.44196 7.24326 8.65187 7.33806 9.07169C7.7407 10.8548 8.68528 12.6158 10.1499 14.0805C11.6147 15.5452 13.3757 16.4898 15.1588 16.8924C15.5786 16.9872 15.7885 17.0346 16.0932 16.9708C16.4782 16.8902 16.9377 16.5229 17.1012 16.165C17.2305 15.8819 17.2305 15.5969 17.2305 15.0267C17.2305 14.5891 17.1817 14.084 16.6406 13.9992C15.2639 13.7834 14.5756 13.6756 14.4222 13.6845C13.8152 13.7201 13.3908 14.1738 12.9349 14.5409L11.8532 15.4118" stroke="white" strokeWidth="1.5" />
                                        </svg>
                                        WhatsApp
                                    </button>
                                    <div className="text-sm font-bold text-black">If you want to know more about the product</div>
                                    <button className="w-full py-3 bg-zinc-800 text-white text-sm font-bold rounded hover:bg-zinc-900">
                                        VIEW IN STORE
                                    </button>
                                </div>

                       
                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-stone-500">Secured transaction</span>
                                        <div className="w-4 h-4 text-green-700">✓</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-zinc-800 mb-2">Our Top Logistics Partners</div>
                                        <div className="flex gap-3">
                                            <div className="w-14 h-8 border border-black rounded"></div>
                                            <div className="w-14 h-8 border border-black rounded"></div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-semibold text-green-700">Fastest cross-border delivery</div>
                                </div>
                            </div>
                        </div>
 */}


                    </div>
                </div>

                {/* Specification and Summary */}
                <div className="bg-white rounded-lg shadow p-6 mt-8">
                    <h2 className="text-xl font-semibold text-zinc-800 mb-4">Specification</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <SpecRow label="Title" value={product.name} />
                        <SpecRow label="Brand" value={product.brand} />
                        <SpecRow label="Country of Origin" value="Bangladesh" />
                        <SpecRow label="Volume" value={product.volume || '—'} />
                        <SpecRow label="Scent" value="—" />
                        <SpecRow label="Product name" value={product.name} />
                        <SpecRow label="Product Code" value="—" />
                        <SpecRow label="How To Use" value="—" />
                        <SpecRow label="Benefits" value="—" />
                        <SpecRow label="Brand Origin" value="Bangladesh" />
                        <SpecRow label="Feature" value="—" />
                    </div>

                    <h2 className="text-xl font-semibold text-zinc-800 mt-8 mb-2">Summary</h2>
                    <p className="text-sm text-gray-700">{product.name} by {product.brand}. Volume: {product.volume || '—'}. Ships from {product.shippedFrom}. Price: {getCurrentPrice()} TK.</p>
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
