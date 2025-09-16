/* eslint-disable */
/* @ts-nocheck */
/* JAF-ignore */
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Radio, 
  Button, 
  Typography, 
  Space, 
  Divider, 
  message,
  Result,
  Progress,
  Statistic
} from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  TrophyOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { qaApi } from '../api/qaApi';
import { qaResultsApi } from '../api/qaResultsApi';
import { useTranslation } from '../hooks/useTranslation';

// Add CSS styles for rich content
const richContentStyles = `
  .qa-rich-content {
    line-height: 1.6;
    display: inline-block;
    width: 100%;
    vertical-align: top;
  }
  
  .qa-rich-content img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 8px 4px;
    display: inline-block;
    vertical-align: middle;
  }
  
  .qa-rich-content p {
    margin: 4px 0;
    padding: 0;
    display: inline-block;
    width: 100%;
  }
  
  .qa-rich-content strong {
    font-weight: 600;
  }
  
  .qa-rich-content em {
    font-style: italic;
  }
  
  .qa-rich-content u {
    text-decoration: underline;
  }
  
  .qa-rich-content a {
    color: #1890ff;
    text-decoration: none;
  }
  
  .qa-rich-content a:hover {
    text-decoration: underline;
  }
  
  .qa-rich-content br {
    line-height: 1;
  }
  
  /* Ensure HTML elements render properly inside the content */
  .qa-rich-content * {
    max-width: 100%;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.innerHTML = richContentStyles;
  if (!document.head.querySelector('style[data-qa-rich-content]')) {
    styleElement.setAttribute('data-qa-rich-content', 'true');
    document.head.appendChild(styleElement);
  }
}

const { Title, Text } = Typography;

// Helper component to render HTML content safely
const RichContent = ({ content, style = {} }) => {
  if (!content) return null;
  
  // Convert content to string if it's not already
  const contentString = String(content);
  
  // Check if content contains HTML tags
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(contentString);
  
  if (hasHtmlTags) {
    // For HTML content, use a div with dangerouslySetInnerHTML
    return React.createElement('div', {
      style: {
        ...style,
        lineHeight: '1.6',
        display: 'inline-block',
        width: '100%'
      },
      className: 'qa-rich-content',
      dangerouslySetInnerHTML: { __html: contentString }
    });
  }
  
  // Return plain text if no HTML
  return React.createElement('span', { style }, contentString);
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

const QATestComponent = ({ qaTest, onTestComplete, testCompleted }) => {
  const { t } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [gradeResults, setGradeResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  // Calculate total time (questions count * 5 minutes in seconds)
  const totalTimeInSeconds = shuffledQuestions.length ? shuffledQuestions.length * 5 * 60 : 0;

  useEffect(() => {
    if (qaTest) {
      // Reset state when component loads
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTestStarted(false);
      setScore(0);
      setGradeResults(null);
      setLoading(false);
      
      // Shuffle questions for randomization
      if (qaTest.questions && qaTest.questions.length > 0) {
        const shuffled = [...qaTest.questions].sort(() => Math.random() - 0.5);
        setShuffledQuestions(shuffled);
        setTimeLeft(shuffled.length * 5 * 60); // 5 minutes per question
      }
    }
  }, [qaTest]);

  // Timer effect
  useEffect(() => {
    let timer;
    if (testStarted && timeLeft > 0 && !testCompleted) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [testStarted, timeLeft, testCompleted]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartTest = () => {
    setTestStarted(true);
    message.success(t('qaTest.messages.testStarted'));
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitTest = async () => {
    try {
      setLoading(true);
      
      // Get user ID from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        message.error('Please login to submit test');
        return;
      }
      
      const user = JSON.parse(userStr);
      const userId = user.id;
      
      // Convert frontend format (A, B, C, D) to backend format (answer_a, answer_b, answer_c, answer_d)
      const convertedAnswers = {};
      Object.keys(answers).forEach(questionId => {
        const userChoice = answers[questionId]; // A, B, C, or D
        const backendFormat = userChoice ? `answer_${userChoice.toLowerCase()}` : null;
        convertedAnswers[questionId] = backendFormat;
      });
      
      console.log('Original answers:', answers);
      console.log('Converted answers for backend:', convertedAnswers);
      console.log('User ID:', userId);
      
      const response = await qaResultsApi.submitQAResult(qaTest.id, userId, convertedAnswers);
      
      if (response.success) {
        setScore(response.data.score);
        setGradeResults(response.data);
        // Notify parent; parent will show the success message to avoid duplicates
        onTestComplete(response.data);
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      message.error('Failed to submit test');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const progress = shuffledQuestions.length > 0 ? ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100 : 0;

  if (!qaTest || shuffledQuestions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text>Loading test questions...</Text>
      </div>
    );
  }

  if (testCompleted && gradeResults) {
    return (
      <div>
        <Result
          icon={<TrophyOutlined style={{ color: '#52c41a' }} />}
          title={t('qaTest.results.completed')}
          subTitle={
            <Space direction="vertical" size="middle">
              <div>
                <Statistic
                  title={t('qaTest.results.yourScore')}
                  value={gradeResults.score}
                  precision={1}
                  suffix="%"
                  valueStyle={{ 
                    color: gradeResults.score >= 70 ? '#52c41a' : gradeResults.score >= 50 ? '#faad14' : '#ff4d4f' 
                  }}
                />
              </div>
              <Text>
                {t('qaTest.results.correctAnswers', { 
                  correct: gradeResults.correct_answers, 
                  total: gradeResults.total_questions 
                })}
              </Text>
            </Space>
          }
        />
        
        <Divider />
        
        <div style={{ marginTop: 24 }}>
          <Title level={4}>{t('qaTest.results.detailedResults')}</Title>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {gradeResults.questions.map((question, index) => (
              <Card 
                key={question.question_id}
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
                        💡 {t('qaTest.results.explanation')}
                      </Text>
                      <RichContent content={question.explanation} style={{ color: '#666' }} />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </Space>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Space direction="vertical" size="large">
          <div>
            <Title level={3}>{t('qaTest.ready')}</Title>
            <Text type="secondary">
              {t('qaTest.testInfo', { 
                count: shuffledQuestions.length, 
                minutes: shuffledQuestions.length * 5 
              })}
            </Text>
          </div>
          
          <div>
            <Text strong>{t('qaTest.instructions.title')}</Text>
            <ul style={{ textAlign: 'left', marginTop: 8 }}>
              <li>{t('qaTest.instructions.selectAnswer')}</li>
              <li>{t('qaTest.instructions.navigate')}</li>
              <li>{t('qaTest.instructions.submit')}</li>
              <li>{t('qaTest.instructions.timeLimit', { minutes: shuffledQuestions.length * 5 })}</li>
            </ul>
          </div>
          
          <Button 
            type="primary" 
            size="large"
            onClick={handleStartTest}
            icon={<ClockCircleOutlined />}
          >
            {t('qaTest.startTest')}
          </Button>
        </Space>
      </div>
    );
  }

  return (
    <div>
      {/* Progress and Timer */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text>{t('qaTest.progress.question', { current: currentQuestionIndex + 1, total: shuffledQuestions.length })}</Text>
          <Space>
            <ClockCircleOutlined />
            <Text style={{ color: timeLeft < 300 ? '#ff4d4f' : '#1890ff' }}>
              {formatTime(timeLeft)}
            </Text>
          </Space>
        </div>
        <Progress 
          percent={progress} 
          showInfo={false}
          strokeColor={timeLeft < 300 ? '#ff4d4f' : '#52c41a'}
        />
      </div>

      {/* Current Question */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <div style={{ marginBottom: 16, fontSize: '18px', fontWeight: 600, color: '#262626' }}>
              <RichContent content={currentQuestion.question} />
            </div>
            
            <Radio.Group
              value={answers[currentQuestion.question_id]}
              onChange={(e) => handleAnswerChange(currentQuestion.question_id, e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Radio value="A" style={{ display: 'flex', alignItems: 'flex-start', padding: '8px' }}>
                  <div>A. <RichContent content={currentQuestion.answer_a} /></div>
                </Radio>
                <Radio value="B" style={{ display: 'flex', alignItems: 'flex-start', padding: '8px' }}>
                  <div>B. <RichContent content={currentQuestion.answer_b} /></div>
                </Radio>
                <Radio value="C" style={{ display: 'flex', alignItems: 'flex-start', padding: '8px' }}>
                  <div>C. <RichContent content={currentQuestion.answer_c} /></div>
                </Radio>
                <Radio value="D" style={{ display: 'flex', alignItems: 'flex-start', padding: '8px' }}>
                  <div>D. <RichContent content={currentQuestion.answer_d} /></div>
                </Radio>
              </Space>
            </Radio.Group>
          </div>
        </Space>
      </Card>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
          icon={<ArrowLeftOutlined />}
        >
          {t('qaTest.navigation.previous')}
        </Button>

        <Space>
          <Text type="secondary">
            {t('qaTest.progress.answered', { answered: Object.keys(answers).length, total: shuffledQuestions.length })}
          </Text>
          
          {currentQuestionIndex === shuffledQuestions.length - 1 ? (
            <Button 
              type="primary" 
              loading={loading}
              onClick={handleSubmitTest}
              disabled={Object.keys(answers).length === 0}
            >
              {t('qaTest.submitTest')}
            </Button>
          ) : null}
        </Space>

        <Button 
          disabled={currentQuestionIndex === shuffledQuestions.length - 1}
          onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
          icon={<ArrowRightOutlined />}
        >
          {t('qaTest.navigation.next')}
        </Button>
      </div>
    </div>
  );
};

export default QATestComponent;
