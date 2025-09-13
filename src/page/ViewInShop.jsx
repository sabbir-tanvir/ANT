import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Api_Base_Url } from '../config/api';

// Lightweight card specifically for shop-product listing with shop name
function ShopProductCard({ item }) {
  return (
    <div className="w-full max-w-[300px] bg-white rounded-2xl shadow-[0_4px_18px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col mx-auto">
      <div className="relative h-48 bg-gray-50 flex items-center justify-center">
        <img
          src={item.image || 'https://placehold.co/300'}
          alt={item.name}
          className="w-auto h-full object-contain"
          onError={(e)=>{e.currentTarget.src='https://placehold.co/300';}}
          loading="lazy"
        />
        {item.stock === false && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-semibold px-2 py-1 rounded">OUT</span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2" title={item.name}>{item.name}</h3>
        <div className="text-xs text-gray-500">{item.category || '—'}</div>
        <div className="text-sm font-bold text-green-600">৳{parseFloat(item.price || 0)}</div>
        <div className="text-[11px] font-medium text-gray-700 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>{item.shop_name}</span>
        </div>
        <Link
          to={`/shop-products/${item.id}`}
          className="mt-1 w-full inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors shadow-sm"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

export default function ViewInShop() {
  const { id } = useParams(); // base product id
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    axios
      .get(`${Api_Base_Url}/api/shop-products/?product=${id}`)
      .then((res) => {
        console.log('ViewInShop API Response:', res.data);
        
        // Handle paginated response structure
        let shopProducts = [];
        if (res.data && res.data.results) {
          // Paginated response: {count, next, previous, results}
          shopProducts = res.data.results;
        } else if (Array.isArray(res.data)) {
          // Direct array response (fallback)
          shopProducts = res.data;
        } else {
          shopProducts = [];
        }
        
        setItems(shopProducts);
      })
      .catch((err) => {
        console.error('ViewInShop fetch error:', err);
        setError('Failed to load shop products');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <section className="py-6 px-4 md:px-6 bg-gray-50 min-h-[70vh]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Shops Offering This Product</h1>
          <Link to={-1} className="text-sm text-green-600 font-semibold hover:underline">Back</Link>
        </div>

        {loading && (
          <div className="text-sm text-gray-500">Loading shop listings...</div>
        )}
        {error && !loading && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">{error}</div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="text-sm text-gray-500">No shop listings found for this product.</div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {items.map((item) => (
            <ShopProductCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
