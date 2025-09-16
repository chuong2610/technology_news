import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Select, 
  Radio, 
  Space, 
  Typography, 
  Alert, 
  Row, 
  Col,
  message,
  Modal
} from 'antd';
import { 
  RobotOutlined, 
  LoadingOutlined, 
  BulbOutlined, 
  SendOutlined 
} from '@ant-design/icons';
import { articleGenerationApi } from '../api/articleGenerationApi';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const ArticleAIGeneration = ({ onComplete, visible, onClose }) => {
  // Form state
  const [query, setQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [articleType, setArticleType] = useState('informative');
  const [length, setLength] = useState('medium');
  const [tone, setTone] = useState('professional');
  const [outputFormat, setOutputFormat] = useState('markdown');
  const [loading, setLoading] = useState(false);
  const [showGenerationOptions, setShowGenerationOptions] = useState(false);

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
        // Call the parent callback with the generated article data
        onComplete({
          title: response.data.title,
          abstract: response.data.abstract,
          content: response.data.content,
          tags: response.data.tags || []
        });
        message.success('Article generated successfully! The form has been populated with the generated content.');
        onClose();
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

  const handleReset = () => {
    setQuery('');
    setInputText('');
    setArticleType('informative');
    setLength('medium');
    setTone('professional');
    setOutputFormat('markdown');
    setShowGenerationOptions(false);
  };

  return React.createElement(Modal, {
      title: React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
        React.createElement(RobotOutlined, { style: { color: '#1890ff' } }),
        React.createElement('span', null, 'AI Article Generation')
      ),
      open: visible,
      onCancel: onClose,
      footer: null,
      width: 800,
      style: { top: 20 }
    },
    React.createElement(Space, { direction: "vertical", size: "large", style: { width: '100%' } },
      
      // Main Generation Card
      React.createElement(Card, {
        style: { border: '1px solid #1890ff', background: '#fafafa' },
        bodyStyle: { padding: '16px' }
      },
        React.createElement(Space, { direction: "vertical", size: "middle", style: { width: '100%' } },
          
          !showGenerationOptions ? 
          React.createElement(Space, { direction: "vertical", size: "small", style: { width: '100%' } },
            React.createElement(Text, { type: "secondary" },
              "Transform your ideas, theories, and research into a well-structured article. Our AI will analyze your requirements and create professional content ready for publication."
            ),
            
            // Quick Topic Input
            React.createElement('div', null,
              React.createElement('label', { style: { display: 'block', marginBottom: 8, fontWeight: 500 } },
                "Article Topic or Research Question *"
              ),
              React.createElement(TextArea, {
                placeholder: "What would you like to write about? Describe your main topic, research question, or thesis...",
                value: query,
                onChange: (e) => setQuery(e.target.value),
                rows: 3,
                maxLength: 1000,
                showCount: true
              })
            ),

            React.createElement('div', { style: { textAlign: 'center', marginTop: 16 } },
              React.createElement(Button, {
                type: "primary",
                icon: React.createElement(BulbOutlined),
                onClick: () => setShowGenerationOptions(true),
                size: "large",
                disabled: !query.trim()
              }, "Configure AI Generation")
            )
          ) :
          React.createElement(Space, { direction: "vertical", size: "middle", style: { width: '100%' } },
            React.createElement(Text, { strong: true }, "Article Generation Settings"),
            
            // Topic Input
            React.createElement('div', null,
              React.createElement('label', { style: { display: 'block', marginBottom: 8, fontWeight: 500 } },
                "Article Topic or Research Question *"
              ),
              React.createElement(TextArea, {
                placeholder: "What would you like to write about? Describe your main topic, research question, or thesis...",
                value: query,
                onChange: (e) => setQuery(e.target.value),
                rows: 3,
                maxLength: 1000,
                showCount: true
              })
            ),

            // Additional Content
            React.createElement('div', null,
              React.createElement('label', { style: { display: 'block', marginBottom: 8, fontWeight: 500 } },
                "Additional Content, Theories, or Research (Optional)"
              ),
              React.createElement(TextArea, {
                placeholder: "Include any supporting theories, research findings, data, quotes, or specific points you want the AI to incorporate...",
                value: inputText,
                onChange: (e) => setInputText(e.target.value),
                rows: 4,
                maxLength: 5000,
                showCount: true
              })
            ),

            // Settings Grid
            React.createElement(Row, { gutter: [16, 16] },
              React.createElement(Col, { span: 12 },
                React.createElement('div', null,
                  React.createElement('label', { style: { display: 'block', marginBottom: 8, fontWeight: 500 } },
                    "Article Type"
                  ),
                  React.createElement(Select, {
                    value: articleType,
                    onChange: setArticleType,
                    style: { width: '100%' }
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
                  React.createElement('label', { style: { display: 'block', marginBottom: 8, fontWeight: 500 } },
                    "Article Length"
                  ),
                  React.createElement(Select, {
                    value: length,
                    onChange: setLength,
                    style: { width: '100%' }
                  },
                    React.createElement(Option, { value: "short" }, "Short (500-800 words)"),
                    React.createElement(Option, { value: "medium" }, "Medium (1000-1500 words)"),
                    React.createElement(Option, { value: "long" }, "Long (2000-3000 words)")
                  )
                )
              ),
              React.createElement(Col, { span: 12 },
                React.createElement('div', null,
                  React.createElement('label', { style: { display: 'block', marginBottom: 8, fontWeight: 500 } },
                    "Writing Tone"
                  ),
                  React.createElement(Select, {
                    value: tone,
                    onChange: setTone,
                    style: { width: '100%' }
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
                  React.createElement('label', { style: { display: 'block', marginBottom: 8, fontWeight: 500 } },
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
            React.createElement('div', { style: { paddingTop: 16, textAlign: 'center' } },
              React.createElement(Space, null,
                React.createElement(Button, {
                  type: "primary",
                  loading: loading,
                  onClick: handleGenerateArticle,
                  icon: loading ? React.createElement(LoadingOutlined) : React.createElement(SendOutlined),
                  size: "large"
                }, loading ? 'Generating Article...' : 'Generate Article'),
                React.createElement(Button, {
                  onClick: () => setShowGenerationOptions(false)
                }, "Back"),
                React.createElement(Button, {
                  onClick: handleReset
                }, "Reset")
              )
            ),

            // Loading Alert
            loading && React.createElement(Alert, {
              message: "AI is analyzing your requirements and generating the article...",
              description: "This process may take up to 60 seconds. Please wait.",
              type: "info",
              showIcon: true,
              icon: React.createElement(LoadingOutlined)
            })
          )
        )
      )
    )
  );
};

export default ArticleAIGeneration;
