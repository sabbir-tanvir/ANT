import React, { useEffect, useRef, useState, useMemo } from 'react';
import axios from 'axios';
import ProductCard from './productCard.jsx';
import { Api_Base_Url } from '../config/api.js';

export default function Hero() {
  // Fallback slides if API has no banners
  const fallbackSlides = useMemo(
    () => [
      ],
    []
  );

  const [bannerImages, setBannerImages] = useState([]); // array of strings (image URLs)
  const slides = bannerImages.length ? bannerImages : fallbackSlides;
  const [idx, setIdx] = useState(0);
  const viewportRef = useRef(null);
  const [vw, setVw] = useState(0);

  useEffect(() => {
    if (!slides.length) return; // defensive
    const id = setInterval(() => setIdx((i) => (i + 1) % slides.length), 4000);
    return () => clearInterval(id);
  }, [slides.length]);

  // Measure viewport width so each slide matches it precisely
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const setWidth = () => setVw(el.clientWidth || 0);
    setWidth();

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(setWidth);
      ro.observe(el);
    } else {
      window.addEventListener('resize', setWidth);
    }

    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', setWidth);
    };
  }, []);

  const go = (dir) => {
    if (!slides.length) return;
    setIdx((i) => (dir === 'next' ? (i + 1) % slides.length : (i - 1 + slides.length) % slides.length));
  };

  // Fetch banners (only active). Falls back to full list then filters.
  useEffect(() => {
    let cancelled = false;

    const normalizeUrl = (u) => {
      if (!u) return null;
      if (/^https?:/i.test(u)) return u;
      // ensure single slash join
      return `${Api_Base_Url}${u.startsWith('/') ? u : `/${u}`}`;
    };

    const load = async () => {
      try {
        // Try active endpoint first
        const activeRes = await axios.get(`${Api_Base_Url}/api/banners/active/`);
        let list = Array.isArray(activeRes.data) ? activeRes.data : [];
        if ((!list || list.length === 0)) {
          // fallback: fetch all then filter by is_active
            try {
              const allRes = await axios.get(`${Api_Base_Url}/api/banners/`);
              const allList = Array.isArray(allRes.data) ? allRes.data : [];
              list = allList.filter(b => b && (b.is_active === true || b.is_active === 'true'));
            } catch (innerErr) {
              console.warn('Fallback banners fetch failed:', innerErr);
            }
        }
        if (cancelled) return;
        const imgs = list
          .map(b => normalizeUrl(b.image))
          .filter(Boolean);
        if (imgs.length) {
          setBannerImages(imgs);
          setIdx(0); // reset index after load
        }
      } catch (err) {
        console.warn('Active banners fetch failed, using fallback slides.', err);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []); // Api_Base_Url is static config

  const [products, setProducts] = useState([]);
  useEffect(() => {
    let mounted = true;
    axios
      .get(`${Api_Base_Url}/api/products/`)
      .then((res) => {
        console.log('API Response:', res.data);
        
        if (!mounted) return;
        // Handle direct array response or nested response
        const list = Array.isArray(res.data) 
          ? res.data.slice(0, 5) 
          : Array.isArray(res.data?.results) 
            ? res.data.results.slice(0, 5) 
            : [];
        setProducts(list);
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
        setProducts([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="bg-stone-100">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-10">
        {/* search */}
        <div className="mx-auto max-w-3xl">
          <form onSubmit={(e) => e.preventDefault()} className="flex overflow-hidden rounded-md border border-green-600">
            <input
              type="text"
              placeholder="Search anything"
              className="w-full px-4 py-3 outline-none"
            />
            <button type="submit" className="bg-green-600 px-4 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" />
              </svg>
              <span className="sr-only">Search</span>
            </button>
          </form>
        </div>

        {/* heading */}
        <div className="mt-8 text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-zinc-900 leading-tight">
            Our product
            <br />
            that
            <span className="relative inline-block align-middle ml-1">
              <img 
                src="/Vector.png" 
                alt="Background decoration" 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-auto z-0"
              />
              <span className="relative px-8 py-4 z-10">Best</span>
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-700">
            Finely processed product produce, safe guaranteed and secured investment platform.
          </p>
        </div>

        {/* slider */}
        <div className="mt-10 relative">
          <div ref={viewportRef} className="h-[340px] sm:h-[400px] md:h-[480px] lg:h-[520px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-lime-500 to-lime-200">
            <div
              className="flex h-full transition-transform duration-500"
              style={{ transform: `translateX(-${idx * vw}px)` }}
            >
              {slides.map((src, i) => (
                <div key={i} className="h-full flex-shrink-0" style={{ width: vw }}>
                  <img src={src} alt={`Slide ${i + 1}`} className="h-full w-full object-cover object-center" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
          {/* arrows */}
          <button
            type="button"
            onClick={() => go('prev')}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go('next')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
            aria-label="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* 5 product cards (no scroll) */}
        <div className="mt-20">
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
        </div>
      </div>
    </section>
  );
}