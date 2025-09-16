/* eslint-disable */
/* @ts-nocheck */
/* JAF-ignore */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { 
  Layout, 
  Typography, 
  Button, 
  Space, 
  message,
  Spin,
  Card,
  Row,
  Col
} from 'antd';
import { 
  ArrowLeftOutlined,
  ClockCircleOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { qaApi } from '../api/qaApi';
import { useAuth } from '../context/AuthContext';
import QATestComponent from '../components/QATestComponent';
import QATestHistory from '../components/QATestHistory';

const { Content } = Layout;
const { Title, Text } = Typography;

const QATestPage = () => {
  const { qaId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [qaTest, setQaTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testCompleted, setTestCompleted] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
  message.warning(t('qaTest.messages.loginToTake'));
      navigate('/login');
      return;
    }

    if (qaId) {
      fetchQATest();
    }
  }, [qaId, isAuthenticated, navigate]);

  const fetchQATest = async () => {
    try {
      setLoading(true);
      const response = await qaApi.getQAById(qaId);
      if (response.success) {
        setQaTest(response.data);
      } else {
  message.error(t('qaTest.messages.notFound'));
        navigate(-1);
      }
    } catch (error) {
      console.error('Error fetching QA test:', error);
  message.error(t('qaTest.messages.loadError'));
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleTestComplete = (result) => {
    setTestCompleted(true);
  message.success(t('qaTest.messages.testCompletedScore', { score: result.score }));
  };

  const handleRetakeTest = () => {
    setTestCompleted(false);
  message.info(t('qaTest.messages.newTestInfo'));
  };

  const handleBackToArticle = () => {
    if (qaTest?.article_id) {
      navigate(`/articles/${qaTest.article_id}`);
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>{t('qaTest.messages.loading')}</Text>
          </div>
        </Content>
      </Layout>
    );
  }

  if (!qaTest) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <Text>{t('qaTest.messages.notFound')}</Text>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBackToArticle}
            >
              {t('qaTest.page.backToArticle')}
            </Button>
          </Space>
          
          <Title level={2} style={{ marginTop: 16, marginBottom: 8 }}>
            {t('qaTest.page.header')}
          </Title>
          <Text type="secondary">
            <ClockCircleOutlined /> {t('qaTest.page.subtitle', { count: qaTest.total_questions, minutes: qaTest.total_questions * 5 })}
          </Text>
        </div>

        <Row gutter={24}>
          {/* Left Column - QA Test */}
          <Col xs={24} lg={16}>
            <Card>
              <QATestComponent 
                qaTest={qaTest}
                onTestComplete={handleTestComplete}
                testCompleted={testCompleted}
              />
            </Card>
          </Col>

          {/* Right Column - Test History */}
          <Col xs={24} lg={8}>
              <Card 
              title={
                <Space>
                  <HistoryOutlined />
                  {t('qaTest.page.historyTitle')}
                </Space>
              }
            >
              <QATestHistory 
                qaId={qaId}
                userId={user?.id || user?.user_id}
                refreshTrigger={testCompleted}
                onRetakeTest={handleRetakeTest}
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default QATestPage;
