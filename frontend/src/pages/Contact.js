import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
	EnvelopeIcon, 
	PhoneIcon, 
	MapPinIcon, 
	ClockIcon,
	CheckCircleIcon,
	ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';

const Contact = () => {
	const { t } = useTranslation();
	const [formData, setFormData] = useState({
		fullName: '',
		email: '',
		subject: '',
		message: ''
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		setSubmitStatus(null);

		try {
			// Here you would typically send the form data to your backend
			// For now, we'll simulate a successful submission
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			// Send email using mailto (fallback for demo)
			const mailtoLink = `mailto:quangphunguyen1804@gmail.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.fullName}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`)}`;
			window.open(mailtoLink);
			
			setSubmitStatus('success');
			setFormData({ fullName: '', email: '', subject: '', message: '' });
		} catch (error) {
			setSubmitStatus('error');
		} finally {
			setIsSubmitting(false);
		}
	};

	const contactInfo = [
		{
			icon: EnvelopeIcon,
			title: t('contact.info.email'),
			value: 'quangphunguyen1804@gmail.com',
			link: 'mailto:quangphunguyen1804@gmail.com',
			color: 'from-blue-500 to-indigo-600'
		},
		{
			icon: PhoneIcon,
			title: t('contact.info.phone'),
			value: '+84 000 000 000',
			link: 'tel:+84000000000',
			color: 'from-green-500 to-emerald-600'
		},
		{
			icon: MapPinIcon,
			title: t('contact.info.office'),
			value: t('contact.info.location'),
			color: 'from-purple-500 to-pink-600'
		},
		{
			icon: ClockIcon,
			title: t('contact.info.hours'),
			value: t('contact.info.businessHours'),
			color: 'from-orange-500 to-red-600'
		}
	];

	return (
		<div className="min-h-screen" style={{ background: 'var(--bg)' }}>
			{/* Hero Section */}
			<section className="relative overflow-hidden py-20">
				<div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 to-cyan-100/50" />
				<div className="relative max-w-7xl mx-auto px-6 text-center">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
					>
						<h1 className="text-5xl md:text-6xl font-extrabold text-surface mb-6">
							<span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
								{t('contact.hero.title')}
							</span>
						</h1>
						<p className="text-xl md:text-2xl text-muted max-w-3xl mx-auto leading-relaxed">
							{t('contact.hero.subtitle')}
						</p>
					</motion.div>
				</div>
			</section>

			{/* Main Content */}
			<section className="py-20">
				<div className="max-w-7xl mx-auto px-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
						{/* Contact Form */}
						<motion.div
							initial={{ opacity: 0, x: -50 }}
							whileInView={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.8 }}
							viewport={{ once: true }}
						>
							<div className="bg-surface rounded-3xl shadow-2xl p-8 border border-surface">
								<h2 className="text-3xl font-bold text-surface mb-6">{t('contact.form.title')}</h2>
								
								{submitStatus === 'success' && (
									<motion.div
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3"
									>
										<CheckCircleIcon className="w-6 h-6 text-green-600" />
										<div>
											<h3 className="font-semibold text-green-800">{t('contact.form.success.title')}</h3>
											<p className="text-green-700 text-sm">{t('contact.form.success.message')}</p>
										</div>
									</motion.div>
								)}

								{submitStatus === 'error' && (
									<motion.div
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3"
									>
										<ExclamationCircleIcon className="w-6 h-6 text-red-600" />
										<div>
											<h3 className="font-semibold text-red-800">{t('contact.form.error.title')}</h3>
											<p className="text-red-700 text-sm">{t('contact.form.error.message')}</p>
										</div>
									</motion.div>
								)}

								<form onSubmit={handleSubmit} className="space-y-6">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
										<div>
											<label htmlFor="fullName" className="block text-sm font-medium text-muted mb-2">
												{t('contact.form.fullName')} *
											</label>
											<input
												type="text"
												id="fullName"
												name="fullName"
												value={formData.fullName}
												onChange={handleInputChange}
												required
												className="w-full px-4 py-3 border border-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-surface hover:opacity-95"
												placeholder={t('contact.form.fullNamePlaceholder')}
											/>
										</div>
										<div>
											<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
												{t('contact.form.email')} *
											</label>
											<input
												type="email"
												id="email"
												name="email"
												value={formData.email}
												onChange={handleInputChange}
												required
												className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
												placeholder={t('contact.form.emailPlaceholder')}
											/>
										</div>
									</div>

									<div>
										<label htmlFor="subject" className="block text-sm font-medium text-muted mb-2">
											{t('contact.form.subject')} *
										</label>
										<input
											type="text"
											id="subject"
											name="subject"
											value={formData.subject}
											onChange={handleInputChange}
											required
											className="w-full px-4 py-3 border border-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-surface hover:opacity-95"
											placeholder={t('contact.form.subjectPlaceholder')}
										/>
									</div>

									<div>
										<label htmlFor="message" className="block text-sm font-medium text-muted mb-2">
											{t('contact.form.message')} *
										</label>
										<textarea
											id="message"
											name="message"
											rows={6}
											value={formData.message}
											onChange={handleInputChange}
											required
											className="w-full px-4 py-3 border border-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-surface hover:opacity-95 resize-none"
											placeholder={t('contact.form.messagePlaceholder')}
										/>
									</div>

									<button
										type="submit"
										disabled={isSubmitting}
										className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{isSubmitting ? t('contact.form.sending') : t('contact.form.sendMessage')}
									</button>
								</form>
							</div>
						</motion.div>

						{/* Contact Information */}
						<motion.div
							initial={{ opacity: 0, x: 50 }}
							whileInView={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.8, delay: 0.2 }}
							viewport={{ once: true }}
							className="space-y-8"
						>
							<div>
								<h2 className="text-3xl font-bold text-surface mb-6">{t('contact.info.title')}</h2>
								<p className="text-lg text-muted mb-8">
									{t('contact.info.description')}
								</p>
							</div>

							<div className="space-y-6">
								{contactInfo.map((info, index) => (
									<motion.div
										key={index}
										initial={{ opacity: 0, y: 20 }}
										whileInView={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
										viewport={{ once: true }}
										className="flex items-start space-x-4 group"
									>
										<div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
											<info.icon className="w-6 h-6 text-white" />
										</div>
										<div className="flex-1">
											<h3 className="text-lg font-semibold text-surface mb-1">{info.title}</h3>
											{info.link ? (
												<a
													href={info.link}
													className="text-muted hover:link-accent transition-colors duration-200"
												>
													{info.value}
												</a>
											) : (
												<p className="text-gray-600">{info.value}</p>
											)}
										</div>
									</motion.div>
								))}
							</div>

							{/* Office Location */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.7 }}
								viewport={{ once: true }}
								className="bg-surface rounded-2xl p-6 shadow-lg border border-surface"
							>
								<h3 className="text-xl font-semibold text-gray-900 mb-4">{t('contact.office.title')}</h3>
									<div className="space-y-3 text-muted">
									<p>{t('contact.office.address1')}</p>
									<p>{t('contact.office.address2')}</p>
									<p>{t('contact.office.country')}</p>
								</div>
							</motion.div>
						</motion.div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20">
				<div className="max-w-7xl mx-auto px-6">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						viewport={{ once: true }}
						className="text-center"
					>
						<div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 rounded-3xl p-12 text-white">
							<h2 className="text-4xl font-bold mb-6">{t('contact.cta.title')}</h2>
							<p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
								{t('contact.cta.description')}
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<button className="bg-white text-indigo-700 px-8 py-3 rounded-full font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl">
									{t('contact.cta.startWriting')}
								</button>
								<button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-indigo-700 transition-all duration-300">
									{t('contact.cta.exploreArticles')}
								</button>
							</div>
						</div>
					</motion.div>
				</div>
			</section>
		</div>
	);
};

export default Contact;


