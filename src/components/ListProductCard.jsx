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
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
        {/* Top section on mobile, left section on desktop */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Product Image */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex-shrink-0">
            <img src={image} alt={name} className="w-full h-full object-cover rounded-lg" />
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 leading-tight truncate">{name}</h3>
            {(brand || category) && (
              <div className="flex items-center gap-2 text-left mt-0.5">
                {brand && <span className="text-[11px] tracking-wide uppercase text-gray-500 font-medium">{brand}</span>}
                {brand && category && <span className="text-gray-300">•</span>}
                {category && <span className="text-[11px] text-gray-400">{category}</span>}
              </div>
            )}
            {/* Price on mobile - show here */}
            <div className="mt-2 sm:hidden">
              <span className="text-lg font-bold text-green-600">৳{price}</span>
            </div>
          </div>
        </div>

        {/* Bottom section on mobile, right section on desktop */}
        <div className="flex flex-col sm:flex-col sm:items-end gap-2 sm:gap-2">
          {/* Price on desktop - show here */}
          <span className="hidden sm:block text-lg sm:text-xl font-bold text-green-600 whitespace-nowrap">৳{price}</span>
          <div className="flex gap-2 w-full sm:w-auto">
            <Link 
              to={`/product/${id}`}
              className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-full border border-green-600 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-black/5 transition-colors shadow-sm"
            >
              View Details
            </Link>
            {onOrder && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onOrder(productData);
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors shadow-sm"
              >
                Buy now
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link to={`/product/${id}`} className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
      {/* Top section on mobile, left section on desktop */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Product Image */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex-shrink-0">
          <img src={image} alt={name} className="w-full h-full object-cover rounded-lg" />
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 leading-tight truncate">{name}</h3>
          {(brand || category) && (
            <div className="flex items-center gap-2 text-left mt-0.5">
              {brand && <span className="text-[11px] tracking-wide uppercase text-gray-500 font-medium">{brand}</span>}
              {brand && category && <span className="text-gray-300">•</span>}
              {category && <span className="text-[11px] text-gray-400">{category}</span>}
            </div>
          )}
          {/* Price on mobile - show here */}
          <div className="mt-2 sm:hidden">
            <span className="text-lg font-bold text-green-600">৳{price}</span>
          </div>
        </div>
      </div>

      {/* Bottom section on mobile, right section on desktop */}
      <div className="flex flex-col sm:items-end">
        {/* Price on desktop - show here */}
        <span className="hidden sm:block text-lg sm:text-xl font-bold text-green-600 whitespace-nowrap">৳{price}</span>
        <span className="mt-1 w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-black bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-black/5 transition-colors shadow-sm">View Details</span>
      </div>
    </Link>
  );
}
