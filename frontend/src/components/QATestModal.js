import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { 
  Modal, 
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
  TrophyOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { qaApi } from '../api/qaApi';
import { qaResultsApi } from '../api/qaResultsApi';

// Add CSS styles for rich content
const richContentStyles = `
  .rich-content {
    line-height: 1.6;
    display: inline-block;
    width: 100%;
    vertical-align: top;
  }
  
  .rich-content img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 8px 4px;
    display: inline-block;
    vertical-align: middle;
  }
  
  .rich-content p {
    margin: 4px 0;
    padding: 0;
    display: inline-block;
    width: 100%;
  }
  
  .rich-content strong {
    font-weight: 600;
  }
  
  .rich-content em {
    font-style: italic;
  }
  
  .rich-content u {
    text-decoration: underline;
  }
  
  .rich-content a {
    color: #1890ff;
    text-decoration: none;
  }
  
  .rich-content a:hover {
    text-decoration: underline;
  }
  
  .rich-content br {
    line-height: 1;
  }
  
  /* Ensure HTML elements render properly inside the content */
  .rich-content * {
    max-width: 100%;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.innerHTML = richContentStyles;
  if (!document.head.querySelector('style[data-rich-content]')) {
    styleElement.setAttribute('data-rich-content', 'true');
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
      className: 'rich-content',
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

const QATestModal = ({ visible, qa, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [gradeResults, setGradeResults] = useState(null);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Calculate total time (questions count * 5 minutes in seconds)
  const totalTimeInSeconds = shuffledQuestions.length ? shuffledQuestions.length * 5 * 60 : 0;

  useEffect(() => {
    if (visible && qa) {
      // Reset state when modal opens
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTestStarted(false);
      setTestCompleted(false);
      setScore(0);
      setGradeResults(null);
      setLoading(false);
      setShuffledQuestions([]); // Reset questions first
      
      // Fetch detailed QA data with questions
      fetchDetailedQA();
    } else if (!visible) {
      // Clean up when modal closes
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTestStarted(false);
      setTestCompleted(false);
      setScore(0);
      setGradeResults(null);
      setLoading(false);
      setShuffledQuestions([]);
      setTimeLeft(0);
    }
  }, [visible, qa]);

  const fetchDetailedQA = async () => {
    try {
      setQuestionsLoading(true);
      if (qa && qa.id) {
        console.log('Fetching QA details for ID:', qa.id);
        const response = await qaApi.getQAById(qa.id);
        console.log('Fetched QA response:', response);
        if (response.success && response.data.questions) {
          // Ensure all questions have question_id, generate fallback if missing
          const questionsWithIds = response.data.questions.map((q, index) => ({
            ...q,
            question_id: q.question_id || `fallback_${qa.id}_${index}_${Date.now()}`
          }));
          
          // Shuffle questions for randomization
          const shuffled = [...questionsWithIds].sort(() => Math.random() - 0.5);
          console.log('Shuffled questions with IDs:', shuffled);
          setShuffledQuestions(shuffled);
        } else {
          console.error('No questions found in QA test');
          message.error('No questions found in this test');
        }
      }
    } catch (error) {
      console.error('Error fetching detailed QA:', error);
      message.error('Failed to load test questions');
    } finally {
      setQuestionsLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (testStarted && timeLeft > 0 && !testCompleted) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (testStarted && timeLeft === 0 && !testCompleted) {
      // Time's up - auto submit
      handleSubmitTest();
    }
    return () => clearTimeout(timer);
  }, [testStarted, timeLeft, testCompleted]);

  const startTest = () => {
    if (shuffledQuestions.length === 0) {
      message.error('No questions loaded. Please try again.');
      return;
    }
    
    // Re-shuffle questions every time test starts for randomization
    const reshuffled = [...shuffledQuestions].sort(() => Math.random() - 0.5);
    setShuffledQuestions(reshuffled);
    console.log('Questions re-shuffled for new test session');
    
    // Reset test state
    setCurrentQuestionIndex(0);
    setAnswers({});
    
    setTestStarted(true);
    setTimeLeft(totalTimeInSeconds);
  };

  const handleAnswerChange = (questionId, value) => {
    console.log('Answer changed:', { questionId, value });
    // Safety check for questionId
    if (!questionId) {
      console.error('Question ID is null or undefined!');
      return;
    }
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: value
      };
      console.log('Updated answers:', newAnswers);
      return newAnswers;
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitTest = async () => {
    try {
      setLoading(true);
      
      // Ensure we have questions and QA ID
      if (!qa || !qa.id) {
        message.error('Invalid test data');
        return;
      }
      
      if (shuffledQuestions.length === 0) {
        message.error('No questions loaded');
        return;
      }

      // Get user ID from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        message.error('Please login to submit test');
        return;
      }
      
      const user = JSON.parse(userStr);
      const userId = user.id;
      
      console.log('Submitting answers:', answers);
      console.log('QA ID:', qa.id);
      console.log('User ID:', userId);
      
      const response = await qaResultsApi.submitQAResult(qa.id, userId, answers);
      console.log('Submit response:', response);
      
      if (response.success) {
        setScore(response.data.score);  // Extract just the score number
        setGradeResults(response.data);  // Store full results for detailed view
        setTestCompleted(true);
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      message.error('Failed to submit test');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return React.createElement(TrophyOutlined, { style: { color: '#52c41a' } });
    if (score >= 60) return React.createElement(CheckCircleOutlined, { style: { color: '#faad14' } });
    return React.createElement(CloseCircleOutlined, { style: { color: '#ff4d4f' } });
  };

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = shuffledQuestions.length > 0 ? ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100 : 0;
  const answeredProgress = shuffledQuestions.length > 0 ? (answeredCount / shuffledQuestions.length) * 100 : 0;

  // Debug effect to track question changes and answer state
  useEffect(() => {
    console.log('Question index changed to:', currentQuestionIndex);
    if (currentQuestion) {
      console.log('Current question data:', currentQuestion);
      console.log('Current question ID:', currentQuestion.question_id);
      console.log('Answer for this question:', answers[currentQuestion.question_id]);
      console.log('All answers:', answers);
    } else {
      console.log('No current question available');
    }
  }, [currentQuestionIndex, currentQuestion, answers]);

  if (!qa) return null;

  return React.createElement(Modal, {
    title: null,
    open: visible,
    onCancel: onClose,
    footer: null,
    width: typeof window !== 'undefined' && window.innerWidth > 768 ? '90vw' : '95vw',
    style: { top: typeof window !== 'undefined' && window.innerWidth > 768 ? 20 : 10 },
    bodyStyle: { 
      maxHeight: typeof window !== 'undefined' && window.innerWidth > 768 ? '80vh' : '85vh', 
      overflowY: 'auto',
      padding: typeof window !== 'undefined' && window.innerWidth > 768 ? '24px' : '16px'
    },
    centered: false,
    destroyOnClose: true
  }, 
    !testStarted ? 
      // Test Instructions Screen
      React.createElement('div', { style: { textAlign: 'center', padding: '24px 0' } },
        React.createElement(Title, { level: 3 }, 'Ready to start the test?'),
        React.createElement(Space, { direction: 'vertical', size: 'large', style: { width: '100%' } },
          React.createElement('div', null,
            React.createElement(Text, { type: 'secondary', style: { fontSize: 16 } },
              'This test contains ', React.createElement('strong', null, shuffledQuestions.length, ' questions')
            )
          ),
          React.createElement('div', null,
            React.createElement(ClockCircleOutlined, { style: { fontSize: 24, color: '#1890ff', marginRight: 8 } }),
            React.createElement(Text, { style: { fontSize: 16 } },
              'You have ', React.createElement('strong', null, formatTime(totalTimeInSeconds)), ' to complete'
            )
          ),
          React.createElement('div', { style: { background: '#f0f8ff', padding: 16, borderRadius: 8, margin: '16px 0' } },
            React.createElement(Text, { type: 'secondary' },
              '• Questions will be randomized',
              React.createElement('br'),
              '• Each question has 4 options (A, B, C, D)',
              React.createElement('br'),
              '• You can navigate back and forth between questions',
              React.createElement('br'),
              '• Your score will be calculated immediately after submission'
            )
          ),
          React.createElement(Button, { 
            type: 'primary', 
            size: 'large', 
            onClick: startTest,
            loading: questionsLoading,
            disabled: questionsLoading || shuffledQuestions.length === 0
          }, questionsLoading ? 'Loading Questions...' : 'Start Test')
        )
      )
    : testCompleted ?
      // Test Results Screen - Detailed View
      React.createElement('div', { style: { padding: '20px 0' } },
        // Score Summary
        React.createElement(Card, { 
          style: { 
            marginBottom: 24, 
            textAlign: 'center',
            background: score >= 80 ? '#f6ffed' : score >= 60 ? '#fffbe6' : '#fff2f0',
            borderColor: score >= 80 ? '#b7eb8f' : score >= 60 ? '#ffe58f' : '#ffb3b3'
          }
        },
          React.createElement(Result, {
            icon: getScoreIcon(score),
            title: React.createElement('span', { 
              style: { 
                fontSize: 28, 
                fontWeight: 'bold',
                color: getScoreColor(score)
              }
            }, `${score?.toFixed(1)}%`),
            subTitle: React.createElement('div', null,
              React.createElement(Text, { style: { fontSize: 18 } },
                gradeResults ? 
                  `${gradeResults.correct_answers} out of ${gradeResults.total_questions} questions correct` :
                  `${Math.round((score / 100) * shuffledQuestions.length)} out of ${shuffledQuestions.length} questions correct`
              ),
              React.createElement('br'),
              React.createElement(Text, { 
                type: 'secondary',
                style: { fontSize: 16 }
              },
                score >= 80 ? '🎉 Excellent work!' : 
                score >= 60 ? '👍 Good job!' : 
                '📚 Keep studying and try again!'
              )
            )
          })
        ),

        // Detailed Question Results
        gradeResults && gradeResults.questions && React.createElement('div', null,
          React.createElement(Title, { 
            level: 3, 
            style: { marginBottom: 20, textAlign: 'center' }
          }, 'Detailed Results'),
          
          React.createElement(Space, { direction: 'vertical', size: 'large', style: { width: '100%' } },
            gradeResults.questions.map((question, index) => 
              React.createElement(Card, {
                key: question.question_id,
                style: { 
                  marginBottom: 16,
                  border: `2px solid ${question.is_correct ? '#52c41a' : '#ff4d4f'}`,
                  borderRadius: 12,
                  background: question.is_correct ? '#f6ffed' : '#fff2f0'
                }
              },
                React.createElement('div', null,
                  // Question header
                  React.createElement('div', { 
                    style: { 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: 16,
                      paddingBottom: 12,
                      borderBottom: '1px solid #f0f0f0'
                    }
                  },
                    React.createElement('div', {
                      style: {
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
                      }
                    }, index + 1),
                    React.createElement('div', { 
                      style: { 
                        margin: 0, 
                        flex: 1,
                        color: question.is_correct ? '#389e0d' : '#cf1322',
                        fontSize: '16px',
                        fontWeight: 600
                      }
                    }, React.createElement(RichContent, { 
                      content: question.question,
                      style: {}
                    })),
                    React.createElement('div', {
                      style: {
                        padding: '4px 12px',
                        borderRadius: 16,
                        background: question.is_correct ? '#52c41a' : '#ff4d4f',
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 'bold'
                      }
                    }, question.is_correct ? '✓ CORRECT' : '✗ INCORRECT')
                  ),

                  // Answer options
                  React.createElement(Space, { direction: 'vertical', size: 'small', style: { width: '100%' } },
                    ['A', 'B', 'C', 'D'].map(option => {
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
                        icon = React.createElement(CheckCircleOutlined, { 
                          style: { color: '#52c41a', marginRight: 8 }
                        });
                      }
                      
                      if (isSelected) {
                        fontWeight = 'bold';
                        fontStyle = 'italic';
                        if (!isCorrect) {
                          backgroundColor = '#fff2f0';
                          borderColor = '#ff4d4f';
                          textColor = '#cf1322';
                          icon = React.createElement(CloseCircleOutlined, { 
                            style: { color: '#ff4d4f', marginRight: 8 }
                          });
                        }
                      }
                      
                      return React.createElement('div', {
                        key: option,
                        style: {
                          padding: '12px 16px',
                          border: `2px solid ${borderColor}`,
                          borderRadius: 8,
                          backgroundColor,
                          color: textColor,
                          fontWeight,
                          fontStyle,
                          display: 'flex',
                          alignItems: 'center'
                        }
                      },
                        icon,
                        React.createElement('div', { 
                          style: { 
                            color: textColor, 
                            fontWeight: 'inherit',
                            fontStyle: 'inherit',
                            flex: 1
                          }
                        }, `${option}. `, React.createElement(RichContent, { 
                          content: answerText,
                          style: {}
                        }))
                      );
                    })
                  ),

                  // Explanation if available
                  question.explanation && React.createElement('div', {
                    style: {
                      marginTop: 16,
                      padding: 12,
                      background: '#f0f6ff',
                      border: '1px solid #d4edda',
                      borderRadius: 6
                    }
                  },
                    React.createElement(Text, { 
                      strong: true, 
                      style: { color: '#1890ff', marginBottom: 4, display: 'block' }
                    }, '💡 Explanation:'),
                    React.createElement(RichContent, { 
                      content: question.explanation,
                      style: { color: '#666' }
                    })
                  )
                )
              )
            )
          )
        ),

        // Action buttons
        React.createElement('div', { 
          style: { 
            textAlign: 'center', 
            marginTop: 32,
            paddingTop: 20,
            borderTop: '1px solid #f0f0f0'
          }
        },
          React.createElement(Space, { size: 'middle' },
            React.createElement(Button, { 
              type: 'primary', 
              size: 'large',
              onClick: onClose
            }, t('common.back')),
            React.createElement(Button, { 
              size: 'large',
              onClick: () => {
                // Reset test to retake
                setTestStarted(false);
                setTestCompleted(false);
                setAnswers({});
                setScore(0);
                setGradeResults(null);
                setCurrentQuestionIndex(0);
              }
            }, t('qaTest.retakeTest'))
          )
        )
      )
    :
      // Test Taking Screen
      React.createElement('div', null,
        // Header with timer and progress
        React.createElement('div', { 
          style: { 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 24,
            padding: 16,
            background: '#f5f5f5',
            borderRadius: 8
          }
        },
            React.createElement('div', null,
            React.createElement(Text, { strong: true }, t('qaTest.question'), ' ', currentQuestionIndex + 1, ' of ', shuffledQuestions.length)
          ),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 16 } },
            React.createElement('div', { style: { width: 120 } },
              React.createElement(Progress, { 
                percent: Math.round(progress), 
                size: 'small', 
                showInfo: false,
                strokeColor: '#1890ff'
              }),
              React.createElement(Text, { type: 'secondary', style: { fontSize: 12 } },
                'Progress: ', currentQuestionIndex + 1, '/', shuffledQuestions.length
              )
            ),
            React.createElement('div', { style: { width: 120 } },
              React.createElement(Progress, { 
                percent: Math.round(answeredProgress), 
                size: 'small', 
                showInfo: false,
                strokeColor: answeredCount === shuffledQuestions.length ? '#52c41a' : '#faad14'
              }),
              React.createElement(Text, { type: 'secondary', style: { fontSize: 12 } },
                'Answered: ', answeredCount, '/', shuffledQuestions.length
              )
            ),
            React.createElement('div', { 
              style: { 
                display: 'flex', 
                alignItems: 'center', 
                color: timeLeft < 300 ? '#ff4d4f' : '#1890ff'
              }
            },
              React.createElement(ClockCircleOutlined, { style: { marginRight: 4 } }),
              React.createElement(Text, { 
                style: { 
                  fontWeight: 'bold',
                  color: timeLeft < 300 ? '#ff4d4f' : '#1890ff'
                }
              }, formatTime(timeLeft))
            )
          )
        ),

        // Question Card
        currentQuestion && React.createElement(Card, { 
          style: { 
            marginBottom: 32,
            padding: '24px',
            borderRadius: 12,
            border: '2px solid #f0f0f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }
        },
          React.createElement('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: '2px solid #f0f0f0'
            }
          },
            React.createElement('div', {
              style: {
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#1890ff',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginRight: 16,
                fontSize: 16
              }
            }, currentQuestionIndex + 1),
            React.createElement('div', {
              style: {
                margin: 0,
                fontSize: '22px',
                lineHeight: '1.4',
                fontWeight: 600,
                color: '#262626',
                marginBottom: '24px'
              }
            }, React.createElement(RichContent, { 
              content: currentQuestion.question,
              style: {}
            }))
          ),
          
          React.createElement(Radio.Group, {
            key: currentQuestion.question_id || 'no-id',
            value: answers[currentQuestion.question_id] || undefined,
            onChange: (e) => {
              handleAnswerChange(currentQuestion.question_id, e.target.value);
            },
            style: { width: '100%' }
          },
            React.createElement(Space, { direction: 'vertical', size: 'large', style: { width: '100%' } },
              ['A', 'B', 'C', 'D'].map(option => 
                React.createElement(Radio, { 
                  key: option,
                  value: option, 
                  style: { 
                    fontSize: 18, 
                    padding: '16px 20px',
                    border: '2px solid #f0f0f0',
                    borderRadius: 8,
                    width: '100%',
                    margin: 0,
                    background: answers[currentQuestion.question_id] === option ? '#e6f7ff' : '#fafafa',
                    borderColor: answers[currentQuestion.question_id] === option ? '#1890ff' : '#f0f0f0'
                  }
                },
                  React.createElement('div', {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      padding: '8px 0'
                    }
                  },
                    React.createElement('span', {
                      style: {
                        fontWeight: 'bold',
                        marginRight: 12,
                        color: answers[currentQuestion.question_id] === option ? '#1890ff' : '#666',
                        fontSize: 18
                      }
                    }, `${option}.`),
                    React.createElement('div', { 
                      style: { 
                        fontSize: 16,
                        color: answers[currentQuestion.question_id] === option ? '#1890ff' : '#333',
                        lineHeight: '1.5',
                        flex: 1
                      }
                    }, React.createElement(RichContent, { 
                      content: currentQuestion[`answer_${option.toLowerCase()}`],
                      style: {}
                    }))
                  )
                )
              )
            )
          )
        ),

        // Navigation Buttons
        React.createElement('div', { 
          style: { 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: 24,
            padding: '20px 0'
          }
        },
          React.createElement(Button, { 
            disabled: currentQuestionIndex === 0,
            onClick: handlePrevQuestion,
            size: 'large',
            style: { minWidth: 120 }
          }, 'Previous'),
          
          React.createElement('div', { 
            style: { 
              display: 'flex', 
              alignItems: 'center',
              gap: 16
            }
          },
            React.createElement(Text, {
              style: {
                fontSize: 16,
                fontWeight: 'bold',
                color: '#666'
              }
            }, `${currentQuestionIndex + 1} of ${shuffledQuestions.length}`),
            
            currentQuestionIndex === shuffledQuestions.length - 1 ?
              React.createElement(Button, { 
                type: 'primary', 
                size: 'large',
                loading: loading,
                onClick: handleSubmitTest,
                disabled: answeredCount === 0,
                style: { 
                  minWidth: 140,
                  height: 48,
                  fontSize: 16,
                  fontWeight: 'bold'
                }
              }, 'Submit Test')
            :
              React.createElement(Button, { 
                type: 'primary',
                size: 'large',
                onClick: handleNextQuestion,
                style: { minWidth: 120 }
              }, 'Next')
          )
        ),

        // Question Navigation
        // React.createElement(Divider, { style: { margin: '24px 0' } }),
        // React.createElement(Card, {
        //   style: {
        //     background: '#f9f9f9',
        //     border: '1px solid #e8e8e8'
        //   }
        // },
        //   React.createElement('div', { style: { textAlign: 'center' } },
        //     React.createElement(Text, { 
        //       strong: true,
        //       style: { 
        //         marginBottom: 16, 
        //         display: 'block',
        //         fontSize: 16
        //       }
        //     }, 'Question Navigation'),
        //     React.createElement(Space, { wrap: true, size: [8, 8] },
        //       ...shuffledQuestions.map((_, index) =>
        //         React.createElement(Button, {
        //           key: index,
        //           size: 'middle',
        //           type: index === currentQuestionIndex ? 'primary' : 'default',
        //           shape: 'circle',
        //           style: {
        //             width: 40,
        //             height: 40,
        //             fontSize: 14,
        //             fontWeight: 'bold',
        //             backgroundColor: answers[shuffledQuestions[index]?.question_id] 
        //               ? (index === currentQuestionIndex ? undefined : '#52c41a')
        //               : undefined,
        //             borderColor: answers[shuffledQuestions[index]?.question_id] 
        //               ? (index === currentQuestionIndex ? undefined : '#52c41a')
        //               : undefined,
        //             color: answers[shuffledQuestions[index]?.question_id] && index !== currentQuestionIndex
        //               ? '#fff' : undefined
        //           },
        //           onClick: () => setCurrentQuestionIndex(index)
        //         }, index + 1)
        //       )
        //     )
        //   )
        // )
      )
  );
};

export default QATestModal;
