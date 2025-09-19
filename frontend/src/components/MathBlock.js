import React from 'react';
import 'katex/dist/katex.min.css';
import './MathBlock.css';
import katex from 'katex';

/**
 * MathBlock component for rendering LaTeX equations using KaTeX
 * @param {string} tex - The LaTeX expression to render
 * @param {boolean} display - Whether to render in display mode (block) or inline mode
 * @param {object} options - Additional KaTeX options
 */
const MathBlock = ({ tex, display = false, options = {} }) => {
  if (!tex) return null;
  
  try {
    // Normalize tex: convert placeholder double-backslashes to single backslash
    let normalizedTex = typeof tex === 'string' ? tex.replace(/\\\\/g, '\\').trim() : tex;
    // Default KaTeX options
    const defaultOptions = {
      displayMode: display,
      throwOnError: false,
      strict: false,
      trust: false,
      ...options
    };
    
    // Render LaTeX to HTML string
    let html = katex.renderToString(normalizedTex, defaultOptions);
    // If rendering produced an error-like result, try toggling displayMode as a fallback
    if (!html || (typeof html === 'string' && html.toLowerCase().includes('error'))) {
      const altOptions = { ...defaultOptions, displayMode: !defaultOptions.displayMode };
      html = katex.renderToString(normalizedTex, altOptions);
    }
    
    // Return rendered math with appropriate styling
    return React.createElement('span', {
      className: display ? 'math-block' : 'math-inline',
      dangerouslySetInnerHTML: { __html: html }
    });
  } catch (error) {
    console.warn('KaTeX rendering error:', error);
    // Fallback: display the raw LaTeX
    return React.createElement('span', {
      className: display ? 'math-block' : 'math-inline'
    }, display ? `$$${tex}$$` : `$${tex}$`);
  }
};

/**
 * Utility function to parse LaTeX from HTML and extract math expressions
 * @param {string} htmlContent - HTML content that may contain math expressions
 * @returns {Array} Array of found math expressions with their positions
 */
const extractMathFromHTML = (htmlContent) => {
  if (!htmlContent || typeof htmlContent !== 'string') return [];
  
  const mathExpressions = [];
  
  // Find inline math expressions: <span class='math-inline'>$...$</span>
  const inlineRegex = /<span[^>]*class=['"]math-inline['"][^>]*>\$(.*?)\$<\/span>/g;
  let match;
  
  while ((match = inlineRegex.exec(htmlContent)) !== null) {
    mathExpressions.push({
      type: 'inline',
      tex: match[1],
      fullMatch: match[0],
      index: match.index
    });
  }
  
  // Find block math expressions: <div class='math-block'>$$...$$</div>
  const blockRegex = /<div[^>]*class=['"]math-block['"][^>]*>\$\$(.*?)\$\$<\/div>/g;
  
  while ((match = blockRegex.exec(htmlContent)) !== null) {
    mathExpressions.push({
      type: 'block',
      tex: match[1],
      fullMatch: match[0],
      index: match.index
    });
  }
  
  return mathExpressions;
};

export { extractMathFromHTML };
export default MathBlock;