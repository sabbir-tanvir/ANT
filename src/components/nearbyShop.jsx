import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Api_Base_Url } from '../config/api';

export default function NearbyShop() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    axios
      .get(`${Api_Base_Url}/api/shops/`)
      .then((res) => {
        if (!mounted) return;
        
        // Handle both direct array and paginated response
        let shopList = [];
        if (res.data && res.data.results) {
          // Paginated response
          shopList = res.data.results;
        } else if (Array.isArray(res.data)) {
          // Direct array response
          shopList = res.data;
        }
        
        // Show only first 4 shops
        setShops(shopList.slice(0, 4));
      })
      .catch((error) => {
        console.error('Error fetching shops:', error);
        setShops([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold uppercase tracking-wide">Your Nearby Shops</h3>
          <Link to="/shops" className="rounded-full border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50">View all</Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : shops.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {shops.map((shop) => (
              <article key={shop.id} className="flex flex-col gap-3 group">
                <div className="overflow-hidden rounded-xl bg-gray-100">
                  <img 
                    src={shop.shop_image || '/api/placeholder/300/200'} 
                    alt={shop.name} 
                    className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/300/200';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-gray-900 mb-1">{shop.name}</h4>
                  <p className="text-sm text-gray-500 mb-2">{shop.address}</p>
                  <p className="text-xs text-gray-400">
                    {[shop.upazila_name, shop.district_name, shop.division_name].filter(Boolean).join(', ')}
                  </p>
                  {shop.owner_phone && (
                    <p className="text-xs text-green-600 mt-1">📞 {shop.owner_phone}</p>
                  )}
                </div>
                <div>
                  <Link 
                    to={`/shops/${shop.id}`} 
                    className="inline-block rounded-md border border-green-600 px-4 py-2 text-xs font-medium uppercase text-green-600 hover:bg-green-50 transition-colors w-full text-center"
                  >
                    Visit Shop
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500">No shops available at the moment</p>
          </div>
        )}
      </div>
    </section>
  );
}