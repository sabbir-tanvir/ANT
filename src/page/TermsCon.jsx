import React from 'react';
import { useSiteSettings } from '../config/sitesetting.js';

export default function TermsCon() {
	const settings = useSiteSettings();
	const html = settings?.terms_and_conditions || '';

	return (
		<section className="min-h-[70vh] py-10 px-4 md:px-6">
			<div className="max-w-4xl mx-auto rounded-xl p-6 md:p-8 bg-white shadow">
				<header className="mb-6">
					<h1 className="text-2xl md:text-3xl font-bold text-gray-900">
						Terms & Conditions
					</h1>
				</header>

				<div
					className="text-gray-700 leading-relaxed space-y-4"
					dangerouslySetInnerHTML={{
						__html: html || '<p>No terms and conditions available.</p>',
					}}
				/>
			</div>
		</section>
	);
}
