import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { articleApi } from '../api/articleApi';
import { EyeOutlined, HeartOutlined, FireOutlined } from '@ant-design/icons';

const PopularArticlesSidebar = () => {
  const [popularArticles, setPopularArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPopularArticles = async () => {
      try {
        const response = await articleApi.getPopularArticles(5);
        console.log('Popular articles API response:', response);
        if (response.success && response.data) {
          console.log('Popular articles data:', response.data);
          console.log('First article ID field:', response.data[0] ? {
            id: response.data[0].id,
            article_id: response.data[0].article_id,
            _id: response.data[0]._id
          } : 'No articles');
          setPopularArticles(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch popular articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularArticles();
  }, []);

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const getRandomDefaultImage = () => {
    const defaultImages = [
      '/sea_default_01.jpg',
      '/sea_default_02.jpg', 
      '/sea_default_03.jpg',
      '/sea_default_04.jpg',
      '/sea_default_05.jpg'
    ];
    return defaultImages[Math.floor(Math.random() * defaultImages.length)];
  };

  const handleArticleClick = (articleId) => {
    console.log('Navigating to article with ID:', articleId);
    if (!articleId) {
      console.error('No article ID provided for navigation');
      return;
    }
    navigate(`/articles/${articleId}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <FireOutlined className="text-orange-500" />
          <h3 className="text-lg font-bold text-gray-900">Popular Articles</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-16 rounded-lg mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4 mb-1"></div>
              <div className="bg-gray-200 h-3 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (popularArticles.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <FireOutlined className="text-orange-500" />
          <h3 className="text-lg font-bold text-gray-900">Popular Articles</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <FireOutlined className="text-3xl mb-2 opacity-50" />
          <p>No popular articles yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 xl:sticky xl:top-24">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <FireOutlined className="text-orange-500" />
        <h3 className="text-base sm:text-lg font-bold text-gray-900">Popular Articles</h3>
      </div>
      
      {/* Mobile/Tablet: Horizontal Scroll Layout */}
      <div className="xl:hidden">
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {popularArticles.map((article, index) => (
            <div
              key={article.id}
              className="flex-shrink-0 w-64 cursor-pointer transition-all duration-200 hover:scale-105"
              onClick={() => handleArticleClick(article.id)}
            >
              <div className={`bg-gradient-to-br ${
                index === 0 
                  ? 'from-orange-50 to-red-50 border-2 border-orange-200' 
                  : 'from-gray-50 to-blue-50 border border-gray-200'
              } p-3 rounded-lg hover:shadow-md transition-shadow h-full`}>
                <div className="flex gap-3 h-full">
                  <div className="w-16 h-12 flex-shrink-0 overflow-hidden rounded-md">
                    <img
                      src={article.image || getRandomDefaultImage()}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = getRandomDefaultImage();
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">
                      {truncateText(article.title, 45)}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <EyeOutlined />
                        {formatNumber(article.views || article.total_view || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <HeartOutlined />
                        {formatNumber(article.likes || article.total_like || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Desktop: Vertical Stack Layout */}
      <div className="hidden xl:block space-y-4">
        {popularArticles.map((article, index) => (
          <div
            key={article.id}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
              index === 0 ? 'border-2 border-orange-100' : ''
            }`}
            onClick={() => handleArticleClick(article.id)}
          >
            <div className={`bg-gradient-to-br ${
              index === 0 
                ? 'from-orange-50 to-red-50 p-4 rounded-lg' 
                : 'from-gray-50 to-blue-50 p-3 rounded-lg'
            } hover:shadow-md transition-shadow`}>
              
              {/* Featured Article (First one) */}
              {index === 0 ? (
                <div className="space-y-3">
                  <div className="aspect-video overflow-hidden rounded-md">
                    <img
                      src={article.image || getRandomDefaultImage()}
                      alt={article.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = getRandomDefaultImage();
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 leading-tight">
                      {truncateText(article.title, 60)}
                    </h4>
                    <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                      {truncateText(article.abstract || article.content, 80)}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <EyeOutlined />
                          {formatNumber(article.views || article.total_view || 0)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HeartOutlined />
                          {formatNumber(article.likes || article.total_like || 0)}
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-orange-200 text-orange-700 rounded-full text-xs font-medium">
                        #1 Trending
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Regular Articles (2-5) */
                <div className="flex gap-3">
                  <div className="w-16 h-12 flex-shrink-0 overflow-hidden rounded-md">
                    <img
                      src={article.image || getRandomDefaultImage()}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = getRandomDefaultImage();
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">
                      {truncateText(article.title, 50)}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <EyeOutlined />
                        {formatNumber(article.views || article.total_view || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <HeartOutlined />
                        {formatNumber(article.likes || article.total_like || 0)}
                      </span>
                      <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* View All Link */}
      {/* <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={() => navigate('/blogs?sort=popular')}
          className="w-full text-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
        >
          View All Popular Articles →
        </button>
      </div> */}
    </div>
  );
};

export default PopularArticlesSidebar;