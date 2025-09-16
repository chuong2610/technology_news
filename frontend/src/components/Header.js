import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  BellIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  BookmarkIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import LanguageToggle from './LanguageToggle';
import { articleApi } from '../api/articleApi';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const profileDropdownRef = useRef(null);
  
  // Get current category and sort from URL params
  const params = new URLSearchParams(location.search);
  const currentCategory = params.get('category') || 'all';
  const currentSort = params.get('sort') || 'updated_at';

  const navigationItems = [
    { name: t('navigation.about'), href: '/about', icon: DocumentTextIcon },
    { name: t('navigation.contact'), href: '/contact', icon: EnvelopeIcon },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const closeProfileDropdown = () => {
    setIsProfileDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        closeProfileDropdown();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        closeProfileDropdown();
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isProfileDropdownOpen]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 100); // Show compact mode after 100px scroll
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load categories only once on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadCategories = async () => {
      try {
        const res = await articleApi.getCategories();
        if (res && res.success && isMounted) {
          const items = Array.isArray(res.data) ? res.data : [];
          const top = [...items]
            .sort((a, b) => (b.count || 0) - (a.count || 0))
            .slice(0, 5)
            .map(c => ({ key: c.name, label: c.name, color: 'blue' }));
          const newCategories = [{ key: 'all', label: 'All Categories', color: 'blue' }, ...top];
          setCategories(newCategories);
        } else if (isMounted) {
          setCategories([{ key: 'all', label: 'All Categories', color: 'blue' }]);
        }
      } catch (e) {
        if (isMounted) {
          setCategories([{ key: 'all', label: 'All Categories', color: 'blue' }]);
        }
      }
    };

    loadCategories();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency - only runs once

  // Handle category change
  const handleCategoryChange = (categoryKey) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set('category', categoryKey);
    newParams.set('page', '1'); // Reset to first page
    navigate({ pathname: '/', search: `?${newParams.toString()}` });
  };

  // Handle sort change
  const handleSortChange = (sortValue) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set('sort', sortValue);
    newParams.set('page', '1'); // Reset to first page
    navigate({ pathname: '/', search: `?${newParams.toString()}` });
  };

  // Close dropdown on route change
  useEffect(() => {
    closeProfileDropdown();
  }, [location.pathname]);

  // theme toggle removed - single theme only

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Main Header - Hides when scrolled and on blogs page */}
      <header className={`site-header backdrop-blur-md shadow-sm sticky top-0 z-50 transition-all duration-300 ${
        isScrolled && location.pathname === '/' ? '-translate-y-full' : 'translate-y-0'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Header Row */}
          <div className="flex justify-between items-center h-20">
          {/* Logo Area - Placeholder 1 */}
          <div className="flex items-center space-x-4">
            {/* Logo without border - bigger like GenK sample */}
            <Link to="/" className="group flex items-center space-x-3">
              <img 
                src="/logo.jpg" 
                alt="QuickLearn Logo" 
                className="w-20 h-20 rounded-md group-hover:scale-105 transition-all duration-300 object-cover"
              />
              {/* QuickLearn Text */}
              <span className="hidden sm:block text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-105 transition-all duration-300">
                QuickLearn
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex ml-6 space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'text-indigo-600 bg-indigo-50 border border-indigo-200'
                        : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                    }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-4 lg:mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('home.hero.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="block w-full pl-9 lg:pl-10 pr-10 lg:pr-12 py-1.5 lg:py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
              <button
                type="submit"
                onClick={handleSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-indigo-50 rounded-r-lg transition-colors duration-200"
              >
                <MagnifyingGlassIcon className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 hover:text-indigo-600 transition-colors duration-200" />
              </button>
            </form>
          </div>

          {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <LanguageToggle />

            {/* Write Button - Only for admin and writer */}
            {isAuthenticated() && (user?.role === 'admin' || user?.role === 'writer') && (
              <button
                onClick={() => navigate('/write')}
                className="hidden sm:flex items-center space-x-1 lg:space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm lg:text-base"
              >
                <PlusIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="hidden lg:inline">{t('navigation.writeArticle')}</span>
                <span className="lg:hidden">+</span>
              </button>
            )}

            {/* User Menu */}
            {isAuthenticated() ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={toggleProfileDropdown}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user?.full_name || 'User avatar'}
                      className="w-7 h-7 lg:w-8 lg:h-8 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium text-xs lg:text-sm">
                      {user?.full_name?.[0] || user?.email?.[0] || 'U'}
                    </div>
                  )}
                    <span className="hidden md:block text-sm font-medium text-gray-700 max-w-24 lg:max-w-none truncate">
                    {user?.full_name || user?.email || 'User'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 dropdown-panel rounded-lg shadow-lg border py-1 z-50">
                    <Link
                      to="/profile"
                      onClick={closeProfileDropdown}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
                    >
                      <UserIcon className="w-4 h-4 inline mr-2" />
                      {t('navigation.profile')}
                    </Link>
                    {(user?.role === 'admin' || user?.role === 'writer') && (
                      <Link
                        to="/my-articles"
                        onClick={closeProfileDropdown}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
                      >
                        <DocumentTextIcon className="w-4 h-4 inline mr-2" />
                        {t('navigation.myArticles')}
                      </Link>
                    )}
                    <Link
                      to="/bookmarks"
                      onClick={closeProfileDropdown}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
                    >
                      <BookmarkIcon className="w-4 h-4 inline mr-2" />
                      {t('navigation.bookmarks')}
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/dashboard"
                        onClick={closeProfileDropdown}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
                      >
                        <CogIcon className="w-4 h-4 inline mr-2" />
                        {t('navigation.dashboard')}
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => {
                        handleLogout();
                        closeProfileDropdown();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 inline mr-2" />
                      {t('navigation.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 lg:space-x-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200 text-sm lg:text-base"
                >
                  {t('navigation.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm lg:text-base"
                >
                  {t('navigation.register')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" /> 
              )}
            </button>
          </div>
        </div>

        {/* Debug info */}
        {/* {location.pathname === '/' && (
          <div className="bg-yellow-100 p-2 text-sm">
            Debug: Categories count: {categories.length}, Path: {location.pathname}
          </div>
        )} */}

        {/* Expanded Categories Row - Show on homepage */}
        {location.pathname === '/' && (
          <div className="border-t border-gray-100 py-3 sm:py-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* Categories - Responsive */}
              <div className="w-full lg:flex-1">
                {/* Desktop and Tablet: Flex wrap */}
                <div className="hidden sm:flex flex-wrap">
                  {categories.length > 0 ? categories.map((category) => (
                    <button
                      key={category.key}
                      type="button"
                      className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                        currentCategory === category.key 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                      onClick={() => handleCategoryChange(category.key)}
                    >
                      {category.label}
                    </button>
                  )) : (
                    <div className="text-gray-500 text-sm">Loading categories...</div>
                  )}
                </div>
                
                {/* Mobile: Horizontal scroll */}
                <div className="sm:hidden overflow-x-auto scrollbar-hide">
                  <div className="flex pb-2 min-w-max">
                    {categories.length > 0 ? categories.map((category) => (
                      <button
                        key={category.key}
                        type="button"
                        className={`px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                          currentCategory === category.key 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                        onClick={() => handleCategoryChange(category.key)}
                      >
                        {category.label}
                      </button>
                    )) : (
                      <div className="text-gray-500 text-sm">Loading...</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Sort Dropdown - Hidden, default to updated_at */}
              <div className="hidden">
                <select
                  value={currentSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="updated_at">{t('blogs.sorting.latest')}</option>
                  <option value="created_at">{t('blogs.sorting.newest')}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'text-indigo-600 bg-indigo-50 border border-indigo-200'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Mobile Search */}
            <div className="mt-4">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('home.hero.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="block w-full pl-10 pr-12 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  onClick={handleSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-indigo-50 rounded-r-lg transition-colors duration-200"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 hover:text-indigo-600 transition-colors duration-200" />
                </button>
              </form>
            </div>

            {/* Mobile User Actions */}
            {isAuthenticated() && (user?.role === 'admin' || user?.role === 'writer') && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => {
                    navigate('/write');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Write Article</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>

    {/* Compact Header - Shows when scrolled on homepage */}
    {location.pathname === '/' && (
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md shadow-sm transition-all duration-300 ${
        isScrolled ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="bg-white/95">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            {/* Main header row */}
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center flex-shrink-0">
                <Link to="/" className="flex items-center space-x-2">
                  <img 
                    src="/logo.jpg" 
                    alt="QuickLearn Logo" 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
                  />
                  <span className="hidden sm:block text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">QuickLearn</span>
                </Link>
              </div>

              {/* Menu Button */}
              <div className="flex items-center">
                <button
                  onClick={toggleMenu}
                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                >
                  {isMenuOpen ? (
                    <XMarkIcon className="h-6 w-6" />
                  ) : (
                    <Bars3Icon className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Categories section - Always visible when scrolled */}
            <div className="border-t border-gray-100 py-2">
              <div className="flex overflow-x-auto scrollbar-hide">
                <div className="flex min-w-max space-x-1">
                  {categories.map((category) => (
                    <button
                      key={category.key}
                      type="button"
                      className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 rounded-md ${
                        currentCategory === category.key 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                      onClick={() => handleCategoryChange(category.key)}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Compact Mobile Menu */}
            {isMenuOpen && isScrolled && (
              <div className="border-t border-gray-100 py-4">
                <div className="grid grid-cols-1 gap-2">
                  {/* Navigation Items */}
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive(item.href)
                          ? 'text-indigo-600 bg-indigo-50 border border-indigo-200'
                          : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                  
                  {/* Search */}
                  <div className="mt-3">
                    <form onSubmit={handleSearch} className="relative">
                      <input
                        type="text"
                        placeholder={t('home.hero.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </form>
                  </div>

                  {/* User Actions */}
                  {isAuthenticated() ? (
                    <div className="mt-3 space-y-2">
                      <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                        <UserIcon className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      {(user?.role === 'admin' || user?.role === 'writer') && (
                        <>
                          <Link to="/write" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2 px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                            <PlusIcon className="w-4 h-4" />
                            <span>Write Article</span>
                          </Link>
                          <Link to="/my-articles" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                            <DocumentTextIcon className="w-4 h-4" />
                            <span>My Articles</span>
                          </Link>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 flex space-x-2">
                      <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex-1 text-center px-3 py-2 text-sm text-gray-600 hover:text-indigo-600 border border-gray-200 rounded-lg">
                        Login
                      </Link>
                      <Link to="/register" onClick={() => setIsMenuOpen(false)} className="flex-1 text-center px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    )}
  </>
  );
};

export default Header;
