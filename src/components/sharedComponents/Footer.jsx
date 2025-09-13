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
            <div className="mt-4 flex items-center gap-2">
              <a href="#" aria-label="Facebook" className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-green-600"><path d="M13 10h3V7h-3V5.5A1.5 1.5 0 0 1 14.5 4H16V1h-1.5A4.5 4.5 0 0 0 10 5.5V7H8v3h2v10h3V10z"/></svg>
              </a>
              <a href="#" aria-label="Twitter" className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-green-600"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.27 4.27 0 0 0 1.87-2.35 8.49 8.49 0 0 1-2.7 1.03 4.24 4.24 0 0 0-7.23 3.87A12.03 12.03 0 0 1 3.15 4.9a4.24 4.24 0 0 0 1.31 5.66 4.2 4.2 0 0 1-1.92-.53v.05a4.25 4.25 0 0 0 3.4 4.16c-.47.13-.96.2-1.47.2-.36 0-.71-.03-1.05-.1a4.26 4.26 0 0 0 3.96 2.95A8.5 8.5 0 0 1 2 19.54 12 12 0 0 0 8.29 21c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.35-.02-.53A8.33 8.33 0 0 0 22.46 6z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-green-600"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5zm5.75-2.75a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="mt-3 space-y-2 text-gray-700">
              <li><Link to="/about" className="hover:text-green-600">About us</Link></li>
              <li><Link to="/product" className="hover:text-green-600">Our Services</Link></li>
              <li><Link to="#" className="hover:text-green-600">Request a Quote</Link></li>
              <li><Link to="#" className="hover:text-green-600">Our Policy</Link></li>
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
          {settings?.contact_phone && (
            <div className="mt-1 text-sm text-gray-600">Contact: {settings.contact_phone}</div>
          )}
          {settings?.address && (
            <div className="mt-1 text-sm text-gray-600">Address: {settings.address}</div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;