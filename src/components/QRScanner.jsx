import React, { useState, useEffect } from 'react';
import BarcodeScanner from "react-qr-barcode-scanner";
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const QRScanner = ({ onClose, isOpen }) => {
    const [stopStream, setStopStream] = useState(false);
    const navigate = useNavigate();

    // Handle scan result
    const handleUpdate = (err, result) => {
        if (result) {
            const scannedText = result.text;
            console.log('QR Scanned:', scannedText);
            
            // Process the scanned result
            handleScannedResult(scannedText);
        }
        if (err && err.name !== 'NotFoundException') {
            console.error('Scanner error:', err);
            // Don't show errors for "not found" - too noisy
        }
    };

    // Handle different types of scanned results
    const handleScannedResult = (text) => {
        if (!text || typeof text !== 'string') {
            toast.error('No readable QR content');
            return;
        }

        const trimmed = text.trim();
        
        // Check if it's a full HTTP URL
        const isHttpUrl = /^https?:\/\//i.test(trimmed);
        
        if (isHttpUrl) {
            try {
                const url = new URL(trimmed);
                // Check if it's a shop URL in our domain
                const shopMatch = url.pathname.match(/^\/shops\/(\d+)/);
                
                if (shopMatch) {
                    // Close scanner and navigate to shop
                    closeScanner();
                    navigate(`/shops/${shopMatch[1]}`);
                    return;
                } else {
                    // External URL - redirect directly
                    closeScanner();
                    window.location.href = url.toString();
                    return;
                }
            } catch {
                // Invalid URL, try as relative path
                console.warn('Invalid URL format, trying as relative path');
            }
        }

        // Check if it's a relative shop path
        if (trimmed.startsWith('/shops/')) {
            closeScanner();
            navigate(trimmed);
            return;
        }

        // Try to extract shop ID from text
        const shopIdMatch = trimmed.match(/shops?\/(\d+)/i);
        if (shopIdMatch) {
            closeScanner();
            navigate(`/shops/${shopIdMatch[1]}`);
            return;
        }

        // If no valid shop pattern found
        toast.error('Scanned code is not a valid shop link');
    };

    // Handle scanner errors (camera permissions, etc.)
    const handleError = (error) => {
        console.error('Scanner setup error:', error);
        if (error.name === "NotAllowedError") {
            toast.error('Camera permission denied. Please allow camera access and try again.');
        } else if (error.name === "NotFoundError") {
            toast.error('No camera found on this device.');
        } else {
            toast.error('Failed to access camera. Please try again.');
        }
    };

    // Close scanner properly to prevent freezing
    const closeScanner = React.useCallback(() => {
        setStopStream(true);
        setTimeout(() => {
            onClose();
        }, 100); // Small delay to ensure stream stops
    }, [onClose]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                closeScanner();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isOpen, closeScanner]);

    // Reset stopStream when opening
    useEffect(() => {
        if (isOpen) {
            setStopStream(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Scan QR Code
                    </h3>
                    <button
                        onClick={closeScanner}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close scanner"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scanner */}
                <div className="p-4">
                    <div className="relative">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <BarcodeScanner
                                width="100%"
                                height="100%"
                                onUpdate={handleUpdate}
                                onError={handleError}
                                stopStream={stopStream}
                                facingMode="environment" // Use back camera
                                delay={300} // Scan every 300ms
                            />
                        </div>
                        
                        {/* Overlay guide */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="w-48 h-48 border-2 border-white rounded-lg shadow-lg">
                                    <div className="w-full h-full relative">
                                        {/* Corner markers */}
                                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500"></div>
                                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500"></div>
                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500"></div>
                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 text-center mt-4">
                        Point your camera at a shop QR code
                    </p>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 rounded-b-lg">
                    <button
                        onClick={closeScanner}
                        className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QRScanner;