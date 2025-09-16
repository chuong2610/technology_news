/* eslint-disable */
/* @ts-nocheck */
/* JAF-ignore */
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { 
  List, 
  Typography, 
  Space, 
  Tag, 
  Empty,
  Spin,
  Statistic,
  Button,
  Modal,
  Card
} from 'antd';
import { 
  ClockCircleOutlined,
  TrophyOutlined,
  CalendarOutlined,
  EyeOutlined,
  RedoOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { qaApi } from '../api/qaApi';
import { qaResultsApi } from '../api/qaResultsApi';

const { Text } = Typography;

// Helper component to render HTML content safely
const RichContent = ({ content, style = {} }) => {
  if (!content) return null;
  
  // Convert content to string if it's not already
  const contentStr = typeof content === 'string' ? content : String(content);
  
  return (
    <div className="rich-content" style={style}>
      <ReactMarkdown 
        children={contentStr}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          p: ({node, ...props}) => <span {...props} />,
          img: ({node, ...props}) => <img {...props} style={{maxWidth: '100%', height: 'auto'}} />,
        }}
      />
    </div>
  );
};

// Helper function to map answer keys to letters
const mapAnswerKeyToLetter = (answerKey) => {
  const mapping = {
    'answer_a': 'A',
    'answer_b': 'B', 
    'answer_c': 'C',
    'answer_d': 'D'
  };
  return mapping[answerKey] || answerKey;
};

