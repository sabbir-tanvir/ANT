import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductCard from '../components/productCard.jsx';
import ListProductCard from '../components/ListProductCard.jsx';
import { Api_Base_Url } from '../config/api.js';
import { getCurrentUser } from '../utils/auth.js';

export default function Training() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [view, setView] = useState("grid"); // "grid" or "list"
  const [itemsToShow, setItemsToShow] = useState(20); // for load more
  const [loading, setLoading] = useState(true);

  // Order functionality states
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

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

    // Fetch products with training category
    // We'll search for 'training' and filter results on frontend as well for better accuracy
    const searchQuery = debouncedSearchTerm.trim() 
      ? `training ${debouncedSearchTerm.trim()}`
      : 'training';
      
    const apiUrl = `${Api_Base_Url}/api/products/?search=${encodeURIComponent(searchQuery)}`;
      
    axios.get(apiUrl)
      .then(res => {
        if (!mounted) return;
        const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.results) ? res.data.results : []);
        console.log('Training API Response:', res.data);

        // Filter for training-related products and normalize price
        const trainingProducts = list
          .filter(p => {
            const category = (p.category || '').toLowerCase();
            const name = (p.name || '').toLowerCase();
            const description = (p.description || '').toLowerCase();
            
            // Check if product is training-related
            return category.includes('training') || 
                   name.includes('training') ||
                   description.includes('training') ||
                   category.includes('course') ||
                   name.includes('course') ||
                   category.includes('education') ||
                   name.includes('education');
          })
          .map(p => ({
            ...p,
            price: typeof p.price === 'string' ? parseFloat(p.price) : p.price
          }));

        setProducts(trainingProducts);
        setFilteredProducts(trainingProducts);
      })
      .catch(err => {
        console.error('Training products API error:', err);
        if (mounted) {
          setProducts([]);
          setFilteredProducts([]);
          toast.error('Failed to load training products');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [debouncedSearchTerm]);

  // Apply local search filter if user types in search box
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = products.filter(p => 
      (p.name || '').toLowerCase().includes(searchLower) ||
      (p.description || '').toLowerCase().includes(searchLower) ||
      (p.category || '').toLowerCase().includes(searchLower) ||
      (p.brand || '').toLowerCase().includes(searchLower)
    );
    
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleOrder = (product) => {
    if (!currentUser || currentUser.role !== 'shop_owner') {
      toast.error('Only shop owners can place orders');
      return;
    }
    setSelectedProduct(product);
    setOrderQuantity(1);
    setShowOrderModal(true);
  };

  const submitOrder = async () => {
    if (!selectedProduct || !currentUser) return;
    
    setOrderLoading(true);
    try {
      const orderData = {
        product_id: selectedProduct.id,
        quantity: orderQuantity,
        total_price: selectedProduct.price * orderQuantity
      };

      await axios.post(`${Api_Base_Url}/api/orders/`, orderData, {
        headers: {
          'Authorization': `Bearer ${currentUser.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      toast.success(`Order placed for ${selectedProduct.name}`);
      setShowOrderModal(false);
      setSelectedProduct(null);
      setOrderQuantity(1);
    } catch (error) {
      console.error('Order error:', error);
      const message = error.response?.data?.detail || error.response?.data?.message || 'Failed to place order';
      toast.error(message);
    } finally {
      setOrderLoading(false);
    }
  };

  const visibleProducts = filteredProducts.slice(0, itemsToShow);
  const hasMore = filteredProducts.length > itemsToShow;

  return (
    <section className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <div className="mb-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Training & Education
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-gray-600 max-w-3xl mx-auto">
              Enhance your skills with our comprehensive training programs and professional development courses
            </p>

          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Stats & Controls Bar */}
        <div className=" rounded-xl   p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Training Courses</h2>
              <p className="text-gray-600 flex items-center gap-2">
                {loading ? (
                  <>
                    <div className="animate-pulse h-4 w-4 bg-gray-300 rounded"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-sm font-semibold">
                      {filteredProducts.length}
                    </span>
                    <span>{filteredProducts.length} course{filteredProducts.length !== 1 ? 's' : ''} available</span>
                  </>
                )}
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex bg-gray-100 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <button
                  onClick={() => setView("grid")}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    view === "grid" 
                      ? "bg-green-600 text-white shadow-sm" 
                      : "text-gray-700 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    view === "list" 
                      ? "bg-green-600 text-white shadow-sm" 
                      : "text-gray-700 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading training courses...</p>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="mx-auto w-24 h-24 mb-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-full flex items-center justify-center border-2 border-gray-200">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No training courses found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm ? `No courses match "${searchTerm}". Try different keywords or browse all available courses.` : 'No training courses are currently available. Please check back later.'}
            </p>
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
          </div>
        )}

        {/* Products Grid/List */}
        {!loading && visibleProducts.length > 0 && (
          <>
            {view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    imageSrc={product.image || product.product_image}
                    name={product.name}
                    price={product.price || 0}
                    brand={product.brand}
                    category={product.category}
                    to={`/product/${product.id}`}
                    onOrder={handleOrder}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {visibleProducts.map((product) => (
                  <ListProductCard
                    key={product.id}
                    imageSrc={product.image || product.product_image}
                    name={product.name}
                    price={product.price || 0}
                    brand={product.brand}
                    category={product.category}
                    description={product.description}
                    to={`/product/${product.id}`}
                    onOrder={handleOrder}
                    product={product}
                  />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={() => setItemsToShow(prev => prev + 20)}
                  className="inline-flex items-center px-8 py-3 bg-white border-2 border-gray-200 rounded-full shadow-sm text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-green-300 hover:shadow-md transition-all duration-200"
                >
                  Load More Courses
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>


    </section>
  );
}
