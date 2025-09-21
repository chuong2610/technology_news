import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Upload, Select, message, Card, Switch, Tag, Space, Tooltip, Modal } from 'antd';
import { UploadOutlined, SaveOutlined, BulbOutlined, LoadingOutlined, RobotOutlined, FileImageOutlined } from '@ant-design/icons';
import ReactQuill, { Quill } from 'react-quill';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import 'react-quill/dist/quill.snow.css';
import { articleApi } from '../api/articleApi';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { apiClientFormData, createFormData, apiClient } from '../api/config';
import { APP_ID } from '../config/appConfig';
import ArticleAIGeneration from './ArticleAIGeneration';

const { TextArea } = Input;
const { Option } = Select;



const ArticleForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [useMarkdown, setUseMarkdown] = useState(false);
  const [originalContent, setOriginalContent] = useState(''); // Store original content for mode switching
  const [isEdit, setIsEdit] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [generatingTags, setGeneratingTags] = useState(false);
  const [showAIGeneration, setShowAIGeneration] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const quillRef = useRef(null);
  const textAreaRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();

  // Function to convert HTML back to markdown (basic conversion)
  const htmlToMarkdown = (html) => {
    if (!html || typeof html !== 'string') return '';
    
    return html
      // Convert headers
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
      // Convert paragraphs
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      // Convert line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      // Convert bold and italic
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      // Convert lists
      .replace(/<ul[^>]*>/gi, '')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '')
      .replace(/<\/ol>/gi, '\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      // Convert code blocks
      .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n\n')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      // Convert horizontal rules
      .replace(/<hr\s*\/?>/gi, '\n---\n\n')
      // Remove remaining HTML tags
      .replace(/<[^>]+>/g, '')
      // Clean up excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  // Use the same comprehensive markdown detection as ArticleDetail
  const isMarkdownContent = (content) => {
    if (!content || typeof content !== 'string') return false;
    
    console.log('🔍 ArticleForm analyzing content type:', {
      contentLength: content.length,
      firstChars: content.substring(0, 200),
      hasHtmlTags: /<[^>]+>/g.test(content)
    });

    // Quick check: if content starts with HTML tags and has HTML structure, it's likely HTML
    const startsWithHtml = /^<[^>]+>/.test(content.trim());
    const hasHtmlHeaders = /<h[1-6][^>]*>/.test(content);
    const hasHtmlLists = /<ul[^>]*>|<ol[^>]*>|<li[^>]*>/.test(content);
    
    if (startsWithHtml && (hasHtmlHeaders || hasHtmlLists)) {
      console.log('🚀 QUICK HTML DETECTION: Content starts with HTML and has HTML structure');
      console.log('❌ DETECTED AS HTML (quick detection)');
      return false;
    }
    
    // Primary markdown indicators - if any of these are found, it's markdown
    const strongMarkdownIndicators = [
      /^#{1,6}\s+\w/m,            // # Header at start of line
      /^\s*#{1,6}\s+\w/m,         // # Header with leading whitespace
      /```/,                       // Code blocks
      /^\s*\*\s+\w/m,             // * List items at start of line
      /^\s*-\s+\w/m,              // - List items at start of line
      /^\s*\d+\.\s+\w/m,          // 1. Numbered lists at start of line
      /\*\*\w.*?\w\*\*/,          // **bold**
      /\[.*?\]\(.*?\)/,           // [link](url)
      // Handle markdown wrapped in HTML tags (common backend processing issue)
      /<p[^>]*>#{1,6}\s+\w/,      // <p># Header (no other content before #)
      /<p[^>]*>\s*#{1,6}\s+\w/,   // <p> # Header (with whitespace)
      /<p[^>]*>\*\*\w.*?\w\*\*/,  // <p>**bold**
      /<p[^>]*>-\s+\w/,           // <p>- list items (immediately after <p>)
      /<p[^>]*>\*\s+\w/           // <p>* list items (immediately after <p>)
    ];
    
    // Check for strong markdown indicators
    const hasStrongMarkdownIndicators = strongMarkdownIndicators.some(pattern => {
      const match = pattern.test(content);
      if (match) {
        console.log('🎯 Found strong markdown indicator:', pattern.toString());
      }
      return match;
    });
    
    if (hasStrongMarkdownIndicators) {
      console.log('✅ DETECTED AS MARKDOWN due to strong indicators');
      return true;
    }
    
    // If content contains HTML tags, analyze the ratio
    if (/<[^>]+>/g.test(content)) {
      const htmlMatches = content.match(/<[^>]+>/g) || [];
      
      // Check for HTML structural elements that indicate proper HTML content
      const htmlStructuralPatterns = [
        /<div[^>]*>/i,
        /<span[^>]*>/i,
        /<h[1-6][^>]*>/i,        // HTML headers like <h1>, <h2>
        /<ul[^>]*>/i,            // HTML unordered lists
        /<ol[^>]*>/i,            // HTML ordered lists
        /<li[^>]*>/i,            // HTML list items
        /<table[^>]*>/i,
        /<pre[^>]*>/i,           // HTML pre blocks
        /<strong[^>]*>/i,        // HTML strong tags
        /<em[^>]*>/i,            // HTML emphasis tags
        /<sup[^>]*>/i,           // HTML superscript
        /<sub[^>]*>/i            // HTML subscript
      ];
      
      const hasHtmlStructure = htmlStructuralPatterns.some(pattern => pattern.test(content));
      const htmlStructuralCount = htmlStructuralPatterns.filter(pattern => pattern.test(content)).length;
      
      console.log('🏷️ HTML analysis:', {
        htmlMatches: htmlMatches.length,
        hasHtmlStructure,
        htmlStructuralCount
      });
      
      // If it has HTML structural elements, prioritize HTML rendering
      if (hasHtmlStructure) {
        if (hasStrongMarkdownIndicators && htmlStructuralCount <= 2) {
          // Edge case: minimal HTML with strong markdown indicators (like wrapped markdown)
          console.log('✅ DETECTED AS MARKDOWN despite HTML (wrapped markdown case)');
          return true;
        } else {
          console.log('❌ DETECTED AS HTML due to structural elements');
          return false;
        }
      }
    }
    
    console.log('❌ NO CLEAR MARKDOWN PATTERNS FOUND - defaulting to HTML');
    return false;
  };

  // Function to handle mode switching
  const handleModeSwitch = (isMarkdownMode) => {
    if (isMarkdownMode && !useMarkdown) {
      // Switching TO markdown mode
      if (isMarkdownContent(content)) {
        // Content already looks like markdown, keep it as is
        console.log('🔄 Content already looks like markdown, keeping as is');
      } else {
        // Convert HTML to markdown
        const markdownContent = htmlToMarkdown(content);
        console.log('🔄 Converting HTML to Markdown:', { 
          original: content.substring(0, 100), 
          converted: markdownContent.substring(0, 100) 
        });
        setContent(markdownContent);
      }
      setOriginalContent(content); // Store original content
    } else if (!isMarkdownMode && useMarkdown) {
      // Switching TO rich text mode
      console.log('🔄 Switching to Rich Text mode');
      // Keep the markdown content - ReactQuill will process it
    }
    setUseMarkdown(isMarkdownMode);
  };

  // Handle content changes in Rich Text mode to prevent markdown processing
  const handleRichTextChange = (value) => {
    // If the new value looks like markdown and we're in rich text mode,
    // suggest switching to markdown mode
    if (!useMarkdown && isMarkdownContent(value) && value.length > 100) {
      console.log('🔍 Detected markdown content in Rich Text mode');
      
      // Show a notification suggesting to switch to markdown mode
      message.info({
        content: (
          <div>
            <span>Markdown content detected! </span>
            <Button 
              type="link" 
              size="small" 
              onClick={() => {
                // Convert the HTML back to markdown and switch modes
                const markdownContent = htmlToMarkdown(value);
                setContent(markdownContent);
                setUseMarkdown(true);
                message.success('Switched to Markdown mode');
              }}
            >
              Switch to Markdown mode
            </Button>
          </div>
        ),
        duration: 8,
        key: 'markdown-suggestion'
      });
    }
    setContent(value);
  };

  useEffect(() => {
    if (id) {
      setIsEdit(true);
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      const res = await articleApi.getArticle(id);
      const article = res.success ? res.data : res;
      
      // Debug: Log the content received for editing
      console.log('📝 ArticleForm fetchArticle - Content received for editing:', {
        hasContent: !!article.content,
        contentType: typeof article.content,
        contentLength: article.content?.length || 0,
        hasNewlines: article.content?.includes('\n') || false,
        startsWithHash: article.content?.trim().startsWith('#') || false,
        firstChars: article.content?.substring(0, 300) || 'No content',
        hasHtmlEntities: article.content?.includes('&amp;') || article.content?.includes('&gt;') || false
      });
      
      form.setFieldsValue({
        title: article.title,
        abstract: article.abstract,
        tags: article.tags,
        status: article.status,
      });
      // Decode HTML entities if present
      let cleanContent = article.content;
      if (cleanContent && typeof cleanContent === 'string') {
        // Decode common HTML entities
        cleanContent = cleanContent
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ');
          
        console.log('🧹 Decoded HTML entities:', {
          hadEntities: cleanContent !== article.content,
          before: article.content.substring(0, 100),
          after: cleanContent.substring(0, 100)
        });
      }
      
      // Auto-detect markdown content and switch to markdown mode to prevent ReactQuill processing
      if (isMarkdownContent(cleanContent)) {
        console.log('🔄 Auto-switching to Markdown mode for editing (detected markdown content)');
        setUseMarkdown(true);
      } else {
        console.log('🏷️ Content detected as HTML - keeping Rich Text mode');
        setUseMarkdown(false);
      }
      
      setContent(cleanContent);
    } catch (error) {
      message.error('Failed to load article information');
      navigate('/');
    }
  };

  const generateTags = async () => {
    const title = form.getFieldValue('title');
    const abstract = form.getFieldValue('abstract');
    
    if (!title || !abstract) {
      message.warning('Please enter both title and abstract before generating tags');
      return;
    }

    setGeneratingTags(true);
    try {
      // Backend expects form data, not JSON
      const formData = new FormData();
      formData.append('title', title);
      formData.append('abstract', abstract);
      formData.append('content', content || '');
      formData.append('user_tags', JSON.stringify([])); // No user tags for now
      
      const response = await apiClientFormData.post('/articles/generate-tags', formData);
      
      const tags = response.data?.tags || [];
      setSuggestedTags(tags);
      message.success(`Generated ${tags.length} suggested tags`);
    } catch (error) {
      console.error('Tag generation error:', error);
      message.error('Failed to generate tags. Please try again.');
    } finally {
      setGeneratingTags(false);
    }
  };

  const addSuggestedTag = (tag) => {
    const currentTags = form.getFieldValue('tags') || [];
    if (!currentTags.includes(tag)) {
      form.setFieldsValue({ tags: [...currentTags, tag] });
    }
    // Remove from suggested tags after adding
    setSuggestedTags(prev => prev.filter(t => t !== tag));
  };

  // Upload image for markdown mode
  const handleMarkdownImageUpload = async (file) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResp = await apiClientFormData.post('/files/', formData);
      const imageUrl = uploadResp.data?.url || uploadResp.data?.data?.url;
      
      if (imageUrl) {
        // Get current cursor position in textarea
        const textarea = textAreaRef.current?.resizableTextArea?.textArea;
        const cursorPosition = textarea?.selectionStart || content.length;
        
        // Create markdown image syntax
        const altText = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension for alt text
        const imageMarkdown = `![${altText}](${imageUrl})`;
        
        // Insert at cursor position
        const beforeCursor = content.substring(0, cursorPosition);
        const afterCursor = content.substring(cursorPosition);
        const newContent = beforeCursor + '\n\n' + imageMarkdown + '\n\n' + afterCursor;
        
        setContent(newContent);
        
        // Restore cursor position (after the inserted image)
        setTimeout(() => {
          if (textarea) {
            const newPosition = cursorPosition + imageMarkdown.length + 4; // +4 for the \n\n before and after
            textarea.setSelectionRange(newPosition, newPosition);
            textarea.focus();
          }
        }, 0);
        
        message.success('Image uploaded and inserted successfully!');
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      message.error('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAIGenerationComplete = (generatedArticle) => {
    // Populate form with generated content
    form.setFieldsValue({
      title: generatedArticle.title,
      abstract: generatedArticle.abstract,
      tags: generatedArticle.tags || []
    });
    setContent(generatedArticle.content);
    setShowAIGeneration(false);
    message.success('Article generated successfully! Review and edit as needed.');
  };

  

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let processedContent = content;

      console.log('📝 Submitting content:', {
        mode: useMarkdown ? 'Markdown' : 'Rich Text',
        contentLength: content.length,
        isMarkdown: isMarkdownContent(content),
        firstChars: content.substring(0, 100)
      });

      // Handle content based on mode and type
      if (useMarkdown) {
        // In markdown mode - save content as-is (raw markdown)
        console.log('✅ Saving as raw markdown');
        processedContent = content; // Keep original markdown
      } else {
        // In rich text mode - check if content is actually markdown
        if (isMarkdownContent(content)) {
          console.log('⚠️ Warning: Markdown content detected in Rich Text mode');
          // You might want to show a warning here
          message.warning('Markdown syntax detected. Consider switching to Markdown mode for better formatting.');
        }
        
        // Process HTML content (from ReactQuill)
        console.log('🔧 Processing Rich Text content');
        processedContent = content; // ReactQuill already provides HTML
      }

      // If content contains base64 images (data:image/...), upload them and replace with blob URLs
      // This works for both markdown and HTML content
      const uploadBase64 = async (text) => {
        // For markdown, look for markdown image syntax: ![alt](data:image/...)
        // For HTML, look for HTML img tags: <img src="data:image/...">
        const htmlImageRegex = /<img[^>]+src=["'](data:image\/[a-zA-Z0-9+\-\.]+;base64,[^"']+)["'][^>]*>/g;
        const markdownImageRegex = /!\[([^\]]*)\]\((data:image\/[a-zA-Z0-9+\-\.]+;base64,[^)]+)\)/g;
        
        let newText = text;
        const uploads = [];
        let match;

        // Check for HTML images
        while ((match = htmlImageRegex.exec(text)) !== null) {
          const dataUrl = match[1];
          if (dataUrl) uploads.push({ dataUrl, fullMatch: match[0], type: 'html' });
        }

        // Check for Markdown images
        const markdownText = text;
        while ((match = markdownImageRegex.exec(markdownText)) !== null) {
          const dataUrl = match[2];
          const alt = match[1];
          if (dataUrl) uploads.push({ dataUrl, fullMatch: match[0], alt, type: 'markdown' });
        }

        for (const upload of uploads) {
          try {
            // Convert dataURL to Blob
            const res = await fetch(upload.dataUrl);
            const blob = await res.blob();
            const file = new File([blob], 'upload.png', { type: blob.type });

            const fd = new FormData();
            fd.append('file', file);

            // Use shared axios instance so auth headers and baseURL are applied.
            const uploadResp = await apiClientFormData.post('/files/', fd);
            const url = uploadResp.data?.url || uploadResp.data?.data?.url;
            
            if (url) {
              if (upload.type === 'html') {
                // Replace HTML img tag
                newText = newText.replace(upload.fullMatch, upload.fullMatch.replace(upload.dataUrl, url));
              } else if (upload.type === 'markdown') {
                // Replace markdown image syntax
                newText = newText.replace(upload.fullMatch, `![${upload.alt}](${url})`);
              }
            }
          } catch (e) {
            console.error('Failed to upload inline image', e);
          }
        }

        return newText;
      };

      processedContent = await uploadBase64(processedContent);

      // pick cover image: prefer Form value (AntD Upload) then imageFile state
      let coverFile = imageFile;
      if (values && values.image && Array.isArray(values.image) && values.image.length > 0) {
        const item = values.image[0];
        coverFile = item && item.originFileObj ? item.originFileObj : item;
      }

      const articleData = {
        ...values,
        content: processedContent,
        image: coverFile
      };

      // DEBUG: log imageFile and FormData structure before sending
      try {
        // eslint-disable-next-line no-console
        console.log('[DEBUG] Submitting article; imageFile:', imageFile);
        const debugForm = createFormData(articleData);
        for (const pair of debugForm.entries()) {
          const val = pair[1];
          if (val && typeof val === 'object' && (val.name || val.size)) {
            // eslint-disable-next-line no-console
            console.log('[DEBUG] form field:', pair[0], { name: val.name, size: val.size, type: val.type });
          } else {
            // eslint-disable-next-line no-console
            console.log('[DEBUG] form field:', pair[0], val);
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[DEBUG] Failed to inspect FormData before submit', e);
      }

      if (isEdit) {
        await articleApi.updateArticle(id, articleData);
        message.success('Article updated successfully');
      } else {
        await articleApi.createArticle(articleData);
        message.success('Article created successfully');
      }
      
      navigate('/');
    } catch (error) {
      message.error(isEdit ? 'Failed to update article' : 'Failed to create article');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (info) => {
    if (info.file.status === 'done' || info.file.originFileObj) {
      const file = info.file.originFileObj || info.file;
      setImageFile(file);
      
      // Preview the image
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          // You can add image preview here if needed
          console.log('Image loaded:', file.name, file.size);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const uploadProps = {
    name: 'image',
    listType: 'picture',
    maxCount: 1,
    beforeUpload: () => false, // Prevent auto upload
    onChange: handleImageChange,
    accept: 'image/*',
    showUploadList: {
      showPreviewIcon: true,
      showRemoveIcon: true,
      showDownloadIcon: false,
    },
  };

  // Normalize Upload event to value for Form
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList ? e.fileList : e;
  };

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['clean']
      ]
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Card 
        title={isEdit ? 'Edit Article' : 'Create New Article'} 
        style={{ 
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: 'none'
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'published',
            tags: []
          }}
        >
          {/* AI Generation Button */}
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <Button 
              type="primary"
              ghost
              icon={<RobotOutlined />}
              onClick={() => setShowAIGeneration(true)}
              size="large"
              style={{
                borderRadius: 20,
                height: 48,
                paddingLeft: 32,
                paddingRight: 32,
                fontSize: 16,
                border: '2px dashed #1890ff',
                backgroundColor: '#f0f8ff'
              }}
            >
              Generate with AI
            </Button>
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              Let AI help you create title, abstract, content, and tags
            </div>
          </div>

          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input size="large" placeholder="Enter article title..." />
          </Form.Item>

          <Form.Item
            name="abstract"
            label="Abstract"
            rules={[{ required: true, message: 'Please enter an abstract' }]}
          >
            <TextArea 
              rows={3} 
              placeholder="Enter a brief summary of your article..."
            />
          </Form.Item>

          <Form.Item label="Editor Mode">
            <Switch checked={useMarkdown} onChange={handleModeSwitch} />
            <span style={{ marginLeft: 8 }}>{useMarkdown ? 'Markdown' : 'Rich Text'}</span>
          </Form.Item>

          {useMarkdown ? (
            <>
              <Form.Item label="Content (Markdown)" required>
                <div style={{ position: 'relative' }}>
                  <Input.TextArea
                    ref={textAreaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={15}
                    placeholder="Enter Markdown content..."
                    style={{ 
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}
                  />
                  <div style={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    zIndex: 10 
                  }}>
                    <Upload
                      showUploadList={false}
                      beforeUpload={(file) => {
                        handleMarkdownImageUpload(file);
                        return false; // Prevent default upload
                      }}
                      accept="image/*"
                    >
                      <Button
                        type="text"
                        icon={<FileImageOutlined />}
                        size="small"
                        loading={uploadingImage}
                        title="Upload Image"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid #d9d9d9',
                          borderRadius: '4px'
                        }}
                      >
                        {uploadingImage ? '' : 'Image'}
                      </Button>
                    </Upload>
                  </div>
                </div>
              </Form.Item>
              <Card size="small" title="Preview" style={{ marginBottom: 24 }}>
                <div className="prose max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{content || ''}</ReactMarkdown>
                </div>
              </Card>
            </>
          ) : (
            <Form.Item label="Content" required>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={handleRichTextChange}
                modules={modules}
                style={{ height: 300, marginBottom: 40 }}
                placeholder="Write your article content..."
              />
            </Form.Item>
          )}

          <Form.Item
            name="tags"
            label={
              <Space>
                Tags
                <Tooltip title="Generate AI-powered tags based on your title and abstract">
                  <Button
                    type="text"
                    size="small"
                    icon={generatingTags ? <LoadingOutlined /> : <BulbOutlined />}
                    onClick={generateTags}
                    loading={generatingTags}
                    style={{ 
                      color: '#1890ff',
                      padding: '0 4px',
                      height: 'auto',
                      fontSize: 12
                    }}
                  >
                    Generate Tags
                  </Button>
                </Tooltip>
              </Space>
            }
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Enter tags and press Enter"
              tokenSeparators={[',']}
            />
          </Form.Item>

          {suggestedTags.length > 0 && (
            <Card 
              size="small" 
              title="Suggested Tags" 
              style={{ 
                marginBottom: 16,
                borderColor: '#1890ff',
                backgroundColor: '#f0f8ff'
              }}
            >
              <Space size={[8, 8]} wrap>
                {suggestedTags.map((tag, index) => (
                  <Tag
                    key={index}
                    color="blue"
                    style={{ 
                      cursor: 'pointer',
                      borderStyle: 'dashed'
                    }}
                    onClick={() => addSuggestedTag(tag)}
                  >
                    + {tag}
                  </Tag>
                ))}
              </Space>
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                Click on a tag to add it to your article
              </div>
            </Card>
          )}

          <Form.Item
            name="status"
            label="Status"
          >
            <Select>
              <Option value="draft">Draft</Option>
              <Option value="published">Published</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="image"
            label="Cover Image"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Choose Image</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SaveOutlined />}
              size="large"
              style={{
                borderRadius: 20,
                height: 48,
                paddingLeft: 32,
                paddingRight: 32,
                fontSize: 16
              }}
            >
              {isEdit ? 'Update Article' : 'Create Article'}
            </Button>
            <Button 
              style={{ 
                marginLeft: 8,
                borderRadius: 20,
                height: 48,
                paddingLeft: 32,
                paddingRight: 32,
                fontSize: 16
              }} 
              onClick={() => navigate('/')}
              size="large"
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* AI Generation Modal */}
      <ArticleAIGeneration
        visible={showAIGeneration}
        onClose={() => setShowAIGeneration(false)}
        onComplete={handleAIGenerationComplete}
      />
    </div>
  );
};

export default ArticleForm;
