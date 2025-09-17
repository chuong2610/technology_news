import React, { useState, useEffect } from 'react';
import { message, Table, Button, Card, Modal, Space, Tag, Tooltip, Form } from 'antd';
import { scheduledArticlesApi } from '../api/scheduledArticlesApi';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import PendingArticleEditor from '../components/PendingArticleEditor';

const ScheduledArticlesDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [fetchingNews, setFetchingNews] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await scheduledArticlesApi.getPendingArticles();
      if (response.success) {
        // Handle nested data structure from backend API
        const articlesData = response.data?.items || response.data || [];
        console.log('📊 Fetched articles:', articlesData);
        setArticles(Array.isArray(articlesData) ? articlesData : []);
      } else {
        console.error('❌ API Error:', response.error);
        message.error(t('messages.failedToLoadScheduledArticles') || 'Failed to load articles');
        setArticles([]);
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      message.error(t('messages.failedToLoadScheduledArticles') || 'Failed to load articles');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchNews = async () => {
    try {
      setFetchingNews(true);
      const response = await scheduledArticlesApi.fetchNews();
      if (response.success) {
        message.success(t('messages.newsArticlesFetched') || 'News articles fetched successfully');
        fetchArticles();
      } else {
        message.error(t('messages.failedToFetchNews') || 'Failed to fetch news');
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
      message.error(t('messages.failedToFetchNews') || 'Failed to fetch news');
    } finally {
      setFetchingNews(false);
    }
  };

  const handleEditArticle = (article) => {
    setSelectedArticle(article);
    setEditModalVisible(true);
  };

  const handleDeleteArticle = (article) => {
    setSelectedArticle(article);
    setDeleteModalVisible(true);
  };

  const handleAcceptArticle = (article) => {
    setSelectedArticle(article);
    setAcceptModalVisible(true);
  };

  const confirmAcceptArticle = async () => {
    if (!selectedArticle) return;
    
    try {
      setAccepting(true);
      const response = await scheduledArticlesApi.acceptArticle(selectedArticle.id);
      if (response.success) {
        message.success(t('messages.scheduledArticleAccepted') || 'Article accepted and published successfully');
        setAcceptModalVisible(false);
        fetchArticles();
      } else {
        message.error(response.error || t('messages.failedToAcceptArticle') || 'Failed to accept article');
      }
    } catch (error) {
      console.error('Failed to accept article:', error);
      message.error(t('messages.failedToAcceptArticle') || 'Failed to accept article');
    } finally {
      setAccepting(false);
    }
  };

  const confirmDeleteArticle = async () => {
    if (!selectedArticle) return;
    
    try {
      setDeleting(true);
      const response = await scheduledArticlesApi.deleteScheduledArticle(selectedArticle.id);
      if (response.success) {
        message.success(t('messages.scheduledArticleDeleted') || 'Article deleted successfully');
        setDeleteModalVisible(false);
        fetchArticles();
      } else {
        message.error(response.error || t('messages.failedToDeleteArticle') || 'Failed to delete article');
      }
    } catch (error) {
      console.error('Failed to delete article:', error);
      message.error(t('messages.failedToDeleteArticle') || 'Failed to delete article');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateArticle = async (updatedArticle) => {
    try {
      setUpdating(true);
      
      // Note: We would need an update API endpoint to actually save changes
      // For now, just update the local state and show success message
      setEditModalVisible(false);
      
      // Update the local articles state
      setArticles(prevArticles => 
        prevArticles.map(article => 
          article === selectedArticle ? updatedArticle : article
        )
      );
      
    } catch (error) {
      console.error('Failed to update article:', error);
      message.error(t('messages.failedToUpdateArticle') || 'Failed to update article');
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      title: t('scheduledArticles.articleTitle') || 'Title',
      dataIndex: 'title',
      key: 'title',
      width: '40%',
      render: (text, record) => {
        return React.createElement(
          'div',
          { style: { maxWidth: '300px' } },
          React.createElement(
            'div',
            { style: { fontWeight: 'medium', marginBottom: '4px', fontSize: '14px' } },
            text
          ),
          React.createElement(
            'div',
            { style: { fontSize: '12px', color: '#6B7280', opacity: 0.8 } },
            (record.abstract || record.description || 'No description available').substring(0, 100) + '...'
          )
        );
      }
    },

    {
      title: t('scheduledArticles.status') || 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      render: (status) => {
        const color = status === 'pending' ? 'orange' : status === 'approved' ? 'green' : 'red';
        return React.createElement(Tag, { color: color }, status || 'pending');
      }
    },
    {
      title: t('scheduledArticles.fetchedAt') || 'Fetched At',
      dataIndex: 'fetched_at',
      key: 'fetched_at',
      width: '15%',
      render: (fetchedAt, record) => {
        const date = fetchedAt || record.created_at || new Date().toISOString();
        return React.createElement(
          'div',
          { style: { fontSize: '12px', color: '#6B7280' } },
          new Date(date).toLocaleDateString()
        );
      }
    },
    {
      title: t('scheduledArticles.actions') || 'Actions',
      key: 'actions',
      width: '20%',
      render: (_, record) => {
        return React.createElement(
          Space,
          { size: 'small' },
          React.createElement(
            Tooltip,
            { title: t('scheduledArticles.edit') || 'Edit' },
            React.createElement(
              Button,
              {
                size: 'small',
                onClick: () => handleEditArticle(record)
              },
              'Edit'
            )
          ),
          React.createElement(
            Tooltip,
            { title: t('scheduledArticles.futureDevelopment') || 'Future Development' },
            React.createElement(
              Button,
              {
                size: 'small',
                type: 'primary',
                disabled: true,
                onClick: () => message.info(t('scheduledArticles.futureDevelopment') || 'Future Development')
              },
              t('scheduledArticles.futureDevelopment') || 'Future Development'
            )
          ),
          React.createElement(
            Tooltip,
            { title: t('scheduledArticles.futureDevelopment') || 'Future Development' },
            React.createElement(
              Button,
              {
                size: 'small',
                danger: true,
                disabled: true,
                onClick: () => message.info(t('scheduledArticles.futureDevelopment') || 'Future Development')
              },
              t('scheduledArticles.futureDevelopment') || 'Future Development'
            )
          )
        );
      },
    }
  ];

  return React.createElement(
    'div',
    { className: 'min-h-screen bg-gray-50' },
    React.createElement(
      'div',
      { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8' },
      // Header
      React.createElement(
        'div',
        { className: 'text-center mb-8' },
        React.createElement(
          'h1',
          { className: 'text-3xl font-bold text-gray-900 mb-4' },
          t('scheduledArticles.title') || 'Scheduled Articles Dashboard'
        ),
        React.createElement(
          'p',
          { className: 'text-lg text-gray-600' },
          t('scheduledArticles.subtitle') || 'Manage and review articles fetched from news sources'
        )
      ),
      
      // Main Card
      React.createElement(
        Card,
        {
          className: 'shadow-lg',
          title: React.createElement(
            'div',
            { className: 'flex justify-between items-center' },
            React.createElement(
              'span',
              { className: 'text-xl font-semibold' },
              t('scheduledArticles.articleManagement') || 'Article Management'
            ),
            React.createElement(
              Space,
              null,
              React.createElement(
                Button,
                {
                  type: 'primary',
                  onClick: handleFetchNews,
                  loading: fetchingNews
                },
                t('scheduledArticles.fetchNews') || 'Fetch News'
              ),
              React.createElement(
                Button,
                {
                  onClick: fetchArticles,
                  loading: loading
                },
                t('scheduledArticles.refresh') || 'Refresh'
              )
            )
          )
        },
        articles.length === 0 && !loading ? 
          React.createElement(
            'div',
            { className: 'text-center py-12' },
            React.createElement(
              'h3',
              { className: 'text-lg font-medium text-gray-900 mb-2' },
              t('scheduledArticles.noArticlesFound') || 'No articles found'
            ),
            React.createElement(
              'p',
              { className: 'text-gray-600 mb-6' },
              t('scheduledArticles.tryFetchingNews') || 'Try fetching news to populate the list'
            ),
            React.createElement(
              Button,
              {
                type: 'primary',
                onClick: handleFetchNews,
                loading: fetchingNews
              },
              t('scheduledArticles.fetchNews') || 'Fetch News'
            )
          ) :
          React.createElement(Table, {
            columns: columns,
            dataSource: Array.isArray(articles) ? articles : [],
            loading: loading,
            rowKey: 'id',
            pagination: {
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} articles`,
            }
          })
      ),

      // Rich Text Edit Modal
      React.createElement(PendingArticleEditor, {
        visible: editModalVisible,
        article: selectedArticle,
        onSave: handleUpdateArticle,
        onCancel: () => setEditModalVisible(false),
        loading: updating
      }),

      // Accept Modal
      React.createElement(
        Modal,
        {
          title: t('scheduledArticles.confirmAccept') || 'Accept Article',
          open: acceptModalVisible,
          onOk: confirmAcceptArticle,
          onCancel: () => setAcceptModalVisible(false),
          confirmLoading: accepting,
          okText: t('scheduledArticles.accept') || 'Accept',
          cancelText: t('scheduledArticles.cancel') || 'Cancel'
        },
        React.createElement(
          'p',
          null,
          t('scheduledArticles.confirmAcceptMessage') || 'Are you sure you want to accept this article and publish it to the main articles list?'
        ),
        selectedArticle && React.createElement(
          'div',
          { className: 'mt-4 p-3 bg-gray-50 rounded-lg' },
          React.createElement(
            'div',
            { className: 'font-medium text-gray-900' },
            selectedArticle.title
          )
        )
      ),

      // Delete Modal
      React.createElement(
        Modal,
        {
          title: t('scheduledArticles.confirmDelete') || 'Delete Article',
          open: deleteModalVisible,
          onOk: confirmDeleteArticle,
          onCancel: () => setDeleteModalVisible(false),
          confirmLoading: deleting,
          okType: 'danger',
          okText: t('scheduledArticles.delete') || 'Delete',
          cancelText: t('scheduledArticles.cancel') || 'Cancel'
        },
        React.createElement(
          'p',
          null,
          t('scheduledArticles.confirmDeleteMessage') || 'Are you sure you want to delete this article? This action cannot be undone.'
        ),
        selectedArticle && React.createElement(
          'div',
          { className: 'mt-4 p-3 bg-gray-50 rounded-lg' },
          React.createElement(
            'div',
            { className: 'font-medium text-gray-900' },
            selectedArticle.title
          )
        )
      )
    )
  );
};

export default ScheduledArticlesDashboard;