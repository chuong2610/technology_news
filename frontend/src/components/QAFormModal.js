import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  Space, 
  Typography, 
  message,
  Divider,
  Card,
  Select,
  Row,
  Col,
  InputNumber,
  Spin,
  Alert,
  Upload,
  Switch
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  QuestionCircleOutlined,
  RobotOutlined,
  EditOutlined,
  LoadingOutlined,
  UploadOutlined,
  FileImageOutlined
} from '@ant-design/icons';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { qaApi } from '../api/qaApi';
import { apiClientFormData, createFormData } from '../api/config';
import { useTranslation } from '../hooks/useTranslation';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const QAFormModal = ({ visible, articleId, article, editingQA, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generationLoading, setGenerationLoading] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [showGenerationOptions, setShowGenerationOptions] = useState(false);
  const [useRichText, setUseRichText] = useState(false);
  const [questionImages, setQuestionImages] = useState({});
  const quillRefs = useRef({});
  const [questions, setQuestions] = useState([{
    question: '',
    answer_a: '',
    answer_b: '',
    answer_c: '',
    answer_d: '',
    correct_answer: 'A',
    explanation: '',
    question_image: null
  }]);

  useEffect(() => {
    if (visible) {
      if (editingQA) {
        // Editing mode - populate form with existing data
        if (editingQA.questions && editingQA.questions.length > 0) {
          setQuestions(editingQA.questions.map(q => ({
            question_id: q.question_id, // Preserve the question ID
            question: q.question || '',
            answer_a: q.answer_a || '',
            answer_b: q.answer_b || '',
            answer_c: q.answer_c || '',
            answer_d: q.answer_d || '',
            correct_answer: q.correct_answer === 'answer_a' ? 'A' :
                           q.correct_answer === 'answer_b' ? 'B' :
                           q.correct_answer === 'answer_c' ? 'C' :
                           q.correct_answer === 'answer_d' ? 'D' : 
                           q.correct_answer || 'A', // Handle both formats
            explanation: q.explanation || ''
          })));
        }
      } else {
        // Creating mode - reset to single empty question
        setQuestions([{
          question: '',
          answer_a: '',
          answer_b: '',
          answer_c: '',
          answer_d: '',
          correct_answer: 'A',
          explanation: '',
          question_image: null
        }]);
        setUseRichText(false);
        setQuestionImages({});
      }
      form.resetFields();
    }
  }, [visible, editingQA, form]);
  const { t } = useTranslation();

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      answer_a: '',
      answer_b: '',
      answer_c: '',
      answer_d: '',
      correct_answer: 'A',
      explanation: '',
      question_image: null
    }]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);
    }
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  // Process base64 images in content (similar to ArticleForm.js)
  const processBase64Images = async (text) => {
    if (!text) return text;
    
    const regex = /<img[^>]+src=["'](data:image\/[a-zA-Z0-9+\-\.]+;base64,[^"']+)["'][^>]*>/g;
    let match;
    let newText = text;
    const uploads = [];
    
    while ((match = regex.exec(text)) !== null) {
      const dataUrl = match[1];
      if (!dataUrl) continue;
      uploads.push(dataUrl);
    }

    for (const dataUrl of uploads) {
      try {
        // Convert dataURL to Blob
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'upload.png', { type: blob.type });

        const fd = new FormData();
        fd.append('file', file);

        // Use the same file upload endpoint as articles
        const uploadResp = await apiClientFormData.post('/files/', fd);
        const url = uploadResp.data?.url || uploadResp.data?.data?.url;
        if (url) {
          newText = newText.split(dataUrl).join(url);
        }
      } catch (e) {
        console.error('Failed to upload inline image', e);
      }
    }

    return newText;
  };

  // Handle question image upload
  const handleQuestionImageChange = (index, info) => {
    if (info.file.status === 'done' || info.file.originFileObj) {
      const file = info.file.originFileObj || info.file;
      const newQuestions = [...questions];
      newQuestions[index].question_image = file;
      setQuestions(newQuestions);
    }
  };

  const validateQuestions = () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        message.error(`Question ${i + 1}: Question text is required`);
        return false;
      }
      if (!q.answer_a.trim() || !q.answer_b.trim() || !q.answer_c.trim() || !q.answer_d.trim()) {
        message.error(`Question ${i + 1}: All answer options are required`);
        return false;
      }
      if (!q.correct_answer) {
        message.error(`Question ${i + 1}: Correct answer must be selected`);
        return false;
      }
    }
    return true;
  };

  const handleGenerateQA = async () => {
    if (!article) {
  message.error(t('qa.form.articleRequired'));
      return;
    }

    if (!article.title && !article.content && !article.abstract) {
      message.error('Article must have title, content, or abstract for AI generation');
      return;
    }

    try {
      setGenerationLoading(true);
      
      const articleData = {
        article_id: articleId,
        title: article.title || '',
        abstract: article.abstract || '',
        content: article.content || '',
        num_questions: numQuestions
      };

      const response = await qaApi.generateQA(articleData);

      if (response.success && response.data && response.data.questions) {
        const generatedQuestions = response.data.questions.map(q => ({
          question_id: q.question_id, // Preserve the generated question_id
          question: q.question || '',
          answer_a: q.answer_a || '',
          answer_b: q.answer_b || '',
          answer_c: q.answer_c || '',
          answer_d: q.answer_d || '',
          correct_answer: q.correct_answer === 'answer_a' ? 'A' :
                         q.correct_answer === 'answer_b' ? 'B' :
                         q.correct_answer === 'answer_c' ? 'C' :
                         q.correct_answer === 'answer_d' ? 'D' : 'A',
          explanation: q.explanation || ''
        }));

        setQuestions(generatedQuestions);
        setShowGenerationOptions(false);
        
        message.success(t('qa.form.generatedSuccess', { count: generatedQuestions.length }));
        
        if (response.method_used === 'fallback') {
          message.warning(response.warning || 'AI service unavailable, used fallback questions');
        }
      } else {
        throw new Error(response.error || 'Failed to generate questions');
      }
    } catch (error) {
      console.error('Error generating QA:', error);
      message.error('Failed to generate questions. Please try again or create questions manually.');
      message.error(t('qa.form.generateFailed'));
    } finally {
      setGenerationLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateQuestions()) {
      return;
    }

    try {
      setLoading(true);
      
      // Process questions and handle image uploads
      const processedQuestions = await Promise.all(questions.map(async (q, index) => {
        let processedQuestion = { ...q };

        // Process base64 images in rich text content if rich text is enabled
        if (useRichText) {
          processedQuestion.question = await processBase64Images(q.question);
          processedQuestion.answer_a = await processBase64Images(q.answer_a);
          processedQuestion.answer_b = await processBase64Images(q.answer_b);
          processedQuestion.answer_c = await processBase64Images(q.answer_c);
          processedQuestion.answer_d = await processBase64Images(q.answer_d);
          processedQuestion.explanation = await processBase64Images(q.explanation);
        }

        return {
          question_id: q.question_id, // Preserve existing ID if editing
          question: processedQuestion.question,
          answer_a: processedQuestion.answer_a,
          answer_b: processedQuestion.answer_b,
          answer_c: processedQuestion.answer_c,
          answer_d: processedQuestion.answer_d,
          correct_answer: q.correct_answer === 'A' ? 'answer_a' :
                         q.correct_answer === 'B' ? 'answer_b' :
                         q.correct_answer === 'C' ? 'answer_c' :
                         q.correct_answer === 'D' ? 'answer_d' : 'answer_a',
          explanation: processedQuestion.explanation || ''
        };
      }));

      let qaData;
      let response;

      // Check if we have any question images
      const hasImages = questions.some(q => q.question_image);

      if (editingQA) {
        // Editing existing QA test - use existing ID
        qaData = {
          id: editingQA.id,  // Use the existing QA test ID
          article_id: articleId,  // Keep reference to article
          questions: processedQuestions
        };

        if (hasImages) {
          // Use FormData for file upload
          const formData = createFormData(qaData);
          
          // Add question images
          questions.forEach((q, index) => {
            if (q.question_image) {
              const imageFile = q.question_image.originFileObj ? q.question_image.originFileObj : q.question_image;
              formData.append(`question_${index}_image`, imageFile);
            }
          });

          response = await apiClientFormData.put(`/qas/${editingQA.id}`, formData);
        } else {
          response = await qaApi.updateQA(editingQA.id, qaData);
        }
      } else {
        // Creating new QA test - generate unique ID
        const uniqueQAId = `qa_${articleId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        qaData = {
          id: uniqueQAId,  // Generate unique ID for new QA test
          article_id: articleId,  // Link to the article
          questions: processedQuestions
        };

        if (hasImages) {
          // Use FormData for file upload
          const formData = createFormData(qaData);
          
          // Add question images
          questions.forEach((q, index) => {
            if (q.question_image) {
              const imageFile = q.question_image.originFileObj ? q.question_image.originFileObj : q.question_image;
              formData.append(`question_${index}_image`, imageFile);
            }
          });

          response = await apiClientFormData.post('/qas/', formData);
        } else {
          response = await qaApi.createQA(qaData);
        }
      }

      if (response.success || response.data) {
        message.success(`QA test ${editingQA ? 'updated' : 'created'} successfully`);
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving QA test:', error);
      message.error(`Failed to ${editingQA ? 'update' : 'create'} QA test`);
    } finally {
      setLoading(false);
    }
  };

  // Rich text editor configuration (same as ArticleForm.js)
  const quillModules = {
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

  // Upload props for question images
  const getUploadProps = (questionIndex) => ({
    name: 'question_image',
    listType: 'picture',
    maxCount: 1,
    beforeUpload: () => false, // Prevent auto upload
    onChange: (info) => handleQuestionImageChange(questionIndex, info),
    accept: 'image/*',
    showUploadList: {
      showPreviewIcon: true,
      showRemoveIcon: true,
      showDownloadIcon: false,
    },
  });

  // Normalize Upload event to value for Form
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList ? e.fileList : e;
  };

  return React.createElement(Modal, {
    title: React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
      React.createElement(QuestionCircleOutlined, { style: { color: '#1890ff' } }),
      React.createElement('span', null, editingQA ? t('qa.edit') || t('qa.create') : t('qa.create'))
    ),
    open: visible,
    onCancel: onClose,
    width: 900,
    footer: [
      React.createElement(Button, { key: 'cancel', onClick: onClose }, t('common.cancel')),
      React.createElement(Button, { 
        key: 'submit', 
        type: 'primary', 
        loading: loading,
        onClick: handleSubmit,
        disabled: questions.length === 0
      }, editingQA ? t('qa.update') || t('qa.create') : t('qa.create'))
    ],
    destroyOnClose: true
  },
    React.createElement('div', { style: { maxHeight: 600, overflowY: 'auto', padding: '16px 0' } },
      React.createElement(Space, { direction: 'vertical', size: 'large', style: { width: '100%' } },
        React.createElement('div', { style: { background: '#f0f8ff', padding: 16, borderRadius: 8 } },
          React.createElement(Text, { type: 'secondary' },
            'Create multiple-choice questions for this article. Each question should have 4 options (A, B, C, D) with one correct answer. Questions will be randomized when users take the test.'
          )
        ),

        // AI Generation Section
        !editingQA && article && React.createElement(Card, {
          title: React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
            React.createElement(RobotOutlined, { style: { color: '#722ed1' } }),
            React.createElement('span', null, t('qa.form.aiTitle') || 'AI Question Generation')
          ),
          style: { border: '1px solid #722ed1', background: '#fafafa' }
        },
              React.createElement(Space, { direction: 'vertical', size: 'middle', style: { width: '100%' } },
                !showGenerationOptions ? 
              React.createElement(Space, { direction: 'vertical', size: 'small', style: { width: '100%' } },
                React.createElement(Text, { type: 'secondary' },
                  'Let AI analyze your article content and automatically generate high-quality multiple-choice questions. You can edit all generated questions afterward.'
                ),
                React.createElement('div', { style: { textAlign: 'center', marginTop: 16 } },
                  React.createElement(Button, {
                    type: 'primary',
                    icon: React.createElement(RobotOutlined),
                    onClick: () => setShowGenerationOptions(true),
                    size: 'large',
                    style: { background: '#722ed1', borderColor: '#722ed1' }
                  }, t('qa.form.generateAI') || 'Generate Questions with AI')
                )
              ) :
              React.createElement(Space, { direction: 'vertical', size: 'middle', style: { width: '100%' } },
                React.createElement(Text, { strong: true }, t('qa.form.aiSettings') || 'AI Question Generation Settings'),
                React.createElement(Row, { gutter: 16, align: 'middle' },
                  React.createElement(Col, { span: 12 },
                    React.createElement('div', null,
                      React.createElement(Text, { style: { display: 'block', marginBottom: 8 } }, 'Number of Questions'),
                      React.createElement(InputNumber, {
                        min: 3,
                        max: 10,
                        value: numQuestions,
                        onChange: setNumQuestions,
                        style: { width: '100%' }
                      })
                    )
                  ),
                  React.createElement(Col, { span: 12 },
                    React.createElement('div', { style: { paddingTop: 24 } },
                      React.createElement(Space, null,
                        React.createElement(Button, {
                          type: 'primary',
                          loading: generationLoading,
                          onClick: handleGenerateQA,
                          icon: generationLoading ? React.createElement(LoadingOutlined) : React.createElement(RobotOutlined),
                          style: { background: '#722ed1', borderColor: '#722ed1' }
                        }, generationLoading ? t('qa.form.generating') || 'Generating...' : t('qa.form.generate') || 'Generate'),
                        React.createElement(Button, {
                          onClick: () => setShowGenerationOptions(false)
                        }, t('common.cancel'))
                      )
                    )
                  )
                ),
                generationLoading && React.createElement(Alert, {
                  message: 'AI is analyzing your article and generating questions...',
                  description: 'This may take up to 30 seconds. Please wait.',
                  type: 'info',
                  showIcon: true,
                  icon: React.createElement(LoadingOutlined)
                })
              )
          )
        ),

        // Rich Text Editor Toggle
        React.createElement(Card, {
          title: React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
            React.createElement(EditOutlined, { style: { color: '#1890ff' } }),
            React.createElement('span', null, 'Content Editor Options')
          ),
          style: { border: '1px solid #1890ff', background: '#fafafa' }
        },
          React.createElement(Space, { direction: 'vertical', size: 'middle', style: { width: '100%' } },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
              React.createElement('div', null,
                React.createElement(Text, { strong: true }, 'Rich Text Editor'),
                React.createElement('br'),
                React.createElement(Text, { type: 'secondary', style: { fontSize: 12 } },
                  'Enable rich text editing with images, videos, and formatting for questions and answers'
                )
              ),
              React.createElement(Switch, {
                checked: useRichText,
                onChange: setUseRichText,
                checkedChildren: 'Rich Text',
                unCheckedChildren: 'Plain Text'
              })
            )
          )
        ),

        ...questions.map((question, index) =>
          React.createElement(Card, { 
            key: index,
            title: React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
              React.createElement('span', null, 'Question ', index + 1),
              questions.length > 1 && React.createElement(Button, { 
                danger: true, 
                size: 'small', 
                icon: React.createElement(DeleteOutlined),
                onClick: () => removeQuestion(index)
              }, 'Remove')
            ),
            style: { border: '1px solid #d9d9d9' }
          },
            React.createElement(Space, { direction: 'vertical', size: 'middle', style: { width: '100%' } },
              // Question Text
              React.createElement('div', null,
                React.createElement(Text, { strong: true, style: { display: 'block', marginBottom: 8 } },
                  'Question Text ', React.createElement('span', { style: { color: '#ff4d4f' } }, '*')
                ),
                useRichText ? 
                  React.createElement(ReactQuill, {
                    theme: 'snow',
                    value: question.question,
                    onChange: (value) => updateQuestion(index, 'question', value),
                    modules: quillModules,
                    placeholder: 'Enter your question here...',
                    style: { marginBottom: 16 }
                  }) :
                  React.createElement(TextArea, {
                    placeholder: 'Enter your question here...',
                    value: question.question,
                    onChange: (e) => updateQuestion(index, 'question', e.target.value),
                    rows: 3,
                    maxLength: 500,
                    showCount: true
                  })
              ),

              // Question Image Upload (when not using rich text)
              !useRichText && React.createElement('div', null,
                React.createElement(Text, { strong: true, style: { display: 'block', marginBottom: 8 } },
                  'Question Image (Optional)'
                ),
                React.createElement(Upload, getUploadProps(index),
                  React.createElement(Button, { icon: React.createElement(FileImageOutlined) }, 'Upload Question Image')
                )
              ),

              // Answer Options
              React.createElement('div', null,
                React.createElement(Text, { strong: true, style: { display: 'block', marginBottom: 8 } },
                  'Answer Options ', React.createElement('span', { style: { color: '#ff4d4f' } }, '*')
                ),
                React.createElement(Row, { gutter: [16, 16] },
                  React.createElement(Col, { span: 12 },
                    React.createElement('div', null,
                      React.createElement(Text, { style: { fontWeight: 500 } }, 'A.'),
                      useRichText ? 
                        React.createElement(ReactQuill, {
                          theme: 'snow',
                          value: question.answer_a,
                          onChange: (value) => updateQuestion(index, 'answer_a', value),
                          modules: quillModules,
                          placeholder: 'Option A',
                          style: { marginTop: 4 }
                        }) :
                        React.createElement(Input, {
                          placeholder: 'Option A',
                          value: question.answer_a,
                          onChange: (e) => updateQuestion(index, 'answer_a', e.target.value),
                          style: { marginTop: 4 }
                        })
                    )
                  ),
                  React.createElement(Col, { span: 12 },
                    React.createElement('div', null,
                      React.createElement(Text, { style: { fontWeight: 500 } }, 'B.'),
                      useRichText ? 
                        React.createElement(ReactQuill, {
                          theme: 'snow',
                          value: question.answer_b,
                          onChange: (value) => updateQuestion(index, 'answer_b', value),
                          modules: quillModules,
                          placeholder: 'Option B',
                          style: { marginTop: 4 }
                        }) :
                        React.createElement(Input, {
                          placeholder: 'Option B',
                          value: question.answer_b,
                          onChange: (e) => updateQuestion(index, 'answer_b', e.target.value),
                          style: { marginTop: 4 }
                        })
                    )
                  ),
                  React.createElement(Col, { span: 12 },
                    React.createElement('div', null,
                      React.createElement(Text, { style: { fontWeight: 500 } }, 'C.'),
                      useRichText ? 
                        React.createElement(ReactQuill, {
                          theme: 'snow',
                          value: question.answer_c,
                          onChange: (value) => updateQuestion(index, 'answer_c', value),
                          modules: quillModules,
                          placeholder: 'Option C',
                          style: { marginTop: 4 }
                        }) :
                        React.createElement(Input, {
                          placeholder: 'Option C',
                          value: question.answer_c,
                          onChange: (e) => updateQuestion(index, 'answer_c', e.target.value),
                          style: { marginTop: 4 }
                        })
                    )
                  ),
                  React.createElement(Col, { span: 12 },
                    React.createElement('div', null,
                      React.createElement(Text, { style: { fontWeight: 500 } }, 'D.'),
                      useRichText ? 
                        React.createElement(ReactQuill, {
                          theme: 'snow',
                          value: question.answer_d,
                          onChange: (value) => updateQuestion(index, 'answer_d', value),
                          modules: quillModules,
                          placeholder: 'Option D',
                          style: { marginTop: 4 }
                        }) :
                        React.createElement(Input, {
                          placeholder: 'Option D',
                          value: question.answer_d,
                          onChange: (e) => updateQuestion(index, 'answer_d', e.target.value),
                          style: { marginTop: 4 }
                        })
                    )
                  )
                )
              ),

              // Correct Answer
              React.createElement(Row, { gutter: 16 },
                React.createElement(Col, { span: 12 },
                  React.createElement(Text, { strong: true, style: { display: 'block', marginBottom: 8 } },
                    'Correct Answer ', React.createElement('span', { style: { color: '#ff4d4f' } }, '*')
                  ),
                  React.createElement(Select, {
                    value: question.correct_answer,
                    onChange: (value) => updateQuestion(index, 'correct_answer', value),
                    style: { width: '100%' }
                  },
                    React.createElement(Option, { value: 'A' }, 'A'),
                    React.createElement(Option, { value: 'B' }, 'B'),
                    React.createElement(Option, { value: 'C' }, 'C'),
                    React.createElement(Option, { value: 'D' }, 'D')
                  )
                )
              ),

              // Explanation (Optional)
              React.createElement('div', null,
                React.createElement(Text, { strong: true, style: { display: 'block', marginBottom: 8 } },
                  'Explanation (Optional)'
                ),
                useRichText ? 
                  React.createElement(ReactQuill, {
                    theme: 'snow',
                    value: question.explanation,
                    onChange: (value) => updateQuestion(index, 'explanation', value),
                    modules: quillModules,
                    placeholder: 'Explain why this answer is correct (optional)...',
                    style: { height: '120px', marginBottom: '42px' }
                  }) :
                  React.createElement(TextArea, {
                    placeholder: 'Explain why this answer is correct (optional)...',
                    value: question.explanation,
                    onChange: (e) => updateQuestion(index, 'explanation', e.target.value),
                    rows: 2,
                    maxLength: 300,
                    showCount: true
                  })
              )
            )
          )
        ),

        React.createElement('div', { style: { textAlign: 'center' } },
          React.createElement(Button, { 
            type: 'dashed', 
            icon: React.createElement(PlusOutlined),
            onClick: addQuestion,
            size: 'large',
            style: { width: '100%', height: 60 }
          }, 'Add Another Question')
        ),

        React.createElement('div', { style: { background: '#f6ffed', border: '1px solid #b7eb8f', padding: 16, borderRadius: 8 } },
          React.createElement(Text, { type: 'secondary' },
            '📝 Tips for creating good questions:',
            React.createElement('br'),
            '• Make questions clear and specific',
            React.createElement('br'),
            '• Ensure all answer options are plausible',
            React.createElement('br'),
            '• Avoid trick questions that rely on technicalities',
            React.createElement('br'),
            '• Test important concepts from the article'
          )
        )
      )
    )
  );
};

export default QAFormModal;
