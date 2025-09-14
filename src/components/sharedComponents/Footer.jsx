import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../config/sitesetting.js';

const Footer = () => {
  const settings = useSiteSettings();

  const resolveAsset = (url, fallback) => {
    if (!url) return fallback;
    if (/^https?:/i.test(url)) return url;
    return `${window._env_?.BASE_URL || ''}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <footer className="bg-white ">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <img src={resolveAsset(settings?.logo, '/ant.png')} alt="ANT" className="h-12 w-12 rounded object-contain" onError={(e)=>{e.currentTarget.src='/ant.png';}} />
            </div>
            <p className="mt-4 text-gray-700">
              {settings?.footer_short_description || 'ANT enhances your customer service, sales, and marketing efforts with intuitive features that anyone can use.'}
            </p>

          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="mt-3 space-y-2 text-gray-700">
              <li><Link to="/product" className="hover:text-green-600">Products</Link></li>
              <li><Link to="/shops" className="hover:text-green-600">Shops</Link></li>
              <li><Link to="/about" className="hover:text-green-600">About us</Link></li>
              <li><Link to="/contact" className="hover:text-green-600">Contact</Link></li>
            </ul>
          </div>

          {/* Shops */}
          <div>
            <h4 className="text-lg font-semibold">Shops</h4>
            <ul className="mt-3 space-y-2 text-gray-700">
              <li><Link to="/shops" className="hover:text-green-600">Machine center</Link></li>
              <li><Link to="/shops" className="hover:text-green-600">BD Shops</Link></li>
              <li><Link to="/shops" className="hover:text-green-600">USA</Link></li>
              <li><Link to="/shops" className="hover:text-green-600">Dhaka</Link></li>
            </ul>
          </div>

          {/* Follow us */}
          <div>
            <h4 className="text-lg font-semibold">Follow us</h4>
            <ul className="mt-3 space-y-2 text-gray-700">
              <li><a href="#" className="hover:text-green-600">Facebook</a></li>
              <li><a href="#" className="hover:text-green-600">Twitter</a></li>
              <li><a href="#" className="hover:text-green-600">WhatsApp</a></li>
              <li><a href="#" className="hover:text-green-600">Instagram</a></li>
            </ul>
          </div>
        </div>

        <hr className="my-8 border-neutral-500" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-700 text-sm">
          <p>© {settings?.copyright_text || 'ant.com. All rights reserved.'}</p>
          <div className="flex items-center gap-6">
            <Link to="#" className="hover:text-green-600">Terms & conditions</Link>
            <Link to="#" className="hover:text-green-600">Privacy policy</Link>
          </div>
        </div>

        {/* Bengali credit line */}
        <div className="mt-3 w-full text-center text-black text-lg font-normal font-['Hind_Siliguri']">
          প্রযুক্তিক সহযোগিতায়: GenzSoft.Cloud
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;