import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ArticleDetail from './pages/ArticleDetail';
import Profile from './pages/Profile';
import Search from './pages/Search';
import WriteArticle from './pages/WriteArticle';
import MyArticles from './pages/MyArticles';
import Bookmarks from './pages/Bookmarks';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import About from './pages/About';
import Contact from './pages/Contact';
import Blogs from './pages/Blogs';
import QATestPage from './pages/QATestPage';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';

// Ant Design theme configuration
const theme = {
  token: {
    colorPrimary: '#6366f1', // Indigo-600
    borderRadius: 8,
    colorBgContainer: '#ffffff',
  },
  components: {
    Layout: {
      bodyBg: '#f8fafc',
    },
  },
};

// Inner App component that has access to language context
const AppContent = () => {
  const { isVietnamese } = useLanguage();
  
  return (
    <ConfigProvider locale={isVietnamese ? viVN : enUS} theme={theme}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Header />
            <main className="min-h-screen">
              <Routes>
                <Route path="/" element={<Blogs />} />
                {/* <Route path="/home" element={<Home />} /> */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                {/* <Route path="/blogs" element={<Blogs />} /> */}
                <Route path="/articles/:id" element={<ArticleDetail />} />
                <Route 
                  path="/qa-test/:qaId" 
                  element={
                    <ProtectedRoute>
                      <QATestPage />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/search" element={<Search />} />
                <Route path="/profile/:id?" element={<Profile />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/write" 
                  element={
                    <RoleProtectedRoute allowedRoles={['admin', 'writer']}>
                      <WriteArticle />
                    </RoleProtectedRoute>
                  } 
                />
                <Route 
                  path="/write/:id" 
                  element={
                    <RoleProtectedRoute allowedRoles={['admin', 'writer']}>
                      <WriteArticle />
                    </RoleProtectedRoute>
                  } 
                />
                <Route 
                  path="/my-articles" 
                  element={
                    <RoleProtectedRoute allowedRoles={['admin', 'writer']}>
                      <MyArticles />
                    </RoleProtectedRoute>
                  } 
                />
                <Route 
                  path="/bookmarks" 
                  element={
                    <ProtectedRoute>
                      <Bookmarks />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <Dashboard />
                    </RoleProtectedRoute>
                  } 
                />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
};

// Main App component
const App = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
