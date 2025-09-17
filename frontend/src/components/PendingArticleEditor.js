import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, message, Card, Switch, Tag, Space, Modal } from 'antd';
import { SaveOutlined, BulbOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useTranslation } from '../hooks/useTranslation';

const { TextArea } = Input;

const PendingArticleEditor = ({ visible, article, onSave, onCancel, loading }) => {
  const [form] = Form.useForm();
  const [content, setContent] = useState('');
  const [useMarkdown, setUseMarkdown] = useState(false);
  const quillRef = useRef(null);
  const { t } = useTranslation();

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'script', 'indent', 'blockquote', 'code-block',
    'align', 'link', 'image'
  ];

  useEffect(() => {
    if (visible && article) {
      // Set form values when modal opens
      form.setFieldsValue({
        title: article.title || '',
        abstract: article.abstract || article.description || '',
        tags: Array.isArray(article.tags) 
          ? article.tags.join(', ') 
          : (typeof article.tags === 'string' ? article.tags : ''),
        status: 'pending'
      });
      setContent(article.content || '');
    }
  }, [visible, article, form]);

  const handleSubmit = async (values) => {
    console.log('🎯 PendingArticleEditor handleSubmit called');
    console.log('🎯 Form values:', values);
    console.log('🎯 Content:', content);
    console.log('🎯 Article:', article);
    
    try {
      const updatedArticle = {
        ...article,
        title: values.title,
        abstract: values.abstract,
        content: content,
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      };

      console.log('🎯 updatedArticle:', updatedArticle);
      console.log('🎯 About to call onSave...');
      
      await onSave(updatedArticle);
      
      console.log('🎯 onSave completed successfully');
      message.success(t('messages.articleUpdated') || 'Article updated successfully');
    } catch (error) {
      console.error('❌ Error in PendingArticleEditor handleSubmit:', error);
      message.error(t('messages.updateFailed') || 'Failed to update article');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setContent('');
    onCancel();
  };

  return React.createElement(
    Modal,
    {
      title: React.createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        React.createElement(BulbOutlined, { style: { color: '#1890ff' } }),
        t('scheduledArticles.editArticle') || 'Edit Pending Article'
      ),
      open: visible,
      onCancel: handleCancel,
      footer: null,
      width: 1000,
      style: { top: 20 },
      bodyStyle: { padding: 0 }
    },
    React.createElement(
      'div',
      { 
        style: { 
          background: '#f5f5f5', 
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column'
        }
      },
      // Navigation Bar
      React.createElement(
        'div',
        {
          style: {
            background: 'white',
            borderBottom: '1px solid #d9d9d9',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }
        },
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '16px' } },
          React.createElement(
            'h3',
            { style: { margin: 0, color: '#262626' } },
            t('scheduledArticles.editArticle') || 'Edit Article'
          ),
          React.createElement(
            Tag,
            { color: 'orange' },
            t('scheduledArticles.pending') || 'Pending'
          )
        ),
        React.createElement(
          Space,
          null,
          React.createElement(
            Button,
            { onClick: handleCancel },
            t('common.cancel') || 'Cancel'
          ),
          React.createElement(
            Button,
            { 
              type: 'primary',
              icon: React.createElement(SaveOutlined),
              loading: loading,
              onClick: () => form.submit()
            },
            t('common.save') || 'Save Changes'
          )
        )
      ),
      // Form Content
      React.createElement(
        'div',
        { style: { flex: 1, padding: '24px', overflow: 'auto' } },
        React.createElement(
          Card,
          null,
          React.createElement(
            Form,
            {
              form: form,
              layout: 'vertical',
              onFinish: handleSubmit,
              autoComplete: 'off'
            },
            // Title Field
            React.createElement(
              Form.Item,
              {
                label: React.createElement(
                  'span',
                  { style: { fontWeight: 600, fontSize: '14px' } },
                  t('scheduledArticles.articleTitle') || 'Article Title'
                ),
                name: 'title',
                rules: [
                  { required: true, message: t('validation.titleRequired') || 'Please enter article title' },
                  { max: 200, message: t('validation.titleTooLong') || 'Title is too long' }
                ]
              },
              React.createElement(Input, {
                placeholder: t('placeholders.enterTitle') || 'Enter article title...',
                size: 'large'
              })
            ),
            // Abstract Field
            React.createElement(
              Form.Item,
              {
                label: React.createElement(
                  'span',
                  { style: { fontWeight: 600, fontSize: '14px' } },
                  t('scheduledArticles.abstract') || 'Abstract'
                ),
                name: 'abstract',
                rules: [
                  { required: true, message: t('validation.abstractRequired') || 'Please enter abstract' }
                ]
              },
              React.createElement(TextArea, {
                rows: 4,
                placeholder: t('placeholders.enterAbstract') || 'Enter article abstract...'
              })
            ),
            // Tags Field
            React.createElement(
              Form.Item,
              {
                label: React.createElement(
                  'span',
                  { style: { fontWeight: 600, fontSize: '14px' } },
                  t('scheduledArticles.tags') || 'Tags'
                ),
                name: 'tags'
              },
              React.createElement(Input, {
                placeholder: t('placeholders.enterTags') || 'Enter tags separated by commas...'
              })
            ),
            // Editor Mode Toggle
            React.createElement(
              Form.Item,
              {
                label: React.createElement(
                  'span',
                  { style: { fontWeight: 600, fontSize: '14px' } },
                  t('editor.editorMode') || 'Editor Mode'
                )
              },
              React.createElement(
                Space,
                { align: 'center' },
                React.createElement('span', null, 'Rich Text'),
                React.createElement(Switch, {
                  checked: useMarkdown,
                  onChange: setUseMarkdown,
                  size: 'small'
                }),
                React.createElement('span', null, 'Markdown')
              )
            ),
            // Content Editor
            React.createElement(
              Form.Item,
              {
                label: React.createElement(
                  'span',
                  { style: { fontWeight: 600, fontSize: '14px' } },
                  t('scheduledArticles.content') || 'Content'
                ),
                required: true
              },
              useMarkdown 
                ? React.createElement(TextArea, {
                    rows: 20,
                    value: content,
                    onChange: (e) => setContent(e.target.value),
                    placeholder: t('placeholders.enterContent') || 'Enter article content in Markdown...'
                  })
                : React.createElement(
                    'div',
                    { style: { border: '1px solid #d9d9d9', borderRadius: '6px' } },
                    React.createElement(ReactQuill, {
                      ref: quillRef,
                      theme: 'snow',
                      value: content,
                      onChange: setContent,
                      modules: modules,
                      formats: formats,
                      placeholder: t('placeholders.enterContent') || 'Enter article content...',
                      style: { 
                        minHeight: '400px',
                        background: 'white'
                      }
                    })
                  )
            )
          )
        )
      )
    )
  );
};

export default PendingArticleEditor;