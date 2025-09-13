import React from 'react';
import { Link } from 'react-router-dom';

// ProductCard component
// Props:
// - imageSrc: string
// - name: string (product name)  
// - price: number
// - to?: string (link to details)
// - onView?: () => void (optional click handler if no link)
// - compact?: boolean (default false)
// - showOrderButton?: boolean (show order button for shop owners)
// - onOrder?: (product) => void (order button handler)
// - product?: object (product data for order functionality)
export default function ProductCard({
  imageSrc = 'https://placehold.co/160x120',
  name = 'Product name',
  price = 0,
  brand,
  category,
  to,
  onView,
  compact = false,
  showOrderButton = false,
  onOrder,
  product,
}) {
  return (
    <div className={
      compact
        ? 'w-full max-w-[300px] bg-white rounded-xl shadow-[0_4px_18px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col mx-auto'
        : 'w-full max-w-[300px] bg-white rounded-2xl shadow-[0_4px_18px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col mx-auto'
    }>
      {/* Image Section - Takes 2/3 of the space */}
      <div className={compact ? 'relative h-56 bg-gray-50 flex items-center justify-center' : 'relative h-64 bg-gray-50 flex items-center justify-center'}>
        <img
          src={imageSrc}
          alt={name}
          className="w-auto h-full object-contain"
          loading="lazy"
          onError={(e) => {
            e.target.src = '/api/placeholder/300/300';
          }}
        />
      </div>

      {/* Content Section - Takes 1/3 of the space */}
      <div className={compact ? 'p-3 flex flex-col gap-2' : 'p-4 flex flex-col gap-3'}>
        {/* Title + Price row */}
        <div className="flex items-start justify-between gap-3">
          <h3
            className={compact ? 'flex-1 text-sm font-semibold text-gray-900 leading-tight text-left' : 'flex-1 text-base font-semibold text-gray-900 leading-tight text-left'}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={name}
          >
            {name}
          </h3>
          <div className={compact ? 'text-lg font-bold text-green-600 whitespace-nowrap' : 'text-xl font-bold text-green-600 whitespace-nowrap'}>
            ৳{price}
          </div>
        </div>

        {(brand || category) && (
          <div className="flex items-center gap-2 text-left">
            {brand && <span className="text-[11px] tracking-wide uppercase text-gray-500 font-medium">{brand}</span>}
            {brand && category && <span className="text-gray-300">•</span>}
            {category && <span className="text-[11px] text-gray-400">{category}</span>}
          </div>
        )}

  {/* View Button */}
  <div className="mt-2 flex flex-col md:flex-row gap-3">
          {/* View Details button (outlined white) */}
          {to ? (
            <Link
              to={to}
              className={
                compact
                  ? 'w-full md:flex-1 inline-flex items-center justify-center rounded-full border border-green-600 bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-black/5 transition-colors shadow-sm'
                  : 'w-full md:flex-1 inline-flex items-center justify-center rounded-full border border-green-600 bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-black/5 transition-colors shadow-sm'
              }
              aria-label={`View ${name}`}
            >
              View Details
            </Link>
          ) : (
            <button
              type="button"
              onClick={onView}
              className={
                compact
                  ? 'w-full md:flex-1 inline-flex items-center justify-center rounded-full border border-green-600 bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-black/5 transition-colors shadow-sm'
                  : 'w-full md:flex-1 inline-flex items-center justify-center rounded-full border border-green-600 bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-black/5 transition-colors shadow-sm'
              }
              aria-label={`View ${name}`}
            >
              View Details
            </button>
          )}

          {/* Buy now button (solid black) for shop owners */}
          {showOrderButton && onOrder && (
            <button
              type="button"
              onClick={() => onOrder(product || { id: Date.now(), name, price, brand, category, image: imageSrc })}
              className={
                compact
                  ? 'w-full md:flex-1 inline-flex items-center justify-center rounded-full bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors shadow-sm'
                  : 'w-full md:flex-1 inline-flex items-center justify-center rounded-full bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-colors shadow-sm'
              }
              aria-label={`Order ${name}`}
            >
              Buy now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}