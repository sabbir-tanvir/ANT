import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Api_Base_Url } from './api.js';

let cachedSettings = null;
let inFlight = null;
const listeners = new Set();

function notify() {
	listeners.forEach((cb) => {
		try { cb(cachedSettings); } catch { /* ignore */ }
	});
}

export async function fetchSiteSettings(force = false) {
	if (cachedSettings && !force) return cachedSettings;
	if (inFlight && !force) return inFlight;
	inFlight = axios
		.get(`${Api_Base_Url}/api/business-settings/`)
		.then((res) => {
			cachedSettings = res.data || {};
			console.log('[SiteSettings] fetched', cachedSettings);
			
			// Apply favicon if available
			applyFavicon(cachedSettings?.favicon);
			notify();
			return cachedSettings;
		})
		.catch((err) => {
			console.warn('Failed to load site settings:', err);
			return (cachedSettings = {});
		})
		.finally(() => {
			inFlight = null;
		});
	return inFlight;
}

export function subscribeSiteSettings(cb) {
	if (typeof cb === 'function') {
		listeners.add(cb);
		if (cachedSettings) cb(cachedSettings);
		return () => listeners.delete(cb);
	}
	return () => {};
}

export function getCachedSiteSettings() {
	return cachedSettings;
}

function applyFavicon(faviconUrl) {
	if (!faviconUrl) return; // keep existing
	let link = document.querySelector("link[rel='icon']");
	if (!link) {
		link = document.createElement('link');
		link.rel = 'icon';
		document.head.appendChild(link);
	}
	// If relative path (no http), prefix base URL
	const finalUrl = /^(https?:)?\//.test(faviconUrl)
		? faviconUrl
		: `${Api_Base_Url}${faviconUrl.startsWith('/') ? '' : '/'}${faviconUrl}`;
	link.href = finalUrl;
}

// React hook helper (optional use)
export function useSiteSettings() {
	const [settings, setSettings] = useState(() => getCachedSiteSettings());
	useEffect(() => {
		const unsub = subscribeSiteSettings(setSettings);
		if (!getCachedSiteSettings()) fetchSiteSettings();
		return () => { if (unsub) unsub(); };
	}, []);
	return settings || {};
}

export default {
	fetchSiteSettings,
	getCachedSiteSettings,
	subscribeSiteSettings,
	useSiteSettings,
};
