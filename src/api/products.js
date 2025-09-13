// Simple in-memory products cache to speed up repeated loads (Hero, Home2, etc.)
// Provides fetchProducts(limit) returning cached data if present + fresh in background when stale.

import axios from 'axios';
import { Api_Base_Url } from '../config/api.js';

let _cache = { time: 0, data: null, promise: null };
const TTL_MS = 60 * 1000; // 1 minute cache

export async function fetchProducts(limit = 5, force = false) {
  const now = Date.now();
  const isFresh = _cache.data && (now - _cache.time < TTL_MS) && !force;
  if (isFresh && Array.isArray(_cache.data)) {
    return _cache.data.slice(0, limit);
  }
  if (_cache.promise && !force) {
    // A request is already in flight; wait for it then slice
    const data = await _cache.promise;
    return Array.isArray(data) ? data.slice(0, limit) : [];
  }

  const request = axios
    .get(`${Api_Base_Url}/api/products/`)
    .then((res) => {
      let list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
          ? res.data.results
          : [];
      _cache = { time: Date.now(), data: list, promise: null };
      return list;
    })
    .catch((err) => {
      console.warn('fetchProducts error:', err);
      if (!_cache.data) _cache = { time: 0, data: [], promise: null };
      return _cache.data || [];
    });

  _cache.promise = request;
  const result = await request;
  return Array.isArray(result) ? result.slice(0, limit) : [];
}

export function invalidateProductsCache() {
  _cache = { time: 0, data: null, promise: null };
}

export function getCachedProducts(limit = 5) {
  if (Array.isArray(_cache.data)) return _cache.data.slice(0, limit);
  return null;
}
