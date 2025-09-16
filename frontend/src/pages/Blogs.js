import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ArticleList, { clearArticleListCache } from '../components/ArticleList';
import PopularArticlesSidebar from '../components/PopularArticlesSidebar';
import { useTranslation } from '../hooks/useTranslation';

const Blogs = () => {
	const location = useLocation();
	const { isAuthenticated, hasRole, user } = useAuth();
	const { t } = useTranslation();

	// Read params
	const params = new URLSearchParams(location.search);
	const qCategory = params.get('category') || 'all';
	const qSort = params.get('sort') || 'updated_at';
	const qSearch = params.get('search') || '';
	const qPage = parseInt(params.get('page') || '1', 10);

	const [selectedCategory, setSelectedCategory] = useState(qCategory);
	const [articleSearch, setArticleSearch] = useState(qSearch);
	const [articleSortBy, setArticleSortBy] = useState(qSort);
	const [articlePage, setArticlePage] = useState(qPage);

	// Clear article list cache on mount
	useEffect(() => {
		clearArticleListCache();
	}, []);

	// Update state when URL parameters change (controlled by header)
	useEffect(() => {
		setSelectedCategory(qCategory);
		setArticleSortBy(qSort);
		setArticleSearch(qSearch);
		setArticlePage(qPage);
	}, [qCategory, qSort, qSearch, qPage]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
			{/* Hero Header */}
			{/* <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white relative overflow-hidden">
				<div className="absolute inset-0 bg-black/10"></div>
				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
					<div className="text-center">
						<h1 className="text-4xl md:text-6xl font-extrabold mb-4">
							<span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">{t('blogs.title')}</span>
						</h1>
						<p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">{t('blogs.subtitle')}</p>
					</div>
				</div>
			</div> */}

			<div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 pt-4">
				{/* Main Content with Responsive Sidebar Layout */}
				<div className="flex flex-col xl:flex-row gap-8">
					{/* Main Articles Content */}
					<div className="flex-1 order-2 xl:order-1">
						<ArticleList 
							showFilters={false} 
							category={selectedCategory} 
							sortBy={articleSortBy} 
							searchQuery={articleSearch} 
							currentPage={articlePage} 
							onPageChange={setArticlePage} 
							showTopPager 
						/>
					</div>
					
					{/* Popular Articles Sidebar - Shows on top on mobile/tablet, side on desktop */}
					<div className="xl:w-80 order-1 xl:order-2">
						<PopularArticlesSidebar />
					</div>
				</div>
			</div>
		</div>
	);
};

export default Blogs;
