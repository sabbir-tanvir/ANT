import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getCurrentUser, isAuthenticated, logout } from '../../utils/auth.js';
import { useSiteSettings } from '../../config/sitesetting.js';

function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const settings = useSiteSettings();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const profileRef = useRef(null);

  const resolveAsset = (url, fallback) => {
    if (!url) return fallback;
    if (/^https?:/i.test(url)) return url;
    return `${window._env_?.BASE_URL || ''}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    const checkUserStatus = () => {
      if (isAuthenticated()) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    };

    checkUserStatus();
    window.addEventListener('storage', checkUserStatus);
    window.addEventListener('userStatusChanged', checkUserStatus);
    return () => {
      window.removeEventListener('storage', checkUserStatus);
      window.removeEventListener('userStatusChanged', checkUserStatus);
    };
  }, []);

  // Lock body scroll when menu open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close menu on click outside or scroll
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleScroll = () => {
      setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  // Close profile dropdown on click outside or scroll
  useEffect(() => {
    if (!profileOpen) return;

    const handleClickOutsideProfile = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    const handleScrollProfile = () => {
      setProfileOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutsideProfile);
    window.addEventListener('scroll', handleScrollProfile, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideProfile);
      window.removeEventListener('scroll', handleScrollProfile, true);
    };
  }, [profileOpen]);

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/');
  };

  const getNavItems = () => {
    const baseItems = [
      { label: 'Training', to: '/training' },
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
    ];

    if (!user) {
      return [
        { label: 'Home', to: '/' },
        { label: 'Product', to: '/product' },
        { label: 'Shops', to: '/shops' },
        ...baseItems
      ];
    }

    if (user.role === 'shop_owner') {
      return [
        { label: 'Home', to: '/' },
        { label: 'Product', to: '/product' },
        { label: 'Recharge', to: '/recharge' },
        { label: 'My Shop', to: '/myshop' },
        ...baseItems
      ];
    }

    return [
      { label: 'Home', to: '/' },
      { label: 'Product', to: '/product' },
      { label: 'Shops', to: '/shops' },
      ...baseItems
    ];
  };

  const navItems = getNavItems();
  const baseLink = 'text-base font-semibold leading-tight transition-colors';
  const inactive = 'text-zinc-900 hover:text-green-600';
  const active = 'text-green-600';

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur border-b border-gray-200">
      <nav className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between relative">
          {/* Hamburger button (left) */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
            onClick={() => { setOpen((v) => !v); setProfileOpen(false); }}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
          >
            {open ? (
              // X icon
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>

          {/* Logo (center on mobile) */}
          <Link to="/" className="absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none flex items-center gap-2">
            <img
              className="w-10 h-10 rounded object-contain bg-transparent"
              src={resolveAsset(settings?.logo, '/ant.png')}
              alt="ANT logo"
              onError={(e) => { e.currentTarget.src = '/ant.png'; }}
            />
            <span className="sr-only">ANT</span>
          </Link>

          {/* Profile / Login (right) */}
          <div className="md:hidden flex items-center">
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center focus:ring-2 focus:ring-green-600"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-50">
                    <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">Profile</Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-100">Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                Log in / Register
              </Link>
            )}
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10 ml-auto">
            <ul className="flex items-center gap-7">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => `${baseLink} ${isActive ? active : inactive}`}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center focus:ring-2 focus:ring-green-600"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-50">
                    <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">Profile</Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-100">Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                Log in / Register
              </Link>
            )}
          </div>
        </div>

        {/* Mobile overlay menu - starts below the navbar (top-16) so header stays interactive */}
        {open && (
          <div className="md:hidden">
            {/* backdrop - closes on click */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            {/* sliding panel */}
            <aside
              ref={menuRef}
              className="fixed top-12 left-0 bottom-0 w-64 p-4 z-50 transform transition-transform duration-300 ease-in-out translate-x-0"
              onClick={(e) => e.stopPropagation()}
            >
           
            <nav>
              <ul className="flex bg-white p-2 rounded-2xl flex-col gap-2">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) => `block rounded px-3 py-2 ${baseLink} ${isActive ? active : inactive}`}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}

                <li className="mt-2">
                  {user ? (
                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-green-600 bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span>Profile - {user?.name || user?.phone || 'User'}</span>
                    </Link>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setOpen(false)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      <span>Log in / Register</span>
                    </Link>
                  )}
                </li>

              </ul>
            </nav>
          </aside>
        </div>
        )}

      </nav>
    </header>
  );
}

export default Navbar;
