import React from "react";
import { Link } from "react-router-dom";

export default function ListProductCard({ 
  id, 
  name, 
  brand, 
  category, 
  price, 
  image, 
  showOrderButton = false, 
  onOrder, 
  product 
}) {
  const productData = product || { id, name, brand, category, price, image };

  if (showOrderButton) {
    return (
      <div className="flex items-center gap-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
        {/* Product Image */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
          <img src={image} alt={name} className="w-full h-full object-cover rounded-lg" />
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{name}</h3>
          {brand && <p className="text-sm text-gray-500">Brand: <span className="text-gray-700 font-medium">{brand}</span></p>}
          {category && <p className="text-sm text-gray-500">Category: <span className="text-gray-700">{category}</span></p>}
        </div>

        {/* Price + Actions */}
        <div className="flex flex-col items-end gap-2">
          <span className="text-lg sm:text-xl font-bold text-green-600">৳{price}</span>
          <div className="flex gap-2">
            <Link 
              to={`/product/${id}`}
              className="px-3 py-1.5 border border-green-500 text-green-600 rounded-lg text-sm hover:bg-green-50 transition"
            >
              View
            </Link>
            {onOrder && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onOrder(productData);
                }}
                className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition"
              >
                Order
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link to={`/product/${id}`} className="flex items-center gap-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
      {/* Product Image */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
        <img src={image} alt={name} className="w-full h-full object-cover rounded-lg" />
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{name}</h3>
        {brand && <p className="text-sm text-gray-500">Brand: <span className="text-gray-700 font-medium">{brand}</span></p>}
        {category && <p className="text-sm text-gray-500">Category: <span className="text-gray-700">{category}</span></p>}
      </div>

      {/* Price + Action */}
      <div className="flex flex-col items-end">
        <span className="text-lg sm:text-xl font-bold text-green-600">৳{price}</span>
        <span className="mt-2 px-4 py-1.5 border border-green-500 text-green-600 rounded-lg text-sm">View</span>
      </div>
    </Link>
  );
}
