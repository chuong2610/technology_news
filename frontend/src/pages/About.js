import React from 'react';
import { motion } from 'framer-motion';
import { 
	DocumentTextIcon, 
	UsersIcon, 
	LightBulbIcon,
	GlobeAltIcon,
	ChartBarIcon,
	HeartIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';

// Import local team images
import PDZ01 from '../imgs/PDZ_01.jpg';
import PDZ02 from '../imgs/PDZ_02.jpg';
import PDZ03 from '../imgs/PDZ_03.jpg';

const team = [
	{
		name: 'Quang Phu Nguyen',
		role: 'Lead Developer',
		avatar: PDZ01,
		bio: 'Passionate about creating beautiful, functional web experiences.'
	},
	{
		name: 'Development Team',
		role: 'Full Stack Engineers',
		avatar: PDZ02,
		bio: 'Building the future of content creation and discovery.'
	},
	{
		name: 'Design Team',
		role: 'UX/UI Designers',
		avatar: PDZ03,
		bio: 'Crafting intuitive and delightful user experiences.'
	}
];

const About = () => {
	const { t } = useTranslation();
	
	const values = [
		{
			title: t('about.values.quality.title'),
			desc: t('about.values.quality.desc'),
			icon: DocumentTextIcon,
			color: 'from-blue-500 to-indigo-600'
		},
		{
			title: t('about.values.creators.title'),
			desc: t('about.values.creators.desc'),
			icon: UsersIcon,
			color: 'from-purple-500 to-pink-600'
		},
		{
			title: t('about.values.community.title'),
			desc: t('about.values.community.desc'),
			icon: GlobeAltIcon,
			color: 'from-emerald-500 to-teal-600'
		},
	];

	const stats = [
		{ label: t('about.stats.articles'), value: '500+', icon: DocumentTextIcon },
		{ label: t('about.stats.authors'), value: '100+', icon: UsersIcon },
		{ label: t('about.stats.readers'), value: '10K+', icon: ChartBarIcon },
		{ label: t('about.stats.countries'), value: '25+', icon: GlobeAltIcon },
	];

	return (
		<div className="min-h-screen" style={{ background: 'var(--bg)' }}>
			{/* Hero Section */}
			<section className="relative overflow-hidden py-20">
				<div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 to-purple-100/50" />
				<div className="relative max-w-7xl mx-auto px-6 text-center">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
					>
						<h1 className="text-5xl md:text-6xl font-extrabold text-surface mb-6">
							<span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
								{t('about.title')}
							</span>
						</h1>
						<p className="text-xl md:text-2xl text-muted max-w-4xl mx-auto leading-relaxed">
							{t('about.subtitle')}
						</p>
					</motion.div>
				</div>
			</section>

			{/* Mission Section */}
			<section className="py-20">
				<div className="max-w-7xl mx-auto px-6">
					<motion.div 
						className="text-center mb-16"
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						viewport={{ once: true }}
					>
						<h2 className="text-4xl font-bold text-gray-900 mb-6">{t('about.mission.title')}</h2>
						<p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
							{t('about.mission.description')}
						</p>
					</motion.div>

					{/* Values Grid */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
						{values.map((value, index) => (
							<motion.div
								key={index}
								className="group relative overflow-hidden rounded-2xl border border-surface bg-surface p-8 shadow-lg hover:shadow-xl transition-all duration-300"
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: index * 0.2 }}
								viewport={{ once: true }}
							>
								<div className={`absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br ${value.color} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-300`} />
								<div className="relative z-10">
									<div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
										<value.icon className="w-8 h-8 text-white" />
									</div>
									<h3 className="text-2xl font-bold text-surface mb-4">{value.title}</h3>
									<p className="text-muted leading-relaxed">{value.desc}</p>
								</div>
							</motion.div>
						))}
					</div>

					{/* Stats Section */}
					<motion.div 
						className="text-center mb-16"
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						viewport={{ once: true }}
					>
						<h2 className="text-4xl font-bold text-surface mb-12">{t('about.impact.title')}</h2>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
							{stats.map((stat, index) => (
								<motion.div
									key={index}
									className="text-center"
									initial={{ opacity: 0, scale: 0.8 }}
									whileInView={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.5, delay: index * 0.1 }}
									viewport={{ once: true }}
								>
									<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
										<stat.icon className="w-8 h-8 text-indigo-600" />
									</div>
									<div className="text-3xl font-bold text-surface mb-2">{stat.value}</div>
									<div className="text-muted">{stat.label}</div>
								</motion.div>
							))}
						</div>
					</motion.div>
				</div>
			</section>

			{/* Team Section */}
			<section className="py-20 bg-surface-2">
				<div className="max-w-7xl mx-auto px-6">
					<motion.div 
						className="text-center mb-16"
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						viewport={{ once: true }}
					>
						<h2 className="text-4xl font-bold text-surface mb-6">{t('about.team.title')}</h2>
						<p className="text-xl text-gray-600 max-w-3xl mx-auto">
							{t('about.team.subtitle')}
						</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{team.map((member, index) => (
							<motion.div
								key={index}
								className="text-center group"
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: index * 0.2 }}
								viewport={{ once: true }}
							>
								<div className="relative mb-6">
									<img
										src={member.avatar}
										alt={member.name}
										className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-surface shadow-lg group-hover:shadow-xl transition-all duration-300"
									/>
									<div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
								</div>
								<h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
								<p className="text-indigo-600 font-medium mb-3">{member.role}</p>
								<p className="text-gray-600 leading-relaxed">{member.bio}</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20">
				<div className="max-w-7xl mx-auto px-6">
					<motion.div 
						className="text-center"
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						viewport={{ once: true }}
					>
						<div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-white">
							<h2 className="text-4xl font-bold mb-6">{t('about.cta.title')}</h2>
							<p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
								{t('about.cta.description')}
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<button className="bg-surface text-indigo-700 px-8 py-3 rounded-full font-semibold hover:opacity-95 transition-all duration-300 shadow-lg hover:shadow-xl">
									{t('about.cta.startWriting')}
								</button>
								<button className="border-2 border-surface text-white px-8 py-3 rounded-full font-semibold hover:bg-surface hover:text-indigo-700 transition-all duration-300">
									{t('about.cta.exploreArticles')}
								</button>
							</div>
						</div>
					</motion.div>
				</div>
			</section>
		</div>
	);
};

export default About;


