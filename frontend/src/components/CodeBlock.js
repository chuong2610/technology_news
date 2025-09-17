/* eslint-disable */
/* @ts-nocheck */
/* JAF-ignore */
import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button, message } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';



// Function to detect language from class names or content
const detectLanguage = (className, content) => {
  if (className) {
    // Check for common class patterns
    const classMatch = className.match(/language-(\w+)|lang-(\w+)|ql-syntax|(\w+)/);
    if (classMatch) {
      const detected = classMatch[1] || classMatch[2] || classMatch[3];
      if (detected === 'ql-syntax') return 'javascript'; // Default for ql-syntax
      // Map common variations
      const langMap = {
        'js': 'javascript',
        'ts': 'typescript',
        'py': 'python',
        'sh': 'bash',
        'shell': 'bash',
        'c++': 'cpp',
        'cs': 'csharp',
        'rb': 'ruby',
        'yml': 'yaml'
      };
      return langMap[detected.toLowerCase()] || detected.toLowerCase();
    }
  }
  
  // Try to detect from content patterns
  if (content) {
    const trimmed = content.trim();
    
    // Python patterns
    if (/^(def |import |from |class |if __name__|print\()/m.test(trimmed)) {
      return 'python';
    }
    
    // JavaScript patterns
    if (/(function|const|let|var|=>|\{|\}|console\.log)/m.test(trimmed)) {
      return 'javascript';
    }
    
    // JSON pattern
    if (/^\s*[\{\[].*[\}\]]\s*$/s.test(trimmed)) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch (e) {}
    }
    
    // HTML pattern
    if (/<[^>]+>/.test(trimmed)) {
      return 'html';
    }
    
    // CSS pattern
    if (/\{[^}]*:[^}]*\}/.test(trimmed)) {
      return 'css';
    }
    
    // Bash/Shell patterns
    if (/^(#!\/bin\/|curl|wget|sudo|apt|npm|pip|git)/m.test(trimmed)) {
      return 'bash';
    }
  }
  
  return 'javascript';
};

const CodeBlock = ({ code, language: propLanguage, showLineNumbers = true, className }) => {
  const [copied, setCopied] = useState(false);

  // Simple language detection
  const detectedLang = propLanguage || detectLanguage(className, code);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      message.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      message.error('Failed to copy code');
    }
  };

  return (
    <div className="code-block-wrapper" style={{ position: 'relative', marginBottom: '16px' }}>
      <div className="code-block-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2d3748',
        color: '#e2e8f0',
        padding: '8px 16px',
        borderTopLeftRadius: '6px',
        borderTopRightRadius: '6px',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        <span className="code-language">{detectedLang.toUpperCase()}</span>
        <Button
          type="text"
          size="small"
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={copyToClipboard}
          style={{
            color: copied ? '#48bb78' : '#e2e8f0',
            border: 'none',
            padding: '4px 8px',
            height: 'auto',
            fontSize: '12px'
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <SyntaxHighlighter
        language={detectedLang}
        style={tomorrow}
        showLineNumbers={showLineNumbers}
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: '6px',
          borderBottomRightRadius: '6px',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
        lineNumberStyle={{
          color: '#6b7280',
          paddingRight: '16px',
          marginRight: '16px',
          borderRight: '1px solid #374151'
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;