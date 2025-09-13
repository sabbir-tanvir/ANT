import React, { useEffect, useState } from 'react';
import ProductCard from '../components/productCard.jsx';
import { fetchProducts, getCachedProducts } from '../api/products.js';

function Home2() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    // Show cached instantly if available
    const cached = getCachedProducts(5);
    if (cached) {
      setProducts(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    fetchProducts(5).then(list => {
      if (!mounted) return;
      setProducts(list);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <section className="min-h-[80vh] py-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Shop Owner Dashboard Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8 mb-8 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Welcome to Shop Owner Dashboard
          </h1>
          <p className="text-lg opacity-90">
            Manage your shop, products, and orders from your personalized dashboard
          </p>
        </div>

        {/* Quick Stats Cards */}


        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Add Product</span>
            </button>

            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">View Orders History</span>
            </button>

            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Shop Settings</span>
            </button>


          </div>
        </div>
        <div className="mt-20 mb-20">
          {loading ? (
            <div className="text-sm text-gray-500">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-sm text-gray-500">No products found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  imageSrc={p.image || '/api/placeholder/300/300'}
                  name={p.name}
                  price={parseFloat(p.price) || 0}
                  to={`/product/${p.id}`}
                  compact
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#ORD-001</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">John Doe</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Wireless Headphones</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">৳2,500</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sep 08, 2025</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#ORD-002</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jane Smith</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Smart Watch</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">৳4,200</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sep 09, 2025</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#ORD-003</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mike Johnson</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Bluetooth Speaker</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">৳1,800</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Processing
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sep 09, 2025</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Home2;