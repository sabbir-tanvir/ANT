import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Api_Base_Url } from '../../config/api.js';

export default function CurrencyTransaction({ token }) {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [page, setPage] = useState(1);
	const [next, setNext] = useState(null);
	const [count, setCount] = useState(0);

	const fetchData = useCallback(async ({ reset = false } = {}) => {
		if (!token) return;
		try {
			setError('');
			setLoading(true);
			const url = `${Api_Base_Url}/api/currency-transactions/?page=${page}`;
			const res = await axios.get(url, {
				headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
			});
			const { results = [], next = null, count = 0 } = res.data || {};
			setCount(count);
			setNext(next);
			setItems(prev => reset ? results : [...prev, ...results]);
		} catch (err) {
			console.error('[CurrencyTransaction] fetch error', err);
			setError('Failed to load currency transactions');
		} finally {
			setLoading(false);
		}
	}, [token, page]);

	useEffect(() => { fetchData({ reset: page === 1 }); }, [fetchData, page]);

	const handleLoadMore = () => { if (next && !loading) setPage(p => p + 1); };
	const handleRefresh = () => { setPage(1); setItems([]); fetchData({ reset: true }); };

	return (
		<div className="mb-10">
			<div className="flex items-center justify-between mb-3">
				<h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
					<span className="inline-block px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-medium">Currency</span>
					<span className="text-gray-500 font-normal">Transactions</span>
				</h4>
				<div className="flex items-center gap-2">
					<button onClick={handleRefresh} className="text-xs px-3 py-1 rounded bg-white border border-gray-200 hover:bg-gray-50">Refresh</button>
				</div>
			</div>

			<div className="space-y-4">
				{error && (
					<div className="p-3 rounded bg-red-50 text-red-600 text-sm flex items-start justify-between">
						<span>{error}</span>
						<button onClick={handleRefresh} className="underline ml-2">Retry</button>
					</div>
				)}

				{!error && (
					<div className="text-xs text-gray-500">Total: {count}</div>
				)}

				{items.map((tx) => {
					const actionRaw = (tx.action || '').toString();
					const actionKey = actionRaw.trim().toLowerCase().replace(/[\s_-]+/g, '');
					const isSendMoney = actionKey.startsWith('sendmon'); // matches sendmoney / sendmony
					const isCashIn = actionKey === 'cashin';
					const actionLabel = isSendMoney ? 'Top up' : (tx.action || 'Action');
					return (
						<div key={tx.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-col gap-2 text-sm">
							<div className="flex items-center justify-between">
								<span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wide">{actionLabel}</span>
								<span className="font-semibold text-gray-800">৳{tx.amount}</span>
							</div>
							<div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600">
								{!isSendMoney && tx.sender_number && <span>Sender: {tx.sender_number}</span>}
								{!isCashIn && tx.receiver_number && <span>Receiver: {tx.receiver_number}</span>}
							</div>
							<div className="text-[11px] text-gray-400 flex items-center justify-between">
								<span>{tx.created_at}</span>
								<span className="truncate max-w-[50%] text-right">ID: {tx.id}</span>
							</div>
						</div>
					);
				})}

				{!loading && items.length === 0 && !error && (
					<div className="text-center py-10 text-sm text-gray-500 bg-white rounded-lg border border-dashed">No currency transactions found.</div>
				)}

				{loading && (
					<div className="space-y-3">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="animate-pulse bg-white border border-gray-100 rounded-lg p-4 space-y-2">
								<div className="h-4 bg-gray-200 rounded w-1/2" />
								<div className="h-3 bg-gray-100 rounded w-5/6" />
								<div className="h-3 bg-gray-100 rounded w-2/3" />
							</div>
						))}
					</div>
				)}

				{next && !loading && (
					<button onClick={handleLoadMore} className="w-full mt-2 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Load More</button>
				)}
			</div>
		</div>
	);
}