// Add hover styles
const hoverStyles = `
  .history-item-hover:hover {
    background: #e6f7ff !important;
    border-color: #1890ff !important;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .rich-content {
    line-height: 1.6;
    display: inline-block;
    width: 100%;
  }
  
  .rich-content * {
    max-width: 100%;
  }
  
  .rich-content img {
    max-width: 100%;
    height: auto;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.innerHTML = hoverStyles;
  if (!document.head.querySelector('style[data-history-hover]')) {
    styleElement.setAttribute('data-history-hover', 'true');
    document.head.appendChild(styleElement);
  }
}

const QATestHistory = ({ qaId, userId, refreshTrigger, onRetakeTest }) => {
  const [allHistory, setAllHistory] = useState([]); // Store all history for stats
  const [displayHistory, setDisplayHistory] = useState([]); // Store only last 10 for display
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();
  const [selectedResult, setSelectedResult] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [qaId, userId, refreshTrigger]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await qaResultsApi.getTestHistory(userId, qaId);
      if (response.success) {
        // Sort by created_at descending (newest first)
        const sortedHistory = response.data.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        
  setAllHistory(sortedHistory); // Store all for statistics
  setDisplayHistory(sortedHistory.slice(0, 5)); // Show only last 5
      } else {
        setAllHistory([]);
        setDisplayHistory([]);
      }
    } catch (error) {
      console.error('Error fetching test history:', error);
      setAllHistory([]);
      setDisplayHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (resultId) => {
    try {
      const response = await qaResultsApi.getQAResultById(resultId);
      if (response.success) {
        setSelectedResult(response.data);
        setDetailModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching result details:', error);
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getScoreTag = (score) => {
    if (score >= 90) return { color: 'green', text: 'Excellent' };
    if (score >= 80) return { color: 'blue', text: 'Good' };
    if (score >= 70) return { color: 'orange', text: 'Fair' };
    return { color: 'red', text: 'Needs Improvement' };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin />
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">{t('qa.history.loading')}</Text>
        </div>
      </div>
    );
  }

  if (displayHistory.length === 0) {
    return (
      <div>
        {/* Retake Test Button */}
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <Button 
            type="primary" 
            icon={<RedoOutlined />}
            onClick={onRetakeTest}
            size="large"
          >
            {t('qaTest.page.retakeTest')}
          </Button>
        </div>
        
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('qa.history.noHistory')}
          style={{ padding: '20px' }}
        />
      </div>
    );
  }

  // Calculate statistics from ALL attempts, not just displayed ones
  const bestScore = Math.max(...allHistory.map(h => h.score || 0));
  const averageScore = allHistory.length > 0 
    ? allHistory.reduce((sum, h) => sum + (h.score || 0), 0) / allHistory.length 
    : 0;
  const totalAttempts = allHistory.length;

  return (
    <div>
      {/* Retake Test Button */}
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <Button 
          type="primary" 
          icon={<RedoOutlined />}
          onClick={onRetakeTest}
          size="large"
        >
          Retake Test
        </Button>
      </div>

      {/* Statistics */}
      <div style={{ marginBottom: 16, padding: '12px', background: '#f5f5f5', borderRadius: 8 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Statistic 
              title={t('qaTest.page.bestScore')} 
              value={bestScore} 
              precision={1}
              suffix="%" 
              valueStyle={{ fontSize: '14px', color: getScoreColor(bestScore) }}
            />
            <Statistic 
              title={t('qaTest.page.average')} 
              value={averageScore} 
              precision={1}
              suffix="%" 
              valueStyle={{ fontSize: '14px', color: getScoreColor(averageScore) }}
            />
            <Statistic 
              title={t('qaTest.page.attempts')} 
              value={totalAttempts} 
              valueStyle={{ fontSize: '14px' }}
            />
          </div>
        </Space>
      </div>

      {/* History List */}
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ marginBottom: 8, display: 'block' }}>
            {t('qaTest.page.recentAttempts', { count: displayHistory.length })}
          </Text>
      </div>
      
      <List
        size="small"
        dataSource={displayHistory}
        renderItem={(item, index) => {
          const scoreTag = getScoreTag(item.score || 0);
          return (
            <List.Item
              style={{
                padding: '12px',
                marginBottom: '8px',
                background: '#fafafa',
                borderRadius: 6,
                border: '1px solid #f0f0f0',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="history-item-hover"
              onClick={() => handleViewDetails(item.id)}
            >
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Space>
                    <TrophyOutlined style={{ color: getScoreColor(item.score || 0) }} />
                    <Text strong style={{ color: getScoreColor(item.score || 0) }}>
                      {(item.score || 0).toFixed(1)}%
                    </Text>
                  </Space>
                  <Space>
                    <Tag color={scoreTag.color} size="small">
                      {scoreTag.text}
                    </Tag>
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(item.id);
                      }}
                    />
                  </Space>
                </div>
                
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {item.correct_answers || 0}/{item.total_questions || 0} correct
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      <ClockCircleOutlined /> {formatDuration(item.time_taken || 0)}
                    </Text>
                  </div>
                  
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    <CalendarOutlined /> {formatDate(item.completed_at || item.created_at)}
                  </Text>
                </Space>
              </div>
            </List.Item>
          );
        }}
      />

      {/* Detail Modal */}
      <Modal
        title="Test Result Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedResult && (
          <div>
            <div style={{ marginBottom: 16, padding: '12px', background: '#f5f5f5', borderRadius: 8 }}>
              <Statistic 
                title="Final Score" 
                value={selectedResult.score} 
                precision={1}
                suffix="%" 
                valueStyle={{ color: getScoreColor(selectedResult.score) }}
              />
            </div>
            
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {(selectedResult.questions || []).map((question, index) => (
                <Card
                  key={question.question_id || index}
                  style={{ 
                    marginBottom: 16,
                    border: `2px solid ${question.is_correct ? '#52c41a' : '#ff4d4f'}`,
                    borderRadius: 12,
                    background: question.is_correct ? '#f6ffed' : '#fff2f0'
                  }}
                >
                  <div>
                    {/* Question header */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: 16,
                      paddingBottom: 12,
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: question.is_correct ? '#52c41a' : '#ff4d4f',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        marginRight: 12,
                        fontSize: 14
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ 
                        margin: 0, 
                        flex: 1,
                        color: question.is_correct ? '#389e0d' : '#cf1322',
                        fontSize: '16px',
                        fontWeight: 600
                      }}>
                        <RichContent content={question.question} />
                      </div>
                      <div style={{
                        padding: '4px 12px',
                        borderRadius: 16,
                        background: question.is_correct ? '#52c41a' : '#ff4d4f',
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}>
                        {question.is_correct ? '✓ CORRECT' : '✗ INCORRECT'}
                      </div>
                    </div>

                    {/* Answer options */}
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      {['A', 'B', 'C', 'D'].map(option => {
                        const answerText = question[`answer_${option.toLowerCase()}`];
                        const correctAnswerLetter = mapAnswerKeyToLetter(question.correct_answer);
                        const selectedAnswerLetter = mapAnswerKeyToLetter(question.selected_answer);
                        const isCorrect = correctAnswerLetter === option;
                        const isSelected = selectedAnswerLetter === option;
                        
                        let backgroundColor = '#f9f9f9';
                        let borderColor = '#d9d9d9';
                        let textColor = '#000';
                        let icon = null;
                        let fontWeight = 'normal';
                        let fontStyle = 'normal';
                        
                        if (isCorrect) {
                          backgroundColor = '#f6ffed';
                          borderColor = '#52c41a';
                          textColor = '#389e0d';
                          icon = <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />;
                        }
                        
                        if (isSelected) {
                          fontWeight = 'bold';
                          fontStyle = 'italic';
                          if (!isCorrect) {
                            backgroundColor = '#fff2f0';
                            borderColor = '#ff4d4f';
                            textColor = '#cf1322';
                            icon = <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />;
                          }
                        }
                        
                        return (
                          <div
                            key={option}
                            style={{
                              padding: '12px 16px',
                              border: `2px solid ${borderColor}`,
                              borderRadius: 8,
                              backgroundColor,
                              color: textColor,
                              fontWeight,
                              fontStyle,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            {icon}
                            <div style={{ 
                              color: textColor, 
                              fontWeight: 'inherit',
                              fontStyle: 'inherit',
                              flex: 1
                            }}>
                              <strong>{option}.</strong> <RichContent content={answerText} />
                            </div>
                          </div>
                        );
                      })}
                    </Space>

                    {/* Explanation */}
                    {question.explanation && (
                      <div style={{
                        marginTop: 16,
                        padding: 12,
                        background: '#f0f6ff',
                        border: '1px solid #d4edda',
                        borderRadius: 6
                      }}>
                        <Text strong style={{ color: '#1890ff', marginBottom: 4, display: 'block' }}>
                          💡 Explanation:
                        </Text>
                        <RichContent content={question.explanation} style={{ color: '#666' }} />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QATestHistory;
