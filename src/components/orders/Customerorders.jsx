import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Api_Base_Url } from '../../config/api';
import { getCurrentUser } from '../../utils/auth';

export default function Customerorders() {
	const [items, setItems] = useState([]);
	const [count, setCount] = useState(0);
	const [next, setNext] = useState(null);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const token = useMemo(() => getCurrentUser()?.accessToken || '', []);

	const fetchData = async (pg = 1) => {
		try {
			setLoading(true);
			setError('');
			const url = `${Api_Base_Url}/api/shop-customer-orders/?page=${pg}`;
			const res = await axios.get(url, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			});

			const data = res.data;
			if (data && Array.isArray(data.results)) {
				setItems(data.results);
				setCount(data.count || data.results.length || 0);
				setNext(data.next || null);
			} else if (Array.isArray(data)) {
				setItems(data);
				setCount(data.length);
				setNext(null);
			} else {
				setItems([]);
				setCount(0);
				setNext(null);
			}
		} catch (err) {
			const msg = err?.response?.data?.detail || err?.message || 'Failed to load customer orders';
			setError(msg);
			setItems([]);
			setCount(0);
			setNext(null);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData(page);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page]);

	const fallbackImg = '/ant.png';

	const resolveImg = (u) => {
		if (!u) return fallbackImg;
		if (typeof u !== 'string') return fallbackImg;
		if (u.startsWith('http://') || u.startsWith('https://')) return u;
		const needsSlash = !(Api_Base_Url.endsWith('/') || u.startsWith('/'));
		return `${Api_Base_Url}${needsSlash ? '/' : ''}${u}`;
	};

	const pickImage = (o) => {
		const candidates = [
			o?.product_image,
			o?.product_img,
			o?.image,
			o?.product_image_url,
			o?.thumbnail,
			o?.product_thumbnail,
			o?.product?.image,
			o?.product?.thumbnail,
		];
		for (const c of candidates) {
			if (c) return resolveImg(c);
		}
		return fallbackImg;
	};

	const refresh = () => fetchData(page);

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-gray-900">Customer Orders ({count})</h3>
				<button onClick={refresh} className="inline-flex items-center justify-center rounded-full border border-green-600 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-black/5 transition-colors shadow-sm">Refresh</button>
			</div>

			{loading && (
				<div className="py-10 text-center text-gray-600">Loading...</div>
			)}

			{!loading && error && (
				<div className="py-6 px-4 border border-red-200 bg-red-50 text-red-700 rounded-lg">{error}</div>
			)}

			{!loading && !error && items.length === 0 && (
				<div className="py-10 text-center text-gray-600">No orders found</div>
			)}

			{!loading && !error && items.length > 0 && (
				<ul className="space-y-3">
					{items.map((o) => (
						<li key={o.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
							{/* Thumbnail */}
							<div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
								<img
									src={pickImage(o)}
									alt={o.product_name || 'Product image'}
									className="w-full h-full object-cover"
									onError={(e) => { e.currentTarget.src = fallbackImg; }}
								/>
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="text-sm text-gray-500">{o.shop_name}</p>
										<h4 className="text-base font-semibold text-gray-900 truncate">{o.product_name}</h4>
										<div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
											{o.customer_name && <span>{o.customer_name}</span>}
											{o.customer_phone && <span className="text-gray-400">•</span>}
											{o.customer_phone && (
												<a href={`tel:${o.customer_phone}`} className="text-gray-600 hover:underline">
													{o.customer_phone}
												</a>
											)}
										</div>
									</div>
									<div className="text-right">
										<div className="text-green-600 font-bold">৳{o.total_amount ?? o.product_mrp}</div>
										<div className="text-xs text-gray-500">Qty: {o.quantity}</div>
									</div>
								</div>
								<div className="text-xs text-gray-400 mt-1">{new Date(o.created_at).toLocaleString()}</div>
							</div>
						</li>
					))}
				</ul>
			)}

			<div className="flex items-center justify-between mt-4">
				<div className="text-xs text-gray-600">
					{count} orders
				</div>
				<div className="flex items-center space-x-1">
					<button
						disabled={page === 1}
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						className="w-8 h-8 flex items-center justify-center text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						‹
					</button>
					<span className="px-3 py-1.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg min-w-[3rem] text-center">
						{page}
					</span>
					<button
						disabled={!next}
						onClick={() => setPage((p) => p + 1)}
						className="w-8 h-8 flex items-center justify-center text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						›
					</button>
				</div>
			</div>
		</div>
	);
}
