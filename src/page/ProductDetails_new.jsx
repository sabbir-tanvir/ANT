import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

export default function ProductDetails() {
    const [product, setProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState('Big size');
    const [selectedVolume, setSelectedVolume] = useState('800ml');
    const [quantity, setQuantity] = useState(1);
    const params = useParams();

    // Mock product images for image navigation
    const productImages = [
        'https://placehold.co/151x348',
        'https://placehold.co/32x74',
        'https://placehold.co/32x74',
        'https://placehold.co/32x74',
        'https://placehold.co/32x74'
    ];

    const sizeOptions = [
        { name: 'Big size', price: 150 },
        { name: 'Medium size', price: 200 },
        { name: 'Small size', price: 250 }
    ];

    const volumeOptions = ['1000ml', '800ml', '500ml', '250ml'];

    useEffect(() => {
        const idFromRoute = Number.parseInt(params.id, 10);
        const targetId = Number.isFinite(idFromRoute) ? idFromRoute : 1;
        axios.get('/data.json').then((res) => {
            const list = res.data?.products || [];
            const foundProduct = list.find((p) => p.id === targetId) || null;
            setProduct(foundProduct);
            if (foundProduct?.image) {
                productImages[0] = foundProduct.image;
            }
        });
    }, [params.id]);

    if (!product) {
        return (
            <section className="min-h-[60vh] flex items-center justify-center">
                <div className="text-gray-500 text-sm">Loading product…</div>
            </section>
        );
    }

    const getCurrentPrice = () => {
        const size = sizeOptions.find(s => s.name === selectedSize);
        return size ? size.price : product.price;
    };

    const handleQuantityChange = (delta) => {
        setQuantity(prev => Math.max(1, prev + delta));
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
                                        src={productImages[selectedImage] || product.image} 
                                        alt={product.name}
                                        className="max-w-full max-h-full object-contain"
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
                                        className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 border-2 rounded overflow-hidden ${
                                            selectedImage === index ? 'border-green-600' : 'border-gray-300'
                                        }`}
                                    >
                                        <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right side - Product Info */}
                        <div className="w-full lg:w-1/2 p-4 md:p-6">
                            {/* Product Title & Brand */}
                            <div className="mb-4">
                                <h1 className="text-xl md:text-2xl font-medium text-black mb-2">{product.name}</h1>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                                    <span className="text-black">Brand: <span className="text-green-600 font-medium">{product.brand}</span></span>
                                    <span className="text-black">Category: <span className="text-green-600 font-medium">{product.category || 'Washing Liquid'}</span></span>
                                </div>
                                
                                {/* Stock & Shipping Info */}
                                <div className="flex flex-wrap items-center gap-4 mt-3">
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                        <span className="text-xs text-black">In stock</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                                        </svg>
                                        <span className="text-sm">Ships from <span className="font-bold">{product.shippedFrom}</span></span>
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <span className="bg-green-100 text-green-600 text-xs px-3 py-1 rounded-md uppercase">free shipping</span>
                                    <span className="bg-red-100 text-red-600 text-xs px-3 py-1 rounded-md uppercase">free gift</span>
                                </div>
                            </div>

                            {/* Size Selection */}
                            <div className="mb-6 border-t border-b border-stone-300 py-4">
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
                                                <img src="https://placehold.co/32x32" alt={size.name} className="w-full h-full object-contain" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-xs text-black">{size.name}</div>
                                                <div className="text-xs font-bold text-black">{size.price}TK</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Volume Selection */}
                                <div className="mt-6">
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
                            </div>

                            {/* Social Icons */}
                            <div className="flex gap-3 mb-4">
                                {['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'].map((social, index) => (
                                    <button key={social} className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300">
                                        <span className="text-sm">📱</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Purchase Section */}
                        <div className="w-full lg:w-80 bg-slate-100 p-6">
                            <div className="space-y-4">
                                {/* Price */}
                                <div>
                                    <div className="text-xl font-extrabold text-zinc-800">BDT {getCurrentPrice()} TK</div>
                                    <div className="text-xs text-green-700 font-semibold">Order now and get it around Saturday, August 30</div>
                                </div>

                                {/* Quantity */}
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

                                {/* Action Buttons */}
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
                                        CONTACT US
                                    </button>
                                </div>

                                {/* Security & Logistics */}
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
