import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  List, 
  Tag, 
  Space, 
  Typography, 
  message, 
  Spin,
  Empty,
  Modal,
  Tooltip
} from 'antd';
import { 
  QuestionCircleOutlined, 
  PlayCircleOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ClockCircleOutlined,
  BookOutlined
} from '@ant-design/icons';
import { qaApi } from '../api/qaApi';
import { useAuth } from '../context/AuthContext';
import QATestModal from './QATestModal';
import QAFormModal from './QAFormModal';
import { useTranslation } from '../hooks/useTranslation';

const { Text, Title } = Typography;
const { confirm } = Modal;

const QAList = ({ articleId, articleAuthorId, article, showCreateButton = true, limit = 5 }) => {
  const navigate = useNavigate();
  const [qaTests, setQaTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [selectedQA, setSelectedQA] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingQA, setEditingQA] = useState(null);
  
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const displayedTests = showMore ? qaTests : qaTests.slice(0, limit);
  
  // Check if user can manage QA (author or admin)
  const canManageQA = () => {
    if (!isAuthenticated()) return false;
    return user?.role === 'admin' || user?.id === articleAuthorId || user?.user_id === articleAuthorId;
  };

  useEffect(() => {
    if (articleId) {
      fetchQATests();
    }
  }, [articleId]);

  const fetchQATests = async () => {
    try {
      setLoading(true);
      const response = await qaApi.getQAByArticleId(articleId);
      if (response.success) {
        console.log('QA Tests fetched:', response.data);
        setQaTests(response.data);
      } else {
        console.log('QA fetch response was not successful:', response);
      }
    } catch (error) {
      console.error('Error fetching QA tests:', error);
  message.error(t('qa.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (qa) => {
    if (!isAuthenticated()) {
  message.warning(t('qa.loginToTake'));
      return;
    }
    // Navigate to the new QA test page
    navigate(`/qa-test/${qa.id}`);
  };

  const handleEditQA = (qa) => {
    setEditingQA(qa);
    setShowFormModal(true);
  };

  const handleDeleteQA = (qa) => {
  confirm({
  title: t('qa.deleteTitle'),
  content: t('qa.deleteConfirm'),
  okText: t('qa.deleteYes'),
  okType: 'danger',
  cancelText: t('qa.deleteCancel'),
      onOk: async () => {
        try {
          const response = await qaApi.deleteQA(qa.id);
          if (response.success) {
            message.success(t('qa.deleteSuccess'));
            fetchQATests(); // Refresh the list
          }
        } catch (error) {
          console.error('Error deleting QA test:', error);
          message.error(t('qa.deleteFailed'));
        }
      },
    });
  };

  const handleCreateQA = () => {
    setEditingQA(null);
    setShowFormModal(true);
  };

  const calculateEstimatedTime = (questionsCount) => {
    return questionsCount * 5; // 5 minutes per question
  };

  if (loading) {
    return (
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <QuestionCircleOutlined style={{ color: '#1890ff' }} />
            <span>{t('qa.title')}</span>
          </div>
        }
        style={{ 
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: 'none',
          marginTop: 24,
          marginBottom: 20
        }}
        bodyStyle={{ padding: '16px 20px' }}
        className="sm:body-style-[padding:24px]"
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <QuestionCircleOutlined style={{ color: '#1890ff' }} />
              <span>{t('qa.title')}</span>
              {qaTests.length > 0 && (
                <Tag color="blue" style={{ marginLeft: 4 }}>
                  {qaTests.length}
                </Tag>
              )}
            </div>
            {showCreateButton && canManageQA() && (
              <Button type="primary" size="small" onClick={handleCreateQA}>
                {t('qa.create')}
              </Button>
            )}
          </div>
        }
        style={{ 
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: 'none',
          marginTop: 24,
          marginBottom: 24
        }}
        bodyStyle={{ padding: '16px 20px' }}
        className="sm:body-style-[padding:24px]"
      >
        {qaTests.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('qa.none')}
          />
        ) : (
          <>
            <List
              dataSource={displayedTests}
              renderItem={(qa) => (
                <List.Item
                  key={qa.id}
                  style={{ 
                    borderRadius: 8, 
                    border: '1px solid #f0f0f0', 
                    marginBottom: 12,
                    padding: 16,
                    background: '#fafafa'
                  }}
                    actions={[
                    <Tooltip title={t('qa.takeTestTooltip')}>
                      <Button 
                        type="primary" 
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleStartTest(qa)}
                      >
                        {t('qa.takeTest')}
                      </Button>
                    </Tooltip>,
                    ...(canManageQA() ? [
                      <Tooltip title={t('qa.edit')}>
                        <Button 
                          icon={<EditOutlined />}
                          onClick={() => handleEditQA(qa)}
                        />
                      </Tooltip>,
                      <Tooltip title={t('qa.deleteTitle')}>
                        <Button 
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteQA(qa)}
                        />
                      </Tooltip>
                    ] : [])
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BookOutlined />
                        <Text strong>{t('qa.testLabel')}</Text>
                      </div>
                    }
                    description={
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <Text type="secondary">
                            <QuestionCircleOutlined style={{ marginRight: 4 }} />
                            {qa.total_questions} {t('qa.questions')}
                          </Text>
                          <Text type="secondary">
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            ~{calculateEstimatedTime(qa.total_questions)} {t('qa.minutes')}
                          </Text>
                        </div>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
            
            {qaTests.length > limit && !showMore && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Button type="link" onClick={() => setShowMore(true)}>
                  {t('qa.showMore', { count: qaTests.length - limit })}
                </Button>
              </div>
            )}
            
            {showMore && qaTests.length > limit && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Button type="link" onClick={() => setShowMore(false)}>
                  {t('qa.showLess')}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* QA Test Modal */}
      <QATestModal
        visible={showTestModal}
        qa={selectedQA}
        onClose={() => {
          setShowTestModal(false);
          setSelectedQA(null);
        }}
      />

      {/* QA Form Modal */}
      <QAFormModal
        visible={showFormModal}
        articleId={articleId}
        article={article}
        editingQA={editingQA}
        onClose={() => {
          setShowFormModal(false);
          setEditingQA(null);
        }}
        onSuccess={() => {
          fetchQATests(); // Refresh the list
          setShowFormModal(false);
          setEditingQA(null);
        }}
      />
    </>
  );
};

export default QAList;
