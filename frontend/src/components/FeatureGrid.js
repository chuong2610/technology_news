import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const FeatureGrid = () => {
	const { t } = useTranslation();
	
	const features = [
		{
			title: t('home.features.categories.title'),
			desc: t('home.features.categories.subtitle'),
			color: 'from-blue-500 to-cyan-500',
		},
		{
			title: t('home.features.reading.title'),
			desc: t('home.features.reading.subtitle'),
			color: 'from-amber-500 to-orange-500',
		},
		{
			title: t('home.features.tools.title'),
			desc: t('home.features.tools.subtitle'),
			color: 'from-emerald-500 to-teal-500',
		},
		{
			title: t('home.features.community.title'),
			desc: t('home.features.community.subtitle'),
			color: 'from-fuchsia-500 to-pink-500',
		},
	];
	return (
		<section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
			<div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{features.map((f, idx) => (
					<div key={idx} className="group relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm transition hover:shadow-md bg-surface border-surface" style={{ borderWidth: 1 }}>
						<div className={`absolute -right-10 -top-10 h-28 sm:h-36 w-28 sm:w-36 rounded-full bg-gradient-to-br ${f.color} opacity-20 blur-2xl`} />
						<h3 className="text-base sm:text-lg font-semibold text-surface">{f.title}</h3>
						<p className="mt-2 text-xs sm:text-sm text-muted">{f.desc}</p>
					</div>
				))}
			</div>
		</section>
	);
};

export default FeatureGrid;


