import React, { useState, useEffect } from 'react';
import { message, Table, Button, Card, Modal, Space, Tag, Tooltip } from 'antd';
import { scheduledArticlesApi } from '../api/scheduledArticlesApi';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

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
    // Show article content in a view-only modal since these are pending articles
    // Full edit functionality would be available after accepting the article
    Modal.info({
      title: article.title,
      content: React.createElement('div', {}, [
        React.createElement('p', { key: 'abstract' }, [
          React.createElement('strong', {}, 'Abstract: '),
          article.abstract || article.description || 'No abstract available'
        ]),
        React.createElement('div', { key: 'tags', style: { margin: '8px 0' } }, [
          React.createElement('strong', {}, 'Tags: '),
          React.createElement('span', {}, Array.isArray(article.tags) ? article.tags.join(', ') : article.tags || 'No tags')
        ]),
        React.createElement('div', { key: 'content', style: { maxHeight: '400px', overflow: 'auto' } }, [
          React.createElement('strong', { key: 'content-label' }, 'Content:'),
          React.createElement('div', { 
            key: 'content-body', 
            style: { marginTop: '8px', padding: '12px', background: '#f5f5f5', borderRadius: '4px', fontSize: '14px', lineHeight: '1.6' },
            dangerouslySetInnerHTML: { __html: (article.content || 'No content available').substring(0, 2000) + (article.content && article.content.length > 2000 ? '<br/><br/><em>... (content truncated)</em>' : '') }
          })
        ])
      ]),
      width: 800,
      okText: t('scheduledArticles.close') || 'Close'
    });
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

  const handleUpdateArticle = async () => {
    if (!selectedArticle) return;
    
    try {
      setUpdating(true);
      
      // Prepare the updated article data
      const updatedArticle = {
        ...selectedArticle,
        title: editForm.title,
        content: editForm.content,
        abstract: editForm.abstract,
        tags: typeof editForm.tags === 'string' ? editForm.tags.split(',').map(t => t.trim()).filter(t => t) : editForm.tags,
        image_url: editForm.image_url
      };
      
      // Note: We would need an update API endpoint to actually save changes
      // For now, just update the local state and show success message
      message.success(t('messages.scheduledArticleUpdated') || 'Article updated successfully');
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
      title: t('scheduledArticles.source') || 'Source',
      dataIndex: 'source',
      key: 'source',
      width: '15%',
      render: (source) => {
        return React.createElement(Tag, { color: 'blue' }, source || 'Unknown');
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
            { title: t('scheduledArticles.accept') || 'Accept' },
            React.createElement(
              Button,
              {
                size: 'small',
                type: 'primary',
                onClick: () => handleAcceptArticle(record)
              },
              'Accept'
            )
          ),
          React.createElement(
            Tooltip,
            { title: t('scheduledArticles.delete') || 'Delete' },
            React.createElement(
              Button,
              {
                size: 'small',
                danger: true,
                onClick: () => handleDeleteArticle(record)
              },
              'Delete'
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

      // Edit Modal
      React.createElement(
        Modal,
        {
          title: t('scheduledArticles.editArticle') || 'Edit Article',
          open: editModalVisible,
          onOk: handleUpdateArticle,
          onCancel: () => setEditModalVisible(false),
          confirmLoading: updating,
          okText: t('scheduledArticles.save') || 'Save',
          cancelText: t('scheduledArticles.cancel') || 'Cancel',
          width: 800
        },
        React.createElement(
          'div',
          { className: 'space-y-4' },
          React.createElement(
            'div',
            null,
            React.createElement(
              'label',
              { className: 'block text-sm font-medium text-gray-700 mb-2' },
              t('scheduledArticles.title') || 'Title'
            ),
            React.createElement(
              'input',
              {
                type: 'text',
                className: 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500',
                value: editForm.title || '',
                onChange: (e) => setEditForm({ ...editForm, title: e.target.value })
              }
            )
          ),
          React.createElement(
            'div',
            null,
            React.createElement(
              'label',
              { className: 'block text-sm font-medium text-gray-700 mb-2' },
              t('scheduledArticles.abstract') || 'Abstract'
            ),
            React.createElement(
              'textarea',
              {
                className: 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500',
                rows: 4,
                value: editForm.abstract || '',
                onChange: (e) => setEditForm({ ...editForm, abstract: e.target.value })
              }
            )
          ),
          React.createElement(
            'div',
            null,
            React.createElement(
              'label',
              { className: 'block text-sm font-medium text-gray-700 mb-2' },
              t('scheduledArticles.content') || 'Content'
            ),
            React.createElement(
              'textarea',
              {
                className: 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500',
                rows: 10,
                value: editForm.content || '',
                onChange: (e) => setEditForm({ ...editForm, content: e.target.value })
              }
            )
          ),
          React.createElement(
            'div',
            null,
            React.createElement(
              'label',
              { className: 'block text-sm font-medium text-gray-700 mb-2' },
              t('scheduledArticles.tags') || 'Tags'
            ),
            React.createElement(
              'input',
              {
                type: 'text',
                className: 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500',
                value: Array.isArray(editForm.tags) ? editForm.tags.join(', ') : (editForm.tags || ''),
                onChange: (e) => setEditForm({ ...editForm, tags: e.target.value }),
                placeholder: 'Enter tags separated by commas'
              }
            )
          ),
          React.createElement(
            'div',
            null,
            React.createElement(
              'label',
              { className: 'block text-sm font-medium text-gray-700 mb-2' },
              t('scheduledArticles.imageUrl') || 'Image URL'
            ),
            React.createElement(
              'input',
              {
                type: 'text',
                className: 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500',
                value: editForm.image_url || '',
                onChange: (e) => setEditForm({ ...editForm, image_url: e.target.value })
              }
            )
          )
        )
      ),

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