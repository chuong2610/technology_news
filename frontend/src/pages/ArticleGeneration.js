import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Card, Button, Input, Select, Radio, Divider, Typography, Space, Alert, InputNumber, Row, Col, Spin } from 'antd';
import { 
  PlusCircleOutlined, 
  FileTextOutlined, 
  BulbOutlined,
  SendOutlined,
  CopyOutlined,
  RobotOutlined,
  LoadingOutlined,
  EditOutlined
} from '@ant-design/icons';
import { articleGenerationApi } from '../api/articleGenerationApi';
import { useTranslation } from '../hooks/useTranslation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Paragraph, Text } = Typography;

const ArticleGeneration = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Form state
  const [query, setQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [articleType, setArticleType] = useState('informative');
  const [length, setLength] = useState('medium');
  const [tone, setTone] = useState('professional');
  const [outputFormat, setOutputFormat] = useState('markdown');
  
  // Generation state
  const [loading, setLoading] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showGenerationOptions, setShowGenerationOptions] = useState(false);
  
  // Configuration
  const [config, setConfig] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await articleGenerationApi.getGenerationConfig();
      if (response.success) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const handleGenerateArticle = async () => {
    if (!query.trim()) {
      message.error('Please enter a topic or query');
      return;
    }

    setLoading(true);
    try {
      const response = await articleGenerationApi.generateArticle({
        query: query.trim(),
        inputText: inputText.trim(),
        articleType,
        length,
        tone,
        outputFormat
      });

      if (response.success) {
        setGeneratedArticle(response.data);
        message.success('Article generated successfully!');
        setShowGenerationOptions(false);
      } else {
        message.error(response.message || 'Failed to generate article');
      }
    } catch (error) {
      message.error('Failed to generate article');
      console.error('Generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetSuggestions = async () => {
    if (!query.trim()) {
      message.error('Please enter a topic to get suggestions');
      return;
    }

    setSuggestionsLoading(true);
    try {
      const response = await articleGenerationApi.getArticleSuggestions(query.trim());
      if (response.success && response.data.suggestions) {
        setSuggestions(response.data.suggestions);
        message.success('Article suggestions generated!');
      } else {
        message.error('Failed to get suggestions');
      }
    } catch (error) {
      message.error('Failed to get suggestions');
      console.error('Suggestions error:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (generatedArticle?.content) {
      navigator.clipboard.writeText(generatedArticle.content);
      message.success('Article copied to clipboard!');
    }
  };

  const handleUseWithWrite = () => {
    if (generatedArticle) {
      // Store the generated content in sessionStorage for the write page
      sessionStorage.setItem('generatedContent', JSON.stringify({
        title: generatedArticle.title,
        content: generatedArticle.content,
        format: generatedArticle.format
      }));
      navigate('/write');
    }
  };

  return React.createElement('div', { className: "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" },
    React.createElement('div', { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" },
      // Header
      React.createElement('div', { className: "text-center mb-8" },
        React.createElement(Title, { level: 1, className: "flex items-center justify-center gap-3 mb-4" },
          React.createElement(PlusCircleOutlined, { className: "text-indigo-600" }),
          "AI Article Generation"
        ),
        React.createElement(Paragraph, { className: "text-xl text-gray-600 max-w-3xl mx-auto" },
          "Transform your ideas, theories, and research into beautifully formatted articles using AI. Simply provide your requirements and let our AI create professional content."
        )
      ),

      // Main Content Area
      React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-4 gap-8" },
        
        // Main Generation Panel
        React.createElement('div', { className: "lg:col-span-3" },
          React.createElement(Card, { className: "shadow-xl" },
            React.createElement(Title, { level: 3, className: "flex items-center gap-2 mb-6" },
              React.createElement(EditOutlined, { className: "text-blue-500" }),
              "Article Requirements"
            ),

            React.createElement(Space, { direction: "vertical", size: "large", className: "w-full" },
              
              // Topic/Query Input
              React.createElement('div', null,
                React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-2" },
                  "Article Topic or Research Question *"
                ),
                React.createElement(TextArea, {
                  placeholder: "What would you like to write about? Describe your main topic, research question, or thesis...",
                  value: query,
                  onChange: (e) => setQuery(e.target.value),
                  rows: 3,
                  maxLength: 1000,
                  showCount: true
                }),
                React.createElement(Text, { type: "secondary", className: "text-xs" },
                  "Be specific about your topic to get better results"
                )
              ),

              // Additional Content/Theories Input
              React.createElement('div', null,
                React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-2" },
                  "Additional Content, Theories, or Research (Optional)"
                ),
                React.createElement(TextArea, {
                  placeholder: "Include any supporting theories, research findings, data, quotes, or specific points you want the AI to incorporate into the article...",
                  value: inputText,
                  onChange: (e) => setInputText(e.target.value),
                  rows: 6,
                  maxLength: 5000,
                  showCount: true
                }),
                React.createElement(Text, { type: "secondary", className: "text-xs" },
                  "This helps the AI understand your perspective and include relevant information"
                )
              ),

              // AI Generation Section
              React.createElement(Card, {
                title: React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                  React.createElement(RobotOutlined, { style: { color: '#1890ff' } }),
                  React.createElement('span', null, 'AI Article Generation')
                ),
                style: { border: '1px solid #1890ff', background: '#fafafa' }
              },
                React.createElement(Space, { direction: 'vertical', size: 'middle', style: { width: '100%' } },
                  !showGenerationOptions ? 
                  React.createElement(Space, { direction: 'vertical', size: 'small', style: { width: '100%' } },
                    React.createElement(Text, { type: 'secondary' },
                      'Our AI will analyze your requirements and transform them into a well-structured, professional article. You can customize the style, length, and format before generation.'
                    ),
                    React.createElement('div', { style: { textAlign: 'center', marginTop: 16 } },
                      React.createElement(Button, {
                        type: 'primary',
                        icon: React.createElement(RobotOutlined),
                        onClick: () => setShowGenerationOptions(true),
                        size: 'large',
                        disabled: !query.trim()
                      }, 'Configure AI Generation')
                    )
                  ) :
                  React.createElement(Space, { direction: 'vertical', size: 'middle', style: { width: '100%' } },
                    React.createElement(Text, { strong: true }, 'Article Generation Settings'),
                    
                    // Settings Grid
                    React.createElement(Row, { gutter: [16, 16] },
                      React.createElement(Col, { span: 12 },
                        React.createElement('div', null,
                          React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-2" },
                            "Article Type"
                          ),
                          React.createElement(Select, {
                            value: articleType,
                            onChange: setArticleType,
                            className: "w-full"
                          },
                            React.createElement(Option, { value: "informative" }, "Informative"),
                            React.createElement(Option, { value: "tutorial" }, "Tutorial/How-to"),
                            React.createElement(Option, { value: "opinion" }, "Opinion/Editorial"),
                            React.createElement(Option, { value: "research" }, "Research Article"),
                            React.createElement(Option, { value: "review" }, "Review/Analysis"),
                            React.createElement(Option, { value: "listicle" }, "Listicle"),
                            React.createElement(Option, { value: "news" }, "News/Report")
                          )
                        )
                      ),
                      React.createElement(Col, { span: 12 },
                        React.createElement('div', null,
                          React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-2" },
                            "Article Length"
                          ),
                          React.createElement(Select, {
                            value: length,
                            onChange: setLength,
                            className: "w-full"
                          },
                            React.createElement(Option, { value: "short" }, "Short (500-800 words)"),
                            React.createElement(Option, { value: "medium" }, "Medium (1000-1500 words)"),
                            React.createElement(Option, { value: "long" }, "Long (2000-3000 words)")
                          )
                        )
                      ),
                      React.createElement(Col, { span: 12 },
                        React.createElement('div', null,
                          React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-2" },
                            "Writing Tone"
                          ),
                          React.createElement(Select, {
                            value: tone,
                            onChange: setTone,
                            className: "w-full"
                          },
                            React.createElement(Option, { value: "professional" }, "Professional"),
                            React.createElement(Option, { value: "academic" }, "Academic"),
                            React.createElement(Option, { value: "casual" }, "Casual/Friendly"),
                            React.createElement(Option, { value: "conversational" }, "Conversational"),
                            React.createElement(Option, { value: "formal" }, "Formal"),
                            React.createElement(Option, { value: "authoritative" }, "Authoritative")
                          )
                        )
                      ),
                      React.createElement(Col, { span: 12 },
                        React.createElement('div', null,
                          React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-2" },
                            "Output Format"
                          ),
                          React.createElement(Radio.Group, {
                            value: outputFormat,
                            onChange: (e) => setOutputFormat(e.target.value)
                          },
                            React.createElement(Radio, { value: "markdown" }, "Markdown"),
                            React.createElement(Radio, { value: "html" }, "HTML")
                          )
                        )
                      )
                    ),

                    // Action Buttons
                    React.createElement('div', { style: { paddingTop: 16 } },
                      React.createElement(Space, null,
                        React.createElement(Button, {
                          type: 'primary',
                          loading: loading,
                          onClick: handleGenerateArticle,
                          icon: loading ? React.createElement(LoadingOutlined) : React.createElement(SendOutlined),
                          size: 'large'
                        }, loading ? 'Generating Article...' : 'Generate Article'),
                        React.createElement(Button, {
                          onClick: () => setShowGenerationOptions(false)
                        }, 'Cancel')
                      )
                    ),

                    // Loading Alert
                    loading && React.createElement(Alert, {
                      message: 'AI is analyzing your requirements and generating the article...',
                      description: 'This process may take up to 60 seconds. Please wait.',
                      type: 'info',
                      showIcon: true,
                      icon: React.createElement(LoadingOutlined)
                    })
                  )
                )
              )
            )
          )
        ),

        // Suggestions Panel
        React.createElement('div', null,
          React.createElement(Card, { className: "shadow-xl h-fit" },
            React.createElement(Title, { level: 4, className: "mb-4" },
              React.createElement(BulbOutlined, { className: "mr-2 text-yellow-500" }),
              "Article Ideas"
            ),
            
            React.createElement(Space, { direction: 'vertical', size: 'small', className: 'w-full' },
              React.createElement(Button, {
                icon: React.createElement(BulbOutlined),
                onClick: handleGetSuggestions,
                loading: suggestionsLoading,
                block: true,
                disabled: !query.trim()
              }, 'Get Topic Suggestions'),

              suggestions.length > 0 ? (
                suggestions.map((suggestion, index) =>
                  React.createElement(Card, {
                    key: index,
                    size: "small",
                    className: "hover:shadow-md transition-shadow cursor-pointer",
                    onClick: () => setQuery(suggestion.title)
                  },
                    React.createElement(Text, { strong: true, className: "text-sm" }, suggestion.title),
                    React.createElement('br'),
                    React.createElement(Text, { className: "text-xs text-gray-600" }, suggestion.description),
                    React.createElement('br'),
                    React.createElement('div', { className: "flex gap-2 mt-2" },
                      React.createElement('span', { className: "text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded" },
                        suggestion.article_type
                      ),
                      React.createElement('span', { className: "text-xs px-2 py-1 bg-green-100 text-green-700 rounded" },
                        suggestion.estimated_length
                      )
                    )
                  )
                )
              ) : (
                React.createElement(Paragraph, { className: "text-gray-500 text-center text-sm" },
                  "Enter a topic above and click 'Get Topic Suggestions' to see related article ideas"
                )
              )
            )
          )
        )
      ),

      // Generated Article Display
      generatedArticle && React.createElement(Card, { className: "shadow-xl mt-8" },
        React.createElement('div', { className: "flex justify-between items-start mb-6" },
          React.createElement(Title, { level: 3, className: "flex items-center gap-2 mb-0" },
            React.createElement(FileTextOutlined, { className: "text-green-500" }),
            "Generated Article"
          ),
          React.createElement(Space, null,
            React.createElement(Button, {
              icon: React.createElement(CopyOutlined),
              onClick: handleCopyToClipboard
            }, "Copy Content"),
            React.createElement(Button, {
              type: "primary",
              onClick: handleUseWithWrite
            }, "Edit in Article Editor")
          )
        ),

        // Article Metadata
        React.createElement('div', { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg" },
          React.createElement('div', null,
            React.createElement(Text, { type: "secondary" }, "Word Count"),
            React.createElement('br'),
            React.createElement(Text, { strong: true }, generatedArticle.word_count)
          ),
          React.createElement('div', null,
            React.createElement(Text, { type: "secondary" }, "Reading Time"),
            React.createElement('br'),
            React.createElement(Text, { strong: true }, generatedArticle.reading_time + " min")
          ),
          React.createElement('div', null,
            React.createElement(Text, { type: "secondary" }, "Type"),
            React.createElement('br'),
            React.createElement(Text, { strong: true }, generatedArticle.article_type)
          ),
          React.createElement('div', null,
            React.createElement(Text, { type: "secondary" }, "Tone"),
            React.createElement('br'),
            React.createElement(Text, { strong: true }, generatedArticle.tone)
          )
        ),

        React.createElement(Divider),

        // Article Title
        React.createElement(Title, { level: 2, className: "mb-4" },
          generatedArticle.title
        ),

        // Article Content
        React.createElement('div', { className: "prose max-w-none" },
          generatedArticle.format === 'markdown' ?
            React.createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, generatedArticle.content) :
            React.createElement('div', { dangerouslySetInnerHTML: { __html: generatedArticle.content } })
        ),

        // Meta Description
        generatedArticle.meta_description && React.createElement(Alert, {
          message: "SEO Meta Description",
          description: generatedArticle.meta_description,
          type: "info",
          className: "mt-6"
        }),

        // Tags
        generatedArticle.tags && generatedArticle.tags.length > 0 && React.createElement('div', { className: "mt-4" },
          React.createElement(Text, { type: "secondary" }, "Tags: "),
          generatedArticle.tags.map(tag =>
            React.createElement('span', { 
              key: tag, 
              className: "inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs mr-2" 
            }, tag)
          )
        )
      )
    )
  );
};

export default ArticleGeneration;
